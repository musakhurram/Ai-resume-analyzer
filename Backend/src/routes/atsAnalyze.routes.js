const express = require("express");
const upload = require("../middlewares/file.middleware");
const { aiGenerationLimiter } = require("../middlewares/rateLimit.middleware");
const { authUser } = require("../middlewares/auth.middleware");
const atsController = require("../controllers/atsAnalyze.controller");

const atsRouter = express.Router();

// Attaches req.user when a valid token is present, while preserving guest analysis.
function optionalAuth(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : req.headers.authorization;
  }
  if (!token) return next();

  const jwt = require("jsonwebtoken");
  const env = require("../config/env");
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
  } catch {
    // Ignore invalid token for optional-auth endpoints.
  }
  next();
}

atsRouter.post("/ats-analyze", optionalAuth, aiGenerationLimiter, upload.single("resume"), atsController.atsAnalyzeController);
atsRouter.post("/ats-revise", optionalAuth, aiGenerationLimiter, atsController.atsReviseController);
atsRouter.get("/ats-download/:id", optionalAuth, atsController.atsDownloadController);
atsRouter.get("/ats-report/:id", optionalAuth, atsController.getAtsReportByIdController);

// History is account-specific and must never expose another user's reports.
atsRouter.get("/ats-reports", authUser, atsController.listAtsReportsController);

module.exports = atsRouter;
