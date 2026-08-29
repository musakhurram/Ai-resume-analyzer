const mongoose = require("mongoose");
const userModel = require("../models/user.model");

// App-level AI tokens. These are usage units owned by Resume Analyzer,
// not raw provider tokenizer units.
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

function normalizePlan(plan) { return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, plan) ? plan : "free"; }
function getPlanConfig(plan) { return PLAN_CONFIG[normalizePlan(plan)]; }

function toMongoUserId(userId) {
  if (userId && mongoose.isValidObjectId(userId)) return new mongoose.Types.ObjectId(String(userId));
  return userId;
}

async function ensureTokenBalance(userId) {
  // Read the raw MongoDB document so Mongoose schema defaults cannot hide a
  // missing aiTokens field. JWT ids are strings, but MongoDB _id is an ObjectId.
  const mongoUserId = toMongoUserId(userId);
  const rawUser = await userModel.collection.findOne(
    { _id: mongoUserId },
    { projection: { plan: 1, aiTokens: 1, resumeCredits: 1, freeTokensGranted: 1 } },
  );
  if (!rawUser) return null;

  const plan = normalizePlan(rawUser.plan);
  const hasStoredTokens = Object.prototype.hasOwnProperty.call(rawUser, "aiTokens") && Number.isFinite(Number(rawUser.aiTokens));

  if (!hasStoredTokens) {
    const legacyCredits = Number(rawUser.resumeCredits);
    let startingTokens;

    if (plan === "free") {
      startingTokens = 3000;
    } else if (Number.isFinite(legacyCredits) && legacyCredits >= 0) {
      startingTokens = Math.floor(legacyCredits * 1000);
    } else {
      startingTokens = getPlanConfig(plan).tokens;
    }

    await userModel.collection.updateOne(
      { _id: mongoUserId, aiTokens: { $exists: false } },
      { $set: { aiTokens: startingTokens } },
    );
  }

  return userModel.findById(userId).select("plan aiTokens resumeCredits freeTokensGranted");
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

  const ensuredUser = await ensureTokenBalance(userId);
  if (!ensuredUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await userModel.findOneAndUpdate(
    { _id: userId, aiTokens: { $gte: cost } },
    { $inc: { aiTokens: -cost } },
    { new: true, projection: { plan: 1, aiTokens: 1 } },
  );

  if (!user) {
    const existingUser = await userModel.findById(userId).select("plan aiTokens");
    if (!existingUser) { const error = new Error("User not found"); error.statusCode = 404; throw error; }
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

const consumeResumeCredit = (userId) => consumeAiTokens(userId, "interviewPreparation");
const refundResumeCredit = (userId) => refundAiTokens(userId, "interviewPreparation");

async function getBillingSnapshot(userId) {
  const user = await ensureTokenBalance(userId);
  if (!user) return null;
  const plan = normalizePlan(user.plan);
  const config = getPlanConfig(plan);
  const aiTokens = Number(user.aiTokens) || 0;
  const resumeCredits = Math.floor(aiTokens / TOKEN_COSTS.jdMatch);
  return { plan, planLabel: config.label, aiTokens, resumeCredits, tokensPerPurchase: config.tokensPerPurchase, planTokens: config.tokens, description: config.description, tokenCosts: TOKEN_COSTS };
}

module.exports = { PLAN_CONFIG, TOKEN_COSTS, normalizePlan, getPlanConfig, consumeAiTokens, refundAiTokens, getBillingSnapshot, consumeResumeCredit, refundResumeCredit };
