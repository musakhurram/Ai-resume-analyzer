const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimit.middleware");

const authRouter = Router();

authRouter.post("/register", authLimiter, authController.registerUserController);
authRouter.post("/login", authLimiter, authController.loginUserController);
authRouter.post("/google", authLimiter, authController.googleAuthController);
authRouter.post("/logout", authController.logoutUserController);
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController);

// Sends a test message to the authenticated user's own email address.
// Useful for verifying Gmail SMTP configuration without exposing a public mail endpoint.
authRouter.post("/test-email", authMiddleware.authUser, authController.testSmtpController);

module.exports = authRouter;
