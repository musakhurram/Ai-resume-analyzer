// pdf-parse spins up an internal pdf.js worker; on serverless platforms
// the explicit worker path avoids fake-worker resolution failures.
const { getData } = require("pdf-parse/worker");
const { PDFParse } = require("pdf-parse");
PDFParse.setWorker(getData());
const { generateInterviewReport } = require("../services/ai.service");
const { renderInterviewReportPdf } = require("../services/pdf.service");
const { consumeAiTokens, refundAiTokens } = require("../services/credit.service");
const interviewReportModel = require("../models/interviewReport.model");

async function generateInterviewReportController(req, res, next) {
  const userId = req.user?.id;
  let tokenReserved = false;
  try {
    const { selfDescription = "", jobDescription } = req.body;
    if (!jobDescription || !jobDescription.trim()) return res.status(400).json({ message: "Job description is required" });

    let resumeContent = "";
    if (req.file && req.file.buffer) {
      const parser = new PDFParse({ data: req.file.buffer });
      try { resumeContent = (await parser.getText()).text || ""; } finally { await parser.destroy(); }
    } else if (req.body.resume) resumeContent = req.body.resume;
    if (!resumeContent.trim()) return res.status(400).json({ message: "Please upload a resume PDF or paste your resume text" });

    await consumeAiTokens(userId, "jdMatch");
    tokenReserved = true;
    const interViewReportByAI = await generateInterviewReport({ resume: resumeContent, selfDescription, jobDescription });
    const interviewReport = await interviewReportModel.create({ user: userId, resume: resumeContent, selfDescription, jobDescription, matchScore: interViewReportByAI.matchScore, technicalQuestions: interViewReportByAI.technicalQuestions, behavioralQuestions: interViewReportByAI.behavioralQuestions, skillGaps: interViewReportByAI.skillGaps, preparationPlan: interViewReportByAI.preparationPlan });
    tokenReserved = false;
    return res.status(201).json({ message: "Interview report Generated Successfully", interviewReport });
  } catch (error) {
    if (tokenReserved) await refundAiTokens(userId, "jdMatch").catch(() => {});
    next(error);
  }
}

async function getAllInterviewReportsController(req, res, next) {
  try {
    const reports = await interviewReportModel.find({ user: req.user.id }).select("-resume -selfDescription -preparationPlan").sort({ createdAt: -1 });
    return res.status(200).json({ message: "Reports fetched successfully", reports });
  } catch (error) { next(error); }
}

async function getInterviewReportByIdController(req, res, next) {
  try {
    const interviewReport = await interviewReportModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!interviewReport) return res.status(404).json({ message: "Interview report not found" });
    return res.status(200).json({ message: "Interview report fetched successfully", interviewReport });
  } catch (error) { next(error); }
}

async function downloadInterviewReportPdfController(req, res, next) {
  try {
    const interviewReport = await interviewReportModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!interviewReport) return res.status(404).json({ message: "Interview report not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="interview-report-${interviewReport._id}.pdf"`);
    renderInterviewReportPdf(interviewReport, res);
  } catch (error) { next(error); }
}

module.exports = { generateInterviewReportController, getAllInterviewReportsController, getInterviewReportByIdController, downloadInterviewReportPdfController };
