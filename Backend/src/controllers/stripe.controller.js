const crypto = require("crypto");
const userModel = require("../models/user.model");
const env = require("../config/env");

const PRO_CREDITS = Number(process.env.STRIPE_PRO_CREDITS) || 10;
const PRO_PRICE_CENTS = Number(process.env.STRIPE_PRO_PRICE_CENTS) || 999;

function getClientUrl() {
  return String(env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
}

async function stripeRequest(path, params = {}, method = "POST") {
  if (!env.STRIPE_SECRET_KEY) {
    const error = new Error("Stripe is not configured on the server");
    error.statusCode = 503;
    throw error;
  }

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    },
  };

  if (method !== "GET") {
    options.headers["Content-Type"] = "application/x-www-form-urlencoded";
    options.body = new URLSearchParams(params);
  }

  const response = await fetch(`https://api.stripe.com/v1/${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Stripe request failed");
    error.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw error;
  }

  return data;
}

async function creditCompletedCheckout(session) {
  if (!session || session.payment_status !== "paid") {
    return { credited: false, reason: "Payment has not been completed" };
  }

  const userId = session.metadata?.userId;
  const credits = Number(session.metadata?.credits) || PRO_CREDITS;

  if (!userId) {
    return { credited: false, reason: "Checkout session has no user metadata" };
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return { credited: false, reason: "User not found" };
  }

  // Webhooks and the success-page confirmation may both run, so credit once.
  if (user.lastStripeCheckoutSessionId === session.id) {
    return { credited: false, alreadyCredited: true, resumeCredits: Number(user.resumeCredits) || 0 };
  }

  user.plan = "pro";
  user.resumeCredits = (Number(user.resumeCredits) || 0) + credits;
  user.lastStripeCheckoutSessionId = session.id;
  await user.save();

  return { credited: true, resumeCredits: user.resumeCredits };
}

async function createCheckoutSessionController(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const clientUrl = getClientUrl();
    const session = await stripeRequest("checkout/sessions", {
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(PRO_PRICE_CENTS),
      "line_items[0][price_data][product_data][name]": "Resume Analyzer Pro",
      "line_items[0][price_data][product_data][description]": `${PRO_CREDITS} additional AI resume analysis credits`,
      "line_items[0][quantity]": "1",
      "metadata[userId]": String(user._id),
      "metadata[credits]": String(PRO_CREDITS),
      success_url: `${clientUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/pricing?checkout=cancelled`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
}

function verifyStripeSignature(rawBody, signatureHeader) {
  if (!signatureHeader || !env.STRIPE_WEBHOOK_SECRET) return false;

  const parts = signatureHeader.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;

  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", env.STRIPE_WEBHOOK_SECRET).update(payload, "utf8").digest("hex");

  return signatures.some((signature) => {
    const expectedBuffer = Buffer.from(expected, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");
    return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  });
}

async function stripeWebhookController(req, res, next) {
  try {
    if (!verifyStripeSignature(req.body, req.headers["stripe-signature"])) {
      return res.status(400).json({ message: "Invalid Stripe webhook signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));

    if (event.type === "checkout.session.completed") {
      await creditCompletedCheckout(event.data.object);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

async function confirmCheckoutSessionController(req, res, next) {
  try {
    const sessionId = String(req.query.session_id || "").trim();
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ message: "A valid checkout session ID is required" });
    }

    const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}`, {}, "GET");
    const sessionUserId = session.metadata?.userId;

    // Never allow one logged-in user to confirm another user's checkout.
    if (!sessionUserId || String(sessionUserId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Checkout session does not belong to this user" });
    }

    const result = await creditCompletedCheckout(session);
    const user = await userModel.findById(req.user.id).select("plan resumeCredits");

    return res.status(200).json({
      confirmed: session.payment_status === "paid",
      credited: result.credited || result.alreadyCredited === true,
      plan: user?.plan || "free",
      resumeCredits: Number(user?.resumeCredits) || 0,
    });
  } catch (err) {
    next(err);
  }
}

async function getBillingStatusController(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id).select("plan resumeCredits");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ plan: user.plan || "free", resumeCredits: Number(user.resumeCredits) || 0 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCheckoutSessionController,
  stripeWebhookController,
  confirmCheckoutSessionController,
  getBillingStatusController,
};
