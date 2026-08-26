const { getData } = require("pdf-parse/worker");
const { PDFParse } = require("pdf-parse");
PDFParse.setWorker(getData());

const {
  analyzeResumeForAts,
  reviseResumeForAts,
  resumeJsonToText,
} = require("../services/atsAi.service");
const { normalizeAnalysis } = require("../services/atsScoring.service");
const { generateAtsPdfBuffer } = require("../services/atsPdf.service");
const atsReportModel = require("../models/atsReport.model");

function getAuthenticatedUserId(req) {
  return req.user?.id || req.user?._id || undefined;
}
function getDefaultTitle(fileName, analysis) {
  const name = String(fileName || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  if (name && !/^pasted resume$/i.test(name)) return name;
  return `ATS Review — ${analysis?.overallScore ?? 0}%`;
}

function buildRevisionQaFeedback(analysis) {
  const weakSections = ["experience", "summary", "skills", "education", "formatting", "contactInfo"]
    .map((section) => ({ section, data: analysis?.sections?.[section] }))
    .filter(({ data }) => Number(data?.score) < 85)
    .sort((a, b) => Number(a.data?.score || 0) - Number(b.data?.score || 0));

  const lines = weakSections.map(({ section, data }) => {
    const suggestions = Array.isArray(data?.suggestions) ? data.suggestions.slice(0, 3).join("; ") : "";
    return `${section}: ${data?.score ?? 0}/100${suggestions ? ` — ${suggestions}` : ""}`;
  });

  return lines.length ? lines.join("\n") : "No section is below 85. Preserve content and focus on ATS-safe clarity without unnecessary rewrites.";
}

async function optimizeRevision({ originalText, originalAnalysis, suggestions, sections }) {
  let bestResume = await reviseResumeForAts({
    resumeText: originalText,
    suggestions,
    sectionsToRevise: sections,
  });
  let bestAnalysis = normalizeAnalysis(await analyzeResumeForAts({
    resumeText: resumeJsonToText(bestResume),
  }));

  // A rewrite must not silently make the resume worse. If the first rewrite
  // scores lower, give the model the actual regression feedback and one chance
  // to repair it. Keep the higher-scoring candidate.
  if (bestAnalysis.overallScore <= originalAnalysis.overallScore) {
    const qaFeedback = buildRevisionQaFeedback(bestAnalysis);
    const retryResume = await reviseResumeForAts({
      resumeText: resumeJsonToText(bestResume),
      suggestions: bestAnalysis.topSuggestions?.length ? bestAnalysis.topSuggestions : suggestions,
      sectionsToRevise: sections,
      optimizationFeedback: `The first revision scored ${bestAnalysis.overallScore}/100, while the original scored ${originalAnalysis.overallScore}/100. Do not accept this regression. Improve these weak areas while preserving all existing factual content:\n${qaFeedback}`,
    });
    const retryAnalysis = normalizeAnalysis(await analyzeResumeForAts({
      resumeText: resumeJsonToText(retryResume),
    }));

    if (retryAnalysis.overallScore > bestAnalysis.overallScore) {
      bestResume = retryResume;
      bestAnalysis = retryAnalysis;
    }
  }

  return { resume: bestResume, analysis: bestAnalysis };
}

async function atsAnalyzeController(req, res, next) {
  try {
    let resumeContent = "";
    let fileName = req.file?.originalname || "resume.pdf";
    if (req.file?.buffer) {
      const parser = new PDFParse({ data: req.file.buffer });
      try {
        resumeContent = (await parser.getText()).text || "";
      } finally {
        await parser.destroy();
      }
    } else if (req.body.resume) {
      resumeContent = req.body.resume;
      fileName = req.body.fileName || "Pasted-Resume.txt";
    }
    if (!resumeContent.trim()) return res.status(400).json({ message: "Please upload a resume PDF or paste your resume text to analyze." });

    const rawAnalysis = await analyzeResumeForAts({ resumeText: resumeContent });
    const analysisResult = normalizeAnalysis(rawAnalysis);
    const requestedCategory = String(req.body.category || "general").toLowerCase();
    const category = ["general", "job-targeted", "optimized"].includes(requestedCategory) ? requestedCategory : "general";
    const atsReport = await atsReportModel.create({
      user: getAuthenticatedUserId(req),
      rawResumeText: resumeContent,
      resumeFileName: fileName,
      title: String(req.body.title || getDefaultTitle(fileName, analysisResult)).trim(),
      category,
      analysis: analysisResult,
      revisedResume: null,
    });
    return res.status(201).json({ message: "Resume analyzed successfully for ATS compatibility", id: atsReport._id, atsReport });
  } catch (error) {
    next(error);
  }
}

async function atsReviseController(req, res, next) {
  try {
    const { id, sections = "all", customNotes = "" } = req.body;
    if (!id) return res.status(400).json({ message: "Analysis session ID is required for revision." });
    const report = await atsReportModel.findById(id);
    if (!report) return res.status(404).json({ message: "Analysis session not found. Please re-run the ATS analysis." });
    const userId = getAuthenticatedUserId(req);
    if (userId && report.user && String(report.user) !== String(userId)) return res.status(403).json({ message: "You do not have access to this ATS report." });

    const suggestions = [];
    if (report.analysis?.topSuggestions?.length) suggestions.push(...report.analysis.topSuggestions);
    if (report.analysis?.atsCompatibility?.issues?.length) {
      report.analysis.atsCompatibility.issues.forEach((iss) => suggestions.push({ section: "ATS Formatting", suggestion: iss.fix, reasoning: iss.issue }));
    }
    if (customNotes) suggestions.push({ section: "User Request", suggestion: customNotes, reasoning: "User custom focus instruction" });

    const optimized = await optimizeRevision({
      originalText: report.rawResumeText,
      originalAnalysis: report.analysis,
      suggestions,
      sections,
    });

    report.revisedResume = optimized.resume;
    report.category = "optimized";
    await report.save();
    generateAtsPdfBuffer(optimized.resume, String(report._id)).catch((err) => console.warn("Background PDF cache warming notice:", err.message));

    return res.status(200).json({
      message: optimized.analysis.overallScore > report.analysis.overallScore
        ? `Resume revised successfully — QA score improved from ${report.analysis.overallScore} to ${optimized.analysis.overallScore}`
        : "Resume revised successfully with content preserved; no lower-scoring revision was accepted",
      id: report._id,
      revisedResume: optimized.resume,
      revisedAnalysis: optimized.analysis,
      atsReport: report,
    });
  } catch (error) {
    next(error);
  }
}

async function atsDownloadController(req, res, next) {
  try {
    const report = await atsReportModel.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Resume report not found." });
    const userId = getAuthenticatedUserId(req);
    if (userId && report.user && String(report.user) !== String(userId)) return res.status(403).json({ message: "You do not have access to this ATS report." });
    let revisedResume = report.revisedResume;
    if (!revisedResume) {
      const optimized = await optimizeRevision({
        originalText: report.rawResumeText,
        originalAnalysis: report.analysis,
        suggestions: report.analysis?.topSuggestions || [],
        sections: "all",
      });
      revisedResume = optimized.resume;
      report.revisedResume = revisedResume;
      report.category = "optimized";
      await report.save();
    }
    const pdfBuffer = await generateAtsPdfBuffer(revisedResume, String(report._id));
    const safeName = (revisedResume.contact?.fullName || "ATS-Optimized-Resume").replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}_ATS_Resume.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

async function getAtsReportByIdController(req, res, next) {
  try {
    const report = await atsReportModel.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "ATS report not found" });
    const userId = getAuthenticatedUserId(req);
    if (userId && report.user && String(report.user) !== String(userId)) return res.status(403).json({ message: "You do not have access to this ATS report." });
    return res.status(200).json({ message: "ATS report fetched successfully", atsReport: report });
  } catch (error) {
    next(error);
  }
}

async function listAtsReportsController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication is required to view ATS report history." });
    const { search = "", sort = "recent", limit = 50 } = req.query;
    const filter = { user: userId };
    if (String(search).trim()) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ title: { $regex: escaped, $options: "i" } }, { resumeFileName: { $regex: escaped, $options: "i" } }];
    }
    const sortOrder = sort === "oldest" ? 1 : -1;
    const reports = await atsReportModel.find(filter).select("_id title category resumeFileName analysis.overallScore analysis.atsCompatibility.score analysis.scoringVersion analysis.scoreBreakdown createdAt updatedAt revisedResume").sort({ createdAt: sortOrder }).limit(Math.min(Math.max(Number(limit) || 50, 1), 100)).lean();
    return res.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
}

module.exports = { atsAnalyzeController, atsReviseController, atsDownloadController, getAtsReportByIdController, listAtsReportsController };