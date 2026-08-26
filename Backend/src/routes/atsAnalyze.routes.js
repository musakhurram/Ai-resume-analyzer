const express = require("express");
const upload = require("../middlewares/file.middleware");
const { aiGenerationLimiter } = require("../middlewares/rateLimit.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const atsController = require("../controllers/atsAnalyze.controller");

const atsRouter = express.Router();

// Middleware that attaches req.user if token is present, without rejecting guest users
function optionalAuth(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else {
      token = req.headers.authorization;
    }
  }

  if (!token) {
    return next();
  }

  const jwt = require("jsonwebtoken");
  const env = require("../config/env");

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}

/**
 * @route POST /api/resume/ats-analyze
 * @description Upload resume and get ATS score + section feedback + suggestions
 */
atsRouter.post(
  "/ats-analyze",
  optionalAuth,
  aiGenerationLimiter,
  upload.single("resume"),
  atsController.atsAnalyzeController,
);

/**
 * @route POST /api/resume/ats-revise
 * @description Rewrite resume sections with AI using structured JSON schema & strict anti-fabrication
 */
atsRouter.post(
  "/ats-revise",
  optionalAuth,
  aiGenerationLimiter,
  atsController.atsReviseController,
);

/**
 * @route GET /api/resume/ats-download/:id
 * @description Download clean single-column ATS PDF generated via Puppeteer
 */
atsRouter.get(
  "/ats-download/:id",
  optionalAuth,
  atsController.atsDownloadController,
);

/**
 * @route GET /api/resume/ats-report/:id
 * @description Retrieve stored ATS report details and revised resume JSON
 */
atsRouter.get(
  "/ats-report/:id",
  optionalAuth,
  atsController.getAtsReportByIdController,
);

module.exports = atsRouter;
