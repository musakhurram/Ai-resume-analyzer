const userModel = require("../models/user.model");

// Plan limits are intentionally server-side so changing frontend values cannot
// grant additional AI generations. Environment overrides use NEW variable names
// so an older STRIPE_PRO_CREDITS value cannot silently change the new plans.
const PRO_GENERATIONS = Number(process.env.STRIPE_PRO_GENERATIONS) || 20;
const PREMIUM_GENERATIONS = Number(process.env.STRIPE_PREMIUM_GENERATIONS) || 50;

const PLAN_CONFIG = {
  free: {
    label: "Free",
    creditsPerPurchase: 3,
    generations: 3,
    description: "3 AI generations to try the complete workflow",
  },
  pro: {
    label: "Pro",
    creditsPerPurchase: PRO_GENERATIONS,
    generations: PRO_GENERATIONS,
    description: `${PRO_GENERATIONS} AI generations for regular job searching`,
  },
  premium: {
    label: "Premium",
    creditsPerPurchase: PREMIUM_GENERATIONS,
    generations: PREMIUM_GENERATIONS,
    description: `${PREMIUM_GENERATIONS} AI generations for intensive applications`,
  },
};

function normalizePlan(plan) {
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, plan) ? plan : "free";
}

function getPlanConfig(plan) {
  return PLAN_CONFIG[normalizePlan(plan)];
}

async function ensureFreeCredits(userId) {
  // Existing accounts created before the 3-generation Free plan have no
  // freeCreditsGranted field. Give them the new allowance exactly once.
  return userModel.findOneAndUpdate(
    {
      _id: userId,
      plan: "free",
      $or: [
        { freeCreditsGranted: { $exists: false } },
        { freeCreditsGranted: false },
      ],
    },
    {
      $set: { resumeCredits: 3, freeCreditsGranted: true },
    },
    { new: true, projection: { plan: 1, resumeCredits: 1 } },
  );
}

async function consumeResumeCredit(userId) {
  if (!userId) {
    const error = new Error("Authentication is required to use AI resume generations");
    error.statusCode = 401;
    throw error;
  }

  await ensureFreeCredits(userId);

  const user = await userModel.findOneAndUpdate(
    { _id: userId, resumeCredits: { $gt: 0 } },
    { $inc: { resumeCredits: -1 } },
    { new: true, projection: { plan: 1, resumeCredits: 1 } },
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
        ? "You have used all 3 free AI generations. Upgrade to Pro or Premium to continue."
        : `You have no AI generations remaining on the ${getPlanConfig(plan).label} plan. Purchase another plan pack to continue.`,
    );
    error.statusCode = 402;
    error.code = "INSUFFICIENT_CREDITS";
    error.plan = plan;
    error.resumeCredits = Number(existingUser.resumeCredits) || 0;
    throw error;
  }

  return user;
}

async function refundResumeCredit(userId) {
  if (!userId) return null;
  return userModel.findByIdAndUpdate(
    userId,
    { $inc: { resumeCredits: 1 } },
    { new: true, projection: { plan: 1, resumeCredits: 1 } },
  );
}

async function getBillingSnapshot(userId) {
  let user = await ensureFreeCredits(userId);
  if (!user) user = await userModel.findById(userId).select("plan resumeCredits");
  if (!user) return null;

  const plan = normalizePlan(user.plan);
  const config = getPlanConfig(plan);
  return {
    plan,
    planLabel: config.label,
    resumeCredits: Number(user.resumeCredits) || 0,
    creditsPerPurchase: config.creditsPerPurchase,
    generations: config.generations,
    description: config.description,
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
