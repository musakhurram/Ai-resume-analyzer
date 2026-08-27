const mongoose = require("mongoose");

const atsIssueSchema = new mongoose.Schema(
  { severity: { type: String, enum: ["high", "medium", "low"], required: true }, issue: { type: String, required: true }, fix: { type: String, required: true } },
  { _id: false },
);
const atsSectionSchema = new mongoose.Schema(
  { score: { type: Number, min: 0, max: 100, default: 0 }, feedback: { type: String, default: "" }, suggestions: { type: [String], default: [] } },
  { _id: false },
);
const atsTopSuggestionSchema = new mongoose.Schema(
  { priority: { type: String, enum: ["high", "medium", "low"], default: "medium" }, section: { type: String, required: true }, suggestion: { type: String, required: true }, reasoning: { type: String, default: "" } },
  { _id: false },
);
const atsScoreBreakdownItemSchema = new mongoose.Schema(
  { score: { type: Number, min: 0, max: 100, default: 0 }, weight: { type: Number, min: 0, max: 100, required: true }, contribution: { type: Number, min: 0, max: 100, default: 0 } },
  { _id: false },
);

const atsReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: false, index: true },
    rawResumeText: { type: String, required: [true, "Resume text is required"] },
    resumeFileName: { type: String, default: "resume.pdf" },
    originalPdf: { type: Buffer, default: null, select: false },
    category: { type: String, enum: ["general", "job-targeted", "optimized"], default: "general", index: true },
    title: { type: String, default: "ATS Resume Review", trim: true },
    analysis: {
      overallScore: { type: Number, min: 0, max: 100, required: true }, scoringVersion: { type: String, default: "v2" },
      scoreBreakdown: { atsCompatibility: atsScoreBreakdownItemSchema, contactInfo: atsScoreBreakdownItemSchema, summary: atsScoreBreakdownItemSchema, experience: atsScoreBreakdownItemSchema, skills: atsScoreBreakdownItemSchema, education: atsScoreBreakdownItemSchema, formatting: atsScoreBreakdownItemSchema },
      atsCompatibility: { score: { type: Number, min: 0, max: 100, required: true }, issues: [atsIssueSchema] },
      sections: { contactInfo: atsSectionSchema, summary: atsSectionSchema, experience: atsSectionSchema, skills: atsSectionSchema, education: atsSectionSchema, formatting: atsSectionSchema },
      strengths: [String], topSuggestions: [atsTopSuggestionSchema],
    },
    revisedResume: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

atsReportSchema.index({ user: 1, createdAt: -1 });
atsReportSchema.index({ user: 1, category: 1, createdAt: -1 });

const atsReportModel = mongoose.models.AtsReport || mongoose.model("AtsReport", atsReportSchema);
module.exports = atsReportModel;
