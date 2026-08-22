const pdfParse = require("pdf-parse");
const { generateInterviewReport } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @name generateInterviewReportController
 * @description generate interview report from resume PDF, self description, and job description
 * @access Private
 */
async function generateInterviewReportController(req, res) {
  try {
    const { selfDescription = "", jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        message: "Job description is required",
      });
    }

    let resumeContent = "";
    if (req.file && req.file.buffer) {
      if (typeof pdfParse === "function") {
        const parsed = await pdfParse(req.file.buffer);
        resumeContent = parsed.text || "";
      } else if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: req.file.buffer });
        await parser.load();
        const parsed = await parser.getText();
        resumeContent = parsed.text || parsed || "";
      }
    } else if (req.body.resume) {
      resumeContent = req.body.resume;
    }

    const interViewReportByAI = await generateInterviewReport({
      resume: resumeContent,
      selfDescription,
      jobDescription,
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeContent,
      selfDescription,
      jobDescription,
      matchScore: interViewReportByAI.matchScore,
      technicalQuestions: interViewReportByAI.technicalQuestions,
      behavioralQuestions: interViewReportByAI.behavioralQuestions,
      skillGaps: interViewReportByAI.skillGaps,
      preparationPlan: interViewReportByAI.preparationPlan,
    });

    return res.status(201).json({
      message: "Interview report Generated Successfully",
      interviewReport,
    });
  } catch (error) {
    console.error("Error generating interview report:", error);
    return res.status(500).json({
      message: "Failed to generate interview report",
      error: error.message,
    });
  }
}

/**
 * @name getAllInterviewReportsController
 * @description get all interview reports for the logged in user
 * @access Private
 */
async function getAllInterviewReportsController(req, res) {
  try {
    const reports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Reports fetched successfully",
      reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({
      message: "Failed to fetch interview reports",
      error: error.message,
    });
  }
}

/**
 * @name getInterviewReportByIdController
 * @description get interview report details by report id
 * @access Private
 */
async function getInterviewReportByIdController(req, res) {
  try {
    const { id } = req.params;
    const interviewReport = await interviewReportModel.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found",
      });
    }

    return res.status(200).json({
      message: "Interview report fetched successfully",
      interviewReport,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return res.status(500).json({
      message: "Failed to fetch interview report",
      error: error.message,
    });
  }
}

module.exports = {
  generateInterviewReportController,
  getAllInterviewReportsController,
  getInterviewReportByIdController,
};
