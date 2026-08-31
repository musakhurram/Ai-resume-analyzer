const { getData } = require("pdf-parse/worker");
const { PDFParse } = require("pdf-parse");
PDFParse.setWorker(getData());
const {
  analyzeResumeForAts,
  reviseResumeForAts,
  resumeJsonToText,
} = require("../services/atsAi.service");
const { normalizeAnalysis } = require("../services/atsScoring.service");
const {
  generateAtsPdfBufferSafe: generateAtsPdfBuffer,
} = require("../services/atsPdf.safe.service");
const {
  consumeAiTokens,
  refundAiTokens,
} = require("../services/credit.service");
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
const SECTION_LABELS = {
  experience: "Experience",
  summary: "Summary",
  skills: "Skills",
  education: "Education",
  formatting: "Formatting",
  contactInfo: "Contact Info",
  atsCompatibility: "ATS Compatibility",
};
function buildTargetedOptimization(
  originalAnalysis,
  requestedSections = "all",
) {
  const requested = String(requestedSections || "all").toLowerCase();
  const allowed = Object.keys(SECTION_LABELS).filter(
    (key) => key !== "atsCompatibility",
  );
  const requestedList =
    requested === "all"
      ? allowed
      : requested
          .split(",")
          .map((s) => s.trim())
          .filter((s) => allowed.includes(s));
  const ranked = requestedList
    .map((section) => ({
      section,
      score: Number(originalAnalysis?.sections?.[section]?.score ?? 100),
      suggestions: Array.isArray(
        originalAnalysis?.sections?.[section]?.suggestions,
      )
        ? originalAnalysis.sections[section].suggestions
        : [],
    }))
    .sort((a, b) => a.score - b.score);
  const weak = ranked.filter((item) => item.score < 90).slice(0, 3);
  const targets = weak.length ? weak : ranked.slice(0, 2);
  const targetSections = targets.map((item) => item.section);
  const targetedSuggestions = targets.flatMap((item) => {
    const sectionSuggestions = item.suggestions
      .slice(0, 4)
      .map((suggestion) => ({
        section: SECTION_LABELS[item.section],
        suggestion,
        reasoning: `${SECTION_LABELS[item.section]} scored ${item.score}/100 and is a priority for improvement.`,
      }));
    return sectionSuggestions.length
      ? sectionSuggestions
      : [
          {
            section: SECTION_LABELS[item.section],
            suggestion: `Improve the ${SECTION_LABELS[item.section]} section while preserving all original facts and information.`,
            reasoning: `${SECTION_LABELS[item.section]} scored ${item.score}/100 and is a priority for improvement.`,
          },
        ];
  });
  return {
    sections: targetSections.length ? targetSections.join(",") : "all",
    suggestions: targetedSuggestions,
    targets,
  };
}
function buildRevisionQaFeedback(analysis) {
  const weakSections = [
    "experience",
    "summary",
    "skills",
    "education",
    "formatting",
    "contactInfo",
  ]
    .map((section) => ({ section, data: analysis?.sections?.[section] }))
    .filter(({ data }) => Number(data?.score) < 90)
    .sort((a, b) => Number(a.data?.score || 0) - Number(b.data?.score || 0));
  const lines = weakSections.map(
    ({ section, data }) =>
      `${SECTION_LABELS[section] || section}: ${data?.score ?? 0}/100${Array.isArray(data?.suggestions) && data.suggestions.length ? ` — ${data.suggestions.slice(0, 3).join("; ")}` : ""}`,
  );
  return lines.length
    ? lines.join("\n")
    : "No section is below 90. Preserve content and focus only on ATS-safe clarity without unnecessary rewrites.";
}
async function optimizeRevision({
  originalText,
  originalAnalysis,
  suggestions,
  sections,
}) {
  const targeted = buildTargetedOptimization(originalAnalysis, sections);
  const combinedSuggestions = [
    ...targeted.suggestions,
    ...(suggestions || []).slice(0, 4),
  ];
  let bestResume = await reviseResumeForAts({
    resumeText: originalText,
    suggestions: combinedSuggestions,
    sectionsToRevise: targeted.sections,
    optimizationFeedback: `TARGETED OPTIMIZATION ONLY. Prioritize these weakest sections: ${targeted.targets.map((t) => `${SECTION_LABELS[t.section]} (${t.score}/100)`).join(", ")}. Leave stronger sections unchanged unless needed for consistency.`,
  });
  let bestAnalysis = normalizeAnalysis(
    await analyzeResumeForAts({ resumeText: resumeJsonToText(bestResume) }),
  );
  if (bestAnalysis.overallScore <= originalAnalysis.overallScore) {
    const qaFeedback = buildRevisionQaFeedback(bestAnalysis);
    const retryResume = await reviseResumeForAts({
      resumeText: resumeJsonToText(bestResume),
      suggestions: [
        ...targeted.suggestions,
        ...(bestAnalysis.topSuggestions?.length
          ? bestAnalysis.topSuggestions
          : suggestions || []
        ).slice(0, 6),
      ],
      sectionsToRevise: targeted.sections,
      optimizationFeedback: `REGRESSION DETECTED. Original score: ${originalAnalysis.overallScore}/100. First revision: ${bestAnalysis.overallScore}/100. Improve the targeted weak sections below and do not reduce stronger sections.\n${qaFeedback}`,
    });
    const retryAnalysis = normalizeAnalysis(
      await analyzeResumeForAts({ resumeText: resumeJsonToText(retryResume) }),
    );
    if (retryAnalysis.overallScore > bestAnalysis.overallScore) {
      bestResume = retryResume;
      bestAnalysis = retryAnalysis;
    }
  }
  return { resume: bestResume, analysis: bestAnalysis };
}
async function atsAnalyzeController(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  let tokenReserved = false;
  try {
    if (!userId)
      return res
        .status(401)
        .json({ message: "Please sign in to use AI resume analysis." });
    let resumeContent = "";
    const fileName =
      req.file?.originalname || req.body.fileName || "resume.pdf";
    if (req.file?.buffer) {
      const parser = new PDFParse({ data: req.file.buffer });
      try {
        resumeContent = (await parser.getText()).text || "";
      } finally {
        await parser.destroy();
      }
    } else if (req.body.resume) resumeContent = req.body.resume;
    if (!resumeContent.trim())
      return res
        .status(400)
        .json({
          message:
            "Please upload a resume PDF or paste your resume text to analyze.",
        });
    await consumeAiTokens(userId, "atsAnalysis");
    tokenReserved = true;
    const analysisResult = normalizeAnalysis(
      await analyzeResumeForAts({ resumeText: resumeContent }),
    );
    const requestedCategory = String(
      req.body.category || "general",
    ).toLowerCase();
    const category = ["general", "job-targeted", "optimized"].includes(
      requestedCategory,
    )
      ? requestedCategory
      : "general";
    const atsReport = await atsReportModel.create({
      user: userId,
      rawResumeText: resumeContent,
      resumeFileName: fileName,
      originalPdf: req.file?.buffer || null,
      title: String(
        req.body.title || getDefaultTitle(fileName, analysisResult),
      ).trim(),
      category,
      analysis: analysisResult,
      revisedResume: null,
    });
    tokenReserved = false;
    return res
      .status(201)
      .json({
        message: "Resume analyzed successfully for ATS compatibility",
        id: atsReport._id,
        atsReport,
      });
  } catch (error) {
    if (tokenReserved)
      await refundAiTokens(userId, "atsAnalysis").catch(() => {});
    next(error);
  }
}
async function atsReviseController(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  let tokenReserved = false;
  try {
    if (!userId)
      return res
        .status(401)
        .json({ message: "Please sign in to use AI resume optimization." });
    const { id, sections = "all", customNotes = "" } = req.body;
    if (!id)
      return res
        .status(400)
        .json({ message: "Analysis session ID is required for revision." });
    const report = await atsReportModel.findById(id);
    if (!report)
      return res
        .status(404)
        .json({
          message:
            "Analysis session not found. Please re-run the ATS analysis.",
        });
    if (report.user && String(report.user) !== String(userId))
      return res
        .status(403)
        .json({ message: "You do not have access to this ATS report." });
    const suggestions = [];
    if (report.analysis?.topSuggestions?.length)
      suggestions.push(...report.analysis.topSuggestions);
    if (report.analysis?.atsCompatibility?.issues?.length)
      report.analysis.atsCompatibility.issues.forEach((iss) =>
        suggestions.push({
          section: "ATS Formatting",
          suggestion: iss.fix,
          reasoning: iss.issue,
        }),
      );
    if (customNotes)
      suggestions.push({
        section: "User Request",
        suggestion: customNotes,
        reasoning: "User custom focus instruction",
      });
    await consumeAiTokens(userId, "resumeOptimization");
    tokenReserved = true;
    const optimized = await optimizeRevision({
      originalText: report.rawResumeText,
      originalAnalysis: report.analysis,
      suggestions,
      sections,
    });
    const previousScore = Number(report.analysis?.overallScore) || 0;
    report.revisedResume = optimized.resume;
    report.category = "optimized";
    await report.save();
    generateAtsPdfBuffer(optimized.resume, String(report._id)).catch((err) =>
      console.warn("Background PDF cache warming notice:", err.message),
    );
    tokenReserved = false;
    return res
      .status(200)
      .json({
        message:
          optimized.analysis.overallScore > previousScore
            ? `Resume revised successfully — QA score improved from ${previousScore} to ${optimized.analysis.overallScore}`
            : "Resume revised successfully with targeted optimization; the best generated version was retained",
        id: report._id,
        revisedResume: optimized.resume,
        revisedAnalysis: optimized.analysis,
        atsReport: report,
      });
  } catch (error) {
    if (tokenReserved)
      await refundAiTokens(userId, "resumeOptimization").catch(() => {});
    next(error);
  }
}
async function atsDownloadController(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  let tokenReserved = false;
  try {
    if (!userId)
      return res
        .status(401)
        .json({ message: "Please sign in to download an ATS resume." });
    const report = await atsReportModel.findById(req.params.id);
    if (!report)
      return res.status(404).json({ message: "Resume report not found." });
    if (report.user && String(report.user) !== String(userId))
      return res
        .status(403)
        .json({ message: "You do not have access to this ATS report." });
    let revisedResume = report.revisedResume;
    if (!revisedResume) {
      await consumeAiTokens(userId, "atsResumeGeneration");
      tokenReserved = true;
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
    const pdfBuffer = await generateAtsPdfBuffer(
      revisedResume,
      String(report._id),
    );
    const safeName = (
      revisedResume.contact?.fullName || "ATS-Optimized-Resume"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}_ATS_Resume.pdf"`,
    );
    tokenReserved = false;
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    if (tokenReserved)
      await refundAiTokens(userId, "atsResumeGeneration").catch(() => {});
    next(error);
  }
}
async function atsPreviewController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId)
      return res.status(401).json({ message: "Authentication is required." });
    const report = await atsReportModel
      .findById(req.params.id)
      .select("user revisedResume");
    if (!report)
      return res.status(404).json({ message: "Resume report not found." });
    if (String(report.user) !== String(userId))
      return res
        .status(403)
        .json({ message: "You do not have access to this ATS report." });
    if (!report.revisedResume)
      return res
        .status(404)
        .json({ message: "Generate the AI revision before previewing it." });
    const pdfBuffer = await generateAtsPdfBuffer(
      report.revisedResume,
      String(report._id),
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
async function atsOriginalController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId)
      return res.status(401).json({ message: "Authentication is required." });
    const report = await atsReportModel
      .findById(req.params.id)
      .select("user originalPdf rawResumeText resumeFileName");
    if (!report)
      return res.status(404).json({ message: "Resume report not found." });
    if (String(report.user) !== String(userId))
      return res
        .status(403)
        .json({ message: "You do not have access to this ATS report." });

    if (
      report.originalPdf &&
      Buffer.isBuffer(report.originalPdf) &&
      report.originalPdf.length > 0
    ) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "private, max-age=300");
      return res.status(200).send(report.originalPdf);
    }

    const fallbackBuffer = await generateAtsPdfBuffer({
      contact: { fullName: report.resumeFileName || "Original Resume" },
      summary: report.rawResumeText || "Original resume content",
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.status(200).send(fallbackBuffer);
  } catch (error) {
    next(error);
  }
}
async function getAtsReportByIdController(req, res, next) {
  try {
    const report = await atsReportModel.findById(req.params.id);
    if (!report)
      return res.status(404).json({ message: "ATS report not found" });
    const userId = getAuthenticatedUserId(req);
    if (!userId)
      return res
        .status(401)
        .json({ message: "Authentication is required to view ATS reports." });
    if (report.user && String(report.user) !== String(userId))
      return res
        .status(403)
        .json({ message: "You do not have access to this ATS report." });
    return res
      .status(200)
      .json({ message: "ATS report fetched successfully", atsReport: report });
  } catch (error) {
    next(error);
  }
}
async function listAtsReportsController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId)
      return res
        .status(401)
        .json({
          message: "Authentication is required to view ATS report history.",
        });
    const { search = "", sort = "recent", limit = 50 } = req.query;
    const filter = { user: userId };
    if (String(search).trim()) {
      const escaped = String(search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { resumeFileName: { $regex: escaped, $options: "i" } },
      ];
    }
    const sortOrder = sort === "oldest" ? 1 : -1;
    const reports = await atsReportModel
      .find(filter)
      .select(
        "_id title category resumeFileName analysis.overallScore analysis.atsCompatibility.score analysis.scoringVersion analysis.scoreBreakdown createdAt updatedAt revisedResume",
      )
      .sort({ createdAt: sortOrder })
      .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
      .lean();
    return res.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  atsAnalyzeController,
  atsReviseController,
  atsDownloadController,
  atsPreviewController,
  atsOriginalController,
  getAtsReportByIdController,
  listAtsReportsController,
};
