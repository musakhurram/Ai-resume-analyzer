const userModel = require("../models/user.model");

const PLAN_CONFIG = {
  free: {
    label: "Free",
    creditsPerPurchase: 0,
  },
  pro: {
    label: "Pro",
    creditsPerPurchase: Number(process.env.STRIPE_PRO_CREDITS) || 10,
  },
};

function normalizePlan(plan) {
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, plan) ? plan : "free";
}

function getPlanConfig(plan) {
  return PLAN_CONFIG[normalizePlan(plan)];
}

/**
 * Atomically consumes one AI resume credit. Keeping the decrement on the
 * server prevents users from bypassing limits by changing frontend state.
 */
async function consumeResumeCredit(userId) {
  if (!userId) {
    const error = new Error("Authentication is required to use AI resume credits");
    error.statusCode = 401;
    throw error;
  }

  const user = await userModel.findOneAndUpdate(
    {
      _id: userId,
      resumeCredits: { $gt: 0 },
    },
    {
      $inc: { resumeCredits: -1 },
    },
    {
      new: true,
      projection: { plan: 1, resumeCredits: 1 },
    },
  );

  if (!user) {
    const existingUser = await userModel.findById(userId).select("plan resumeCredits");
    if (!existingUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const plan = normalizePlan(existingUser.plan);
    const error = new Error(
      plan === "free"
        ? "No AI credits are available on the Free plan. Upgrade to continue."
        : "You have no AI resume credits remaining. Purchase more credits to continue.",
    );
    error.statusCode = 402;
    error.code = "INSUFFICIENT_CREDITS";
    error.plan = plan;
    error.resumeCredits = Number(existingUser.resumeCredits) || 0;
    throw error;
  }

  return user;
}

/**
 * Refund a reserved credit when an AI operation fails before a successful
 * response. The increment is bounded at zero and never creates credits for
 * a missing user.
 */
async function refundResumeCredit(userId) {
  if (!userId) return null;
  return userModel.findByIdAndUpdate(
    userId,
    { $inc: { resumeCredits: 1 } },
    { new: true, projection: { plan: 1, resumeCredits: 1 } },
  );
}

async function getBillingSnapshot(userId) {
  const user = await userModel.findById(userId).select("plan resumeCredits");
  if (!user) return null;
  const plan = normalizePlan(user.plan);
  const config = getPlanConfig(plan);
  return {
    plan,
    planLabel: config.label,
    resumeCredits: Number(user.resumeCredits) || 0,
  };
}

module.exports = {
  PLAN_CONFIG,
  normalizePlan,
  getPlanConfig,
  consumeResumeCredit,
  refundResumeCredit,
  getBillingSnapshot,
};
