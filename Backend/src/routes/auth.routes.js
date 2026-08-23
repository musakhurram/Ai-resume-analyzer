const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimit.middleware");

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authLimiter, authController.registerUserController);

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */
authRouter.post("/login", authLimiter, authController.loginUserController);

/**
 * @route POST /api/auth/google
 * @description sign in or register a user via Google ID token
 * @access Public
 */
authRouter.post("/google", authLimiter, authController.googleAuthController);

/**
 * @route POST /api/auth/logout
 * @description clear token from user cookie and add token in blacklist
 * @access Public
 */
authRouter.post("/logout", authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @description get the current logged in user details
 * @access private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController);

module.exports = authRouter;
