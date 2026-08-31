const { generateAtsPdfBufferSafe } = require("../services/atsPdf.safe.service");
const atsReportModel = require("../models/atsReport.model");

function getAuthenticatedUserId(req) {
  return req.user?.id || req.user?._id || undefined;
}

function getRevisionPdfCacheKey(report) {
  const version = report.updatedAt
    ? new Date(report.updatedAt).getTime()
    : Date.now();
  return `${String(report._id)}:${version}`;
}

async function atsManualRevisionPdfController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId)
      return res.status(401).json({ message: "Authentication is required." });

    const report = await atsReportModel
      .findById(req.params.id)
      .select("user revisedResume updatedAt");
    if (!report)
      return res.status(404).json({ message: "Resume report not found." });
    if (String(report.user) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "You do not have access to this ATS report." });
    }
    if (!report.revisedResume) {
      return res
        .status(404)
        .json({ message: "Generate the AI revision before previewing it." });
    }

    const pdfBuffer = await generateAtsPdfBufferSafe(
      report.revisedResume,
      getRevisionPdfCacheKey(report),
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

module.exports = { atsManualRevisionPdfController };
