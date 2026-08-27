const userModel = require("../models/user.model");

// Resume Analyzer app-level AI tokens. These are usage units owned by the app,
// not raw tokenizer units reported by an AI provider.
const PRO_TOKENS = Number(process.env.STRIPE_PRO_TOKENS) || 25000;
const PREMIUM_TOKENS = Number(process.env.STRIPE_PREMIUM_TOKENS) || 75000;

const TOKEN_COSTS = {
  atsAnalysis: 500,
  jdMatch: 750,
  resumeOptimization: 2000,
  atsResumeGeneration: 2500,
  interviewPreparation: 1000,
};

const PLAN_CONFIG = {
  free: { label: "Free", tokensPerPurchase: 3000, tokens: 3000, description: "3,000 AI tokens to explore Resume Analyzer" },
  pro: { label: "Pro", tokensPerPurchase: PRO_TOKENS, tokens: PRO_TOKENS, description: `${PRO_TOKENS.toLocaleString()} AI tokens for regular job searching` },
  premium: { label: "Premium", tokensPerPurchase: PREMIUM_TOKENS, tokens: PREMIUM_TOKENS, description: `${PREMIUM_TOKENS.toLocaleString()} AI tokens for intensive applications` },
};

function normalizePlan(plan) {
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, plan) ? plan : "free";
}

function getPlanConfig(plan) {
  return PLAN_CONFIG[normalizePlan(plan)];
}

async function ensureTokenBalance(userId) {
  const user = await userModel.findById(userId).select("plan aiTokens resumeCredits freeTokensGranted");
  if (!user) return null;

  // Migrate old credit balances once. One old credit maps to 1,000 app tokens.
  if (user.aiTokens === undefined || user.aiTokens === null) {
    const legacyCredits = Number(user.resumeCredits);
    user.aiTokens = Number.isFinite(legacyCredits)
      ? Math.max(0, Math.floor(legacyCredits * 1000))
      : user.plan === "free" ? PLAN_CONFIG.free.tokens : 0;
    user.freeTokensGranted = user.plan === "free";
    await user.save();
  }
  return user;
}

async function consumeAiTokens(userId, operation, customCost) {
  if (!userId) {
    const error = new Error("Authentication is required to use AI features");
    error.statusCode = 401;
    throw error;
  }

  const cost = Number(customCost || TOKEN_COSTS[operation]);
  if (!Number.isInteger(cost) || cost <= 0) {
    const error = new Error("Invalid AI token cost");
    error.statusCode = 500;
    throw error;
  }

  await ensureTokenBalance(userId);
  const user = await userModel.findOneAndUpdate(
    { _id: userId, aiTokens: { $gte: cost } },
    { $inc: { aiTokens: -cost } },
    { new: true, projection: { plan: 1, aiTokens: 1 } },
  );

  if (!user) {
    const existingUser = await userModel.findById(userId).select("plan aiTokens");
    if (!existingUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const available = Number(existingUser.aiTokens) || 0;
    const error = new Error(`Not enough AI tokens. This feature needs ${cost.toLocaleString()} tokens, but you have ${available.toLocaleString()} remaining. Upgrade or purchase more tokens to continue.`);
    error.statusCode = 402;
    error.code = "INSUFFICIENT_AI_TOKENS";
    error.plan = normalizePlan(existingUser.plan);
    error.aiTokens = available;
    error.requiredTokens = cost;
    throw error;
  }

  return { plan: normalizePlan(user.plan), aiTokens: Number(user.aiTokens) || 0, cost };
}

async function refundAiTokens(userId, operation, customCost) {
  const cost = Number(customCost || TOKEN_COSTS[operation]);
  if (!userId || !Number.isInteger(cost) || cost <= 0) return null;
  return userModel.findByIdAndUpdate(userId, { $inc: { aiTokens: cost } }, { new: true, projection: { plan: 1, aiTokens: 1 } });
}

// Compatibility aliases for controllers not yet migrated to named token costs.
const consumeResumeCredit = (userId) => consumeAiTokens(userId, "interviewPreparation");
const refundResumeCredit = (userId) => refundAiTokens(userId, "interviewPreparation");

async function getBillingSnapshot(userId) {
  const user = await ensureTokenBalance(userId);
  if (!user) return null;
  const plan = normalizePlan(user.plan);
  const config = getPlanConfig(plan);
  return {
    plan,
    planLabel: config.label,
    aiTokens: Number(user.aiTokens) || 0,
    tokensPerPurchase: config.tokensPerPurchase,
    planTokens: config.tokens,
    description: config.description,
    tokenCosts: TOKEN_COSTS,
  };
}

module.exports = { PLAN_CONFIG, TOKEN_COSTS, normalizePlan, getPlanConfig, consumeAiTokens, refundAiTokens, getBillingSnapshot, consumeResumeCredit, refundResumeCredit };
