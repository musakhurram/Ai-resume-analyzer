const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const env = require("../config/env");
const { buildAuthorizationUrl, exchangeCode, encryptRefreshToken } = require("../services/gmailOAuth.service");
function getUserId(req) { return req.user?.id || req.user?._id; }
function safeReturnTo(value) { const candidate = String(value || "/"); return !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\") ? "/" : candidate; }
async function startGmailOAuthController(req, res, next) {
  try {
    const userId = getUserId(req); if (!userId) return res.status(401).json({ message: "Authentication is required." });
    const user = await userModel.findById(userId).select("email"); if (!user) return res.status(404).json({ message: "User account not found." });
    const state = jwt.sign({ purpose: "gmail-send", userId: String(user._id), returnTo: safeReturnTo(req.query.returnTo) }, env.JWT_SECRET, { expiresIn: "10m" });
    return res.redirect(buildAuthorizationUrl(state));
  } catch (error) { next(error); }
}
async function gmailOAuthCallbackController(req, res) {
  const redirectBase = env.CLIENT_URL.replace(/\/$/, "");
  let returnTo = "/";
  try {
    const { code, state, error: oauthError } = req.query;
    if (state) { const decoded = jwt.decode(state); if (decoded?.purpose === "gmail-send") returnTo = safeReturnTo(decoded.returnTo); }
    if (oauthError) throw new Error("Google authorization was cancelled or denied.");
    if (!code || !state) throw new Error("Missing Google OAuth authorization response.");
    const payload = jwt.verify(state, env.JWT_SECRET);
    if (payload.purpose !== "gmail-send" || !payload.userId) throw new Error("Invalid Gmail OAuth state.");
    returnTo = safeReturnTo(payload.returnTo);
    const user = await userModel.findById(payload.userId).select("email"); if (!user) throw new Error("User account no longer exists.");
    const result = await exchangeCode(code);
    const accountEmail = String(user.email || "").trim().toLowerCase();
    if (result.email !== accountEmail) throw new Error(`Connect the same Google account as your Resume Analyzer account (${accountEmail}).`);
    user.gmailOAuthRefreshToken = encryptRefreshToken(result.refreshToken); user.gmailOAuthEmail = result.email; user.gmailOAuthConnectedAt = new Date(); await user.save();
    return res.redirect(`${redirectBase}${returnTo}${returnTo.includes("?") ? "&" : "?"}gmail=connected`);
  } catch (error) {
    const message = encodeURIComponent(error.message || "Unable to connect Gmail.");
    return res.redirect(`${redirectBase}${returnTo}${returnTo.includes("?") ? "&" : "?"}gmail=error&message=${message}`);
  }
}
async function gmailStatusController(req, res, next) {
  try {
    const user = await userModel.findById(getUserId(req)).select("email gmailOAuthEmail gmailOAuthConnectedAt");
    if (!user) return res.status(404).json({ message: "User account not found." });
    return res.status(200).json({ connected: Boolean(user.gmailOAuthEmail), email: user.gmailOAuthEmail || null, accountEmail: user.email, connectedAt: user.gmailOAuthConnectedAt || null });
  } catch (error) { next(error); }
}
async function disconnectGmailController(req, res, next) {
  try {
    const user = await userModel.findById(getUserId(req)); if (!user) return res.status(404).json({ message: "User account not found." });
    user.gmailOAuthRefreshToken = null; user.gmailOAuthEmail = null; user.gmailOAuthConnectedAt = null; await user.save();
    return res.status(200).json({ message: "Gmail sending disconnected." });
  } catch (error) { next(error); }
}
module.exports = { startGmailOAuthController, gmailOAuthCallbackController, gmailStatusController, disconnectGmailController };
