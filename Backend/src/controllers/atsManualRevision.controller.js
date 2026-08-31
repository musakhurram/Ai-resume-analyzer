const { generateAtsPdfBuffer } = require("../services/atsPdf.service");
const atsReportModel = require("../models/atsReport.model");

function getAuthenticatedUserId(req) {
  return req.user?.id || req.user?._id || undefined;
}

async function atsManualRevisionController(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId)
      return res.status(401).json({ message: "Authentication is required." });
    const { revisedResume } = req.body;
    if (
      !revisedResume ||
      typeof revisedResume !== "object" ||
      Array.isArray(revisedResume)
    )
      return res
        .status(400)
        .json({ message: "A valid edited resume is required." });
    const report = await atsReportModel.findById(req.params.id);
    if (!report)
      return res.status(404).json({ message: "Resume report not found." });
    if (String(report.user) !== String(userId))
      return res
        .status(403)
        .json({ message: "You do not have access to this ATS report." });
    report.revisedResume = revisedResume;
    report.category = "optimized";
    await report.save();
    const pdfBuffer = await generateAtsPdfBuffer(
      revisedResume,
      String(report._id),
    );
    return res
      .status(200)
      .json({
        message: "Manual edits saved and PDF regenerated.",
        revisedResume,
        pdfReady: Boolean(pdfBuffer?.length),
      });
  } catch (error) {
    next(error);
  }
}

module.exports = { atsManualRevisionController };
