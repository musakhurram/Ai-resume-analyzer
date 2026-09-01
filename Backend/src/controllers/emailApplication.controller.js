const atsReportModel = require("../models/atsReport.model");
const userModel = require("../models/user.model");
const { resumeJsonToText } = require("../services/atsAi.service");
const { generateJobApplicationEmail } = require("../services/emailApplication.service");
const { consumeAiTokens, refundAiTokens, TOKEN_COSTS } = require("../services/credit.service");

function getUserId(req) { return req.user?.id || req.user?._id; }

async function generateAtsEmailController(req, res, next) {
  const userId = getUserId(req);
  let reserved = false;
  try {
    if (!userId) return res.status(401).json({ message: "Please sign in to generate an application email." });
    const { id, recipientEmail = "", jobTitle = "", companyName = "", jobDescription = "" } = req.body || {};
    if (!id) return res.status(400).json({ message: "Analysis session ID is required." });
    if (String(recipientEmail).length > 254) return res.status(400).json({ message: "Recipient email is too long." });
    if (String(jobDescription).length > 12000) return res.status(400).json({ message: "Job description is too long (maximum 12,000 characters)." });
    if (String(jobTitle).length > 150 || String(companyName).length > 150) return res.status(400).json({ message: "Job title or company name is too long." });

    const report = await atsReportModel.findById(id).select("user rawResumeText analysis revisedResume");
    if (!report) return res.status(404).json({ message: "Resume report not found." });
    if (String(report.user) !== String(userId)) return res.status(403).json({ message: "You do not have access to this ATS report." });

    const cost = TOKEN_COSTS.emailApplication;
    await consumeAiTokens(userId, "emailApplication");
    reserved = true;

    const resumeText = report.revisedResume ? resumeJsonToText(report.revisedResume) : report.rawResumeText;
    const result = await generateJobApplicationEmail({
      resumeText,
      candidateName: report.revisedResume?.contact?.fullName || "",
      recipientEmail: String(recipientEmail).trim().slice(0, 254),
      jobTitle: String(jobTitle).trim(),
      companyName: String(companyName).trim(),
      jobDescription: String(jobDescription).trim(),
      strengths: report.analysis?.strengths || [],
    });

    reserved = false;
    const user = await userModel.findById(userId).select("aiTokens plan");
    return res.status(200).json({ ...result, aiTokens: Number(user?.aiTokens) || 0, tokenCost: cost });
  } catch (error) {
    if (reserved) await refundAiTokens(userId, "emailApplication").catch(() => {});
    next(error);
  }
}

module.exports = { generateAtsEmailController };
