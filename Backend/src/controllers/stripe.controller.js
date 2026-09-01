const crypto = require("crypto");
const userModel = require("../models/user.model");
const env = require("../config/env");
const {
  getBillingSnapshot,
  normalizePlan,
  getPlanConfig,
  PLAN_CONFIG,
} = require("../services/credit.service");

const PLAN_PRICES_CENTS = {
  pro: Number(process.env.STRIPE_PRO_PRICE_CENTS) || 999,
  premium: Number(process.env.STRIPE_PREMIUM_PRICE_CENTS) || 1999,
};
const PLAN_RANK = { free: 0, pro: 1, premium: 2 };

function getClientUrl() {
  return String(env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
}

async function stripeRequest(path, params = {}, method = "POST") {
  if (!env.STRIPE_SECRET_KEY) {
    const error = new Error("Stripe is not configured on the server");
    error.statusCode = 503;
    throw error;
  }
  const options = {
    method,
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  };
  if (method !== "GET") {
    options.headers["Content-Type"] = "application/x-www-form-urlencoded";
    options.body = new URLSearchParams(params);
  }
  const response = await fetch(`https://api.stripe.com/v1/${path}`, options);
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Stripe request failed");
    error.statusCode =
      response.status >= 400 && response.status < 500 ? 400 : 502;
    throw error;
  }
  return data;
}

async function creditCompletedCheckout(session) {
  if (
    !session ||
    session.mode !== "payment" ||
    session.payment_status !== "paid"
  )
    return { credited: false, reason: "Payment has not been completed" };
  const userId = session.metadata?.userId;
  const plan = normalizePlan(session.metadata?.plan);
  const config = getPlanConfig(plan);
  const tokens = Number(session.metadata?.tokens) || config.tokensPerPurchase;
  if (!userId)
    return { credited: false, reason: "Checkout session has no user metadata" };
  if (
    !["pro", "premium"].includes(plan) ||
    !Number.isInteger(tokens) ||
    tokens <= 0
  )
    return {
      credited: false,
      reason: "Checkout session contains an invalid paid plan",
    };

  const user = await userModel.findOneAndUpdate(
    { _id: userId, processedStripeCheckoutSessionIds: { $ne: session.id } },
    {
      $set: { plan, lastStripeCheckoutSessionId: session.id },
      $addToSet: { processedStripeCheckoutSessionIds: session.id },
      $inc: { aiTokens: tokens },
    },
    { new: true, projection: { plan: 1, aiTokens: 1 } },
  );
  if (!user) {
    const existingUser = await userModel
      .findById(userId)
      .select("plan aiTokens processedStripeCheckoutSessionIds");
    if (!existingUser) return { credited: false, reason: "User not found" };
    return {
      credited: false,
      alreadyCredited:
        existingUser.processedStripeCheckoutSessionIds?.includes(session.id) ===
        true,
      aiTokens: Number(existingUser.aiTokens) || 0,
    };
  }
  return { credited: true, aiTokens: Number(user.aiTokens) || 0 };
}

async function createCheckoutSessionController(req, res, next) {
  try {
    const requestedPlan = String(req.body?.plan || "")
      .trim()
      .toLowerCase();
    if (!["pro", "premium"].includes(requestedPlan))
      return res
        .status(400)
        .json({ message: "Choose a valid Pro or Premium plan." });
    const config = PLAN_CONFIG[requestedPlan];
    const priceCents = PLAN_PRICES_CENTS[requestedPlan];
    const user = await userModel
      .findById(req.user.id)
      .select("_id plan aiTokens emailVerified authProvider");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Google already verifies the identity/email through Google's ID token.
    // Only local email/password accounts need our own email-verification step.
    if (user.authProvider !== "google" && !user.emailVerified) {
      return res.status(403).json({
        code: "EMAIL_VERIFICATION_REQUIRED",
        message: "Please verify your email before proceeding to a paid plan.",
      });
    }

    const currentPlan = normalizePlan(user.plan);
    if (PLAN_RANK[requestedPlan] < PLAN_RANK[currentPlan])
      return res
        .status(400)
        .json({
          message: `You're already on ${getPlanConfig(currentPlan).label}. Choose ${getPlanConfig(currentPlan).label} again for more tokens, or upgrade to ${requestedPlan === "pro" ? "Premium" : "a higher plan"}.`,
        });

    const session = await stripeRequest("checkout/sessions", {
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(priceCents),
      "line_items[0][price_data][product_data][name]": `Resume Analyzer ${config.label}`,
      "line_items[0][price_data][product_data][description]": `${config.tokensPerPurchase.toLocaleString()} AI tokens`,
      "line_items[0][quantity]": "1",
      "metadata[userId]": String(user._id),
      "metadata[plan]": requestedPlan,
      "metadata[tokens]": String(config.tokensPerPurchase),
      success_url: `${getClientUrl()}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getClientUrl()}/pricing?checkout=cancelled`,
    });
    return res
      .status(200)
      .json({
        url: session.url,
        sessionId: session.id,
        plan: requestedPlan,
        planLabel: config.label,
        tokens: config.tokensPerPurchase,
        priceCents,
        currentTokens: Number(user.aiTokens) || 0,
      });
  } catch (err) {
    next(err);
  }
}

function verifyStripeSignature(rawBody, signatureHeader) {
  if (!signatureHeader || !env.STRIPE_WEBHOOK_SECRET) return false;
  const parts = signatureHeader.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const timestampNumber = Number(timestamp);
  if (
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() / 1000 - timestampNumber) > 300
  )
    return false;
  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", env.STRIPE_WEBHOOK_SECRET)
    .update(payload, "utf8")
    .digest("hex");
  return signatures.some((signature) => {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

async function stripeWebhookController(req, res, next) {
  try {
    if (!verifyStripeSignature(req.body, req.headers["stripe-signature"]))
      return res
        .status(400)
        .json({ message: "Invalid Stripe webhook signature" });
    const event = JSON.parse(req.body.toString("utf8"));
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type)
    )
      await creditCompletedCheckout(event.data.object);
    return res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

async function confirmCheckoutSessionController(req, res, next) {
  try {
    const sessionId = String(req.query.session_id || "").trim();
    if (!sessionId || !sessionId.startsWith("cs_"))
      return res
        .status(400)
        .json({ message: "A valid checkout session ID is required" });
    const session = await stripeRequest(
      `checkout/sessions/${encodeURIComponent(sessionId)}`,
      {},
      "GET",
    );
    if (
      !session.metadata?.userId ||
      String(session.metadata.userId) !== String(req.user.id)
    )
      return res
        .status(403)
        .json({ message: "Checkout session does not belong to this user" });
    const result = await creditCompletedCheckout(session);
    const billing = await getBillingSnapshot(req.user.id);
    return res
      .status(200)
      .json({
        confirmed: session.payment_status === "paid",
        credited: result.credited || result.alreadyCredited === true,
        purchasedPlan: normalizePlan(session.metadata?.plan),
        purchasedTokens: Number(session.metadata?.tokens) || 0,
        plan: billing?.plan || "free",
        planLabel: billing?.planLabel || "Free",
        aiTokens: billing?.aiTokens || 0,
        tokensPerPurchase: billing?.tokensPerPurchase || 3000,
        planTokens: billing?.planTokens || 3000,
        tokenCosts: billing?.tokenCosts || {},
      });
  } catch (err) {
    next(err);
  }
}

async function getBillingStatusController(req, res, next) {
  try {
    const billing = await getBillingSnapshot(req.user.id);
    if (!billing) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(billing);
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
