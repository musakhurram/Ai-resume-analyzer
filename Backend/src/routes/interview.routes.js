const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");
const { aiGenerationLimiter } = require("../middlewares/rateLimit.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview
 * @description generate new interview report on the basis of user self description, resume pdf, and job description
 * @access private
 */
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  aiGenerationLimiter,
  upload.single("resume"),
  interviewController.generateInterviewReportController,
);

/**
 * @route GET /api/interview
 * @description get all interview reports for the current user
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController);

/**
 * @route GET /api/interview/:id
 * @description get interview report by id
 * @access private
 */
interviewRouter.get("/:id", authMiddleware.authUser, interviewController.getInterviewReportByIdController);

/**
 * @route GET /api/interview/:id/pdf
 * @description download a PDF export of an interview report
 * @access private
 */
interviewRouter.get(
  "/:id/pdf",
  authMiddleware.authUser,
  interviewController.downloadInterviewReportPdfController,
);

module.exports = interviewRouter;
