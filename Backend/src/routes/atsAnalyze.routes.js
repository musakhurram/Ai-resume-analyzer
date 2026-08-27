const express = require("express");
const upload = require("../middlewares/file.middleware");
const { aiGenerationLimiter } = require("../middlewares/rateLimit.middleware");
const { authUser } = require("../middlewares/auth.middleware");
const atsController = require("../controllers/atsAnalyze.controller");

const atsRouter = express.Router();

// AI resume operations are account-bound so credit limits cannot be bypassed
// through guest requests or by sending a different client-side plan value.
atsRouter.post("/ats-analyze", authUser, aiGenerationLimiter, upload.single("resume"), atsController.atsAnalyzeController);
atsRouter.post("/ats-revise", authUser, aiGenerationLimiter, atsController.atsReviseController);
atsRouter.get("/ats-download/:id", authUser, atsController.atsDownloadController);
atsRouter.get("/ats-report/:id", authUser, atsController.getAtsReportByIdController);

// History is account-specific and must never expose another user's reports.
atsRouter.get("/ats-reports", authUser, atsController.listAtsReportsController);

module.exports = atsRouter;
