const { getData } = require("pdf-parse/worker");
const { PDFParse } = require("pdf-parse");
PDFParse.setWorker(getData());

const {
  analyzeResumeForAts,
  reviseResumeForAts,
} = require("../services/atsAi.service");
const { generateAtsPdfBuffer } = require("../services/atsPdf.service");
const atsReportModel = require("../models/atsReport.model");

/**
 * @name atsAnalyzeController
 * @description Analyze resume against ATS best practices without job description
 * @route POST /api/resume/ats-analyze
 */
async function atsAnalyzeController(req, res, next) {
  try {
    let resumeContent = "";
    let fileName = req.file?.originalname || "resume.pdf";

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
      fileName = req.body.fileName || "Pasted-Resume.txt";
    }

    if (!resumeContent || !resumeContent.trim()) {
      return res.status(400).json({
        message:
          "Please upload a resume PDF or paste your resume text to analyze.",
      });
    }

    const analysisResult = await analyzeResumeForAts({
      resumeText: resumeContent,
    });

    const atsReport = await atsReportModel.create({
      user: req.user?.id || undefined,
      rawResumeText: resumeContent,
      resumeFileName: fileName,
      analysis: analysisResult,
      revisedResume: null,
    });

    return res.status(201).json({
      message: "Resume analyzed successfully for ATS compatibility",
      id: atsReport._id,
      atsReport,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @name atsReviseController
 * @description Generate AI-revised resume JSON based on analysis suggestions
 * @route POST /api/resume/ats-revise
 */
async function atsReviseController(req, res, next) {
  try {
    const { id, sections = "all", customNotes = "" } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Analysis session ID is required for revision.",
      });
    }

    const report = await atsReportModel.findById(id);
    if (!report) {
      return res.status(404).json({
        message: "Analysis session not found. Please re-run the ATS analysis.",
      });
    }

    // Collect targeted suggestions
    const suggestions = [];
    if (report.analysis?.topSuggestions?.length) {
      suggestions.push(...report.analysis.topSuggestions);
    }
    if (report.analysis?.atsCompatibility?.issues?.length) {
      report.analysis.atsCompatibility.issues.forEach((iss) => {
        suggestions.push({
          section: "ATS Formatting",
          suggestion: iss.fix,
          reasoning: iss.issue,
        });
      });
    }
    if (customNotes) {
      suggestions.push({
        section: "User Request",
        suggestion: customNotes,
        reasoning: "User custom focus instruction",
      });
    }

    const revisedJson = await reviseResumeForAts({
      resumeText: report.rawResumeText,
      suggestions,
      sectionsToRevise: sections,
    });

    report.revisedResume = revisedJson;
    await report.save();

    return res.status(200).json({
      message: "Resume revised successfully with AI",
      id: report._id,
      revisedResume: revisedJson,
      atsReport: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @name atsDownloadController
 * @description Generate and download clean single-column ATS PDF of revised resume
 * @route GET /api/resume/ats-download/:id
 */
async function atsDownloadController(req, res, next) {
  try {
    const { id } = req.params;

    const report = await atsReportModel.findById(id);
    if (!report) {
      return res.status(404).json({
        message: "Resume report not found.",
      });
    }

    let revisedResume = report.revisedResume;

    // If not yet revised, generate revision on-the-fly
    if (!revisedResume) {
      const suggestions = report.analysis?.topSuggestions || [];
      revisedResume = await reviseResumeForAts({
        resumeText: report.rawResumeText,
        suggestions,
        sectionsToRevise: "all",
      });
      report.revisedResume = revisedResume;
      await report.save();
    }

    const pdfBuffer = await generateAtsPdfBuffer(revisedResume);

    const safeName = (
      revisedResume.contact?.fullName || "ATS-Optimized-Resume"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}_ATS_Resume.pdf"`,
    );

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * @name getAtsReportByIdController
 * @description Fetch an existing ATS report by session ID
 * @route GET /api/resume/ats-report/:id
 */
async function getAtsReportByIdController(req, res, next) {
  try {
    const { id } = req.params;
    const report = await atsReportModel.findById(id);

    if (!report) {
      return res.status(404).json({
        message: "ATS report not found",
      });
    }

    return res.status(200).json({
      message: "ATS report fetched successfully",
      atsReport: report,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  atsAnalyzeController,
  atsReviseController,
  atsDownloadController,
  getAtsReportByIdController,
};
