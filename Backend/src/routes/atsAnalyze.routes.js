const express = require("express");
const upload = require("../middlewares/file.middleware");
const { aiGenerationLimiter } = require("../middlewares/rateLimit.middleware");
const { authUser } = require("../middlewares/auth.middleware");
const atsController = require("../controllers/atsAnalyze.controller");
const { atsManualRevisionController } = require("../controllers/atsManualRevision.controller");

const atsRouter = express.Router();

atsRouter.post("/ats-analyze", authUser, aiGenerationLimiter, upload.single("resume"), atsController.atsAnalyzeController);
atsRouter.post("/ats-revise", authUser, aiGenerationLimiter, atsController.atsReviseController);
atsRouter.put("/ats-revision/:id", authUser, atsManualRevisionController);
atsRouter.get("/ats-download/:id", authUser, atsController.atsDownloadController);
atsRouter.get("/ats-preview/:id", authUser, atsController.atsPreviewController);
atsRouter.get("/ats-original/:id", authUser, atsController.atsOriginalController);
atsRouter.get("/ats-report/:id", authUser, atsController.getAtsReportByIdController);
atsRouter.get("/ats-reports", authUser, atsController.listAtsReportsController);

module.exports = atsRouter;
