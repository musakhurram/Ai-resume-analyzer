const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview
 * @description generate new interview report on the basis of user self description, resume pdf, and job description
 * @access private
 */
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  upload.single("resume"),
  interviewController.generateInterviewReportController
);

/**
 * @route GET /api/interview
 * @description get all interview reports for the current user
 * @access private
 */
interviewRouter.get(
  "/",
  authMiddleware.authUser,
  interviewController.getAllInterviewReportsController
);

/**
 * @route GET /api/interview/:id
 * @description get interview report by id
 * @access private
 */
interviewRouter.get(
  "/:id",
  authMiddleware.authUser,
  interviewController.getInterviewReportByIdController
);

module.exports = interviewRouter;
