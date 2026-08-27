const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: [true, "Username already taken"], required: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, unique: [true, "Account already exists with this email"], required: true, trim: true, lowercase: true },
    password: { type: String, required: function () { return this.authProvider === "local"; }, select: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    plan: { type: String, enum: ["free", "pro", "premium"], default: "free" },
    // App-level AI tokens. These are not the provider/model's raw token count.
    aiTokens: { type: Number, default: 3000, min: 0 },
    freeTokensGranted: { type: Boolean, default: true },
    // Kept temporarily for backward compatibility with documents from the credit system.
    resumeCredits: { type: Number, min: 0, select: false },
    freeCreditsGranted: { type: Boolean, select: false },
    lastStripeCheckoutSessionId: { type: String, default: null },
    processedStripeCheckoutSessionIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

const userModel = mongoose.models.users || mongoose.model("users", userSchema);
module.exports = userModel;
