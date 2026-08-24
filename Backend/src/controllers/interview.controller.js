// pdf-parse spins up an internal pdf.js worker; on serverless platforms
// (Vercel/Lambda/Netlify) the automatic "fake worker" path resolution
// fails because the worker file isn't reachable the way it expects,
// throwing "Setting up fake worker failed: ...". Pointing it at the
// worker module explicitly (per pdf-parse's own troubleshooting docs)
// avoids that lookup entirely.
const { getData } = require("pdf-parse/worker");
const { PDFParse } = require("pdf-parse");
PDFParse.setWorker(getData());
const { generateInterviewReport } = require("../services/ai.service");
const { renderInterviewReportPdf } = require("../services/pdf.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @name generateInterviewReportController
 * @description generate interview report from resume PDF, self description, and job description
 * @access Private
 */
async function generateInterviewReportController(req, res, next) {
  try {
    const { selfDescription = "", jobDescription } = req.body;

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({
        message: "Job description is required",
      });
    }

    let resumeContent = "";
    if (req.file && req.file.buffer) {
      const parser = new PDFParse({ data: req.file.buffer });
      try {
        const parsed = await parser.getText();
        resumeContent = parsed.text || "";
      } finally {
        await parser.destroy();
      }
    } else if (req.body.resume) {
      resumeContent = req.body.resume;
    }

    if (!resumeContent.trim()) {
      return res.status(400).json({
        message: "Please upload a resume PDF or paste your resume text",
      });
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
    next(error);
  }
}

/**
 * @name getAllInterviewReportsController
 * @description get all interview reports for the logged in user
 * @access Private
 */
async function getAllInterviewReportsController(req, res, next) {
  try {
    const reports = await interviewReportModel
      .find({ user: req.user.id })
      .select("-resume -selfDescription -preparationPlan")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Reports fetched successfully",
      reports,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @name getInterviewReportByIdController
 * @description get interview report details by report id
 * @access Private
 */
async function getInterviewReportByIdController(req, res, next) {
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
    next(error);
  }
}

/**
 * @name downloadInterviewReportPdfController
 * @description stream a PDF export of an interview report
 * @access Private
 */
async function downloadInterviewReportPdfController(req, res, next) {
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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="interview-report-${interviewReport._id}.pdf"`,
    );

    renderInterviewReportPdf(interviewReport, res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateInterviewReportController,
  getAllInterviewReportsController,
  getInterviewReportByIdController,
  downloadInterviewReportPdfController,
};
