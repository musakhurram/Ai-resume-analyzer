const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const gmailOAuthController = require("../controllers/gmailOAuth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimit.middleware");

const authRouter = Router();
authRouter.post("/register", authLimiter, authController.registerUserController);
authRouter.post("/login", authLimiter, authController.loginUserController);
authRouter.post("/google", authLimiter, authController.googleAuthController);
authRouter.get("/verify-email", authController.verifyEmailController);
authRouter.post("/verify-email", authController.verifyEmailController);
authRouter.post("/resend-verification", authLimiter, authController.resendVerificationController);
authRouter.post("/forgot-password", authLimiter, authController.forgotPasswordController);
authRouter.post("/reset-password", authLimiter, authController.resetPasswordController);
authRouter.post("/logout", authController.logoutUserController);
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController);
authRouter.post("/test-email", authMiddleware.authUser, authController.testSmtpController);

// Gmail OAuth: the callback is public because Google redirects the browser to it.
// The signed state token identifies the already-authenticated app user.
authRouter.get("/gmail/callback", gmailOAuthController.gmailOAuthCallbackController);
authRouter.get("/gmail/connect", authMiddleware.authUser, gmailOAuthController.startGmailOAuthController);
authRouter.get("/gmail/status", authMiddleware.authUser, gmailOAuthController.gmailStatusController);
authRouter.delete("/gmail/connect", authMiddleware.authUser, gmailOAuthController.disconnectGmailController);

module.exports = authRouter;
