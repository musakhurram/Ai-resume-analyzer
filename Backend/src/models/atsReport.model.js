const mongoose = require("mongoose");

const atsIssueSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
    },
    issue: {
      type: String,
      required: true,
    },
    fix: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const atsSectionSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    feedback: {
      type: String,
      default: "",
    },
    suggestions: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const atsTopSuggestionSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    section: {
      type: String,
      required: true,
    },
    suggestion: {
      type: String,
      required: true,
    },
    reasoning: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const atsReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    rawResumeText: {
      type: String,
      required: [true, "Resume text is required"],
    },
    resumeFileName: {
      type: String,
      default: "resume.pdf",
    },
    analysis: {
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
      atsCompatibility: {
        score: {
          type: Number,
          min: 0,
          max: 100,
          required: true,
        },
        issues: [atsIssueSchema],
      },
      sections: {
        contactInfo: atsSectionSchema,
        summary: atsSectionSchema,
        experience: atsSectionSchema,
        skills: atsSectionSchema,
        education: atsSectionSchema,
        formatting: atsSectionSchema,
      },
      strengths: [String],
      topSuggestions: [atsTopSuggestionSchema],
    },
    revisedResume: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const atsReportModel =
  mongoose.models.AtsReport || mongoose.model("AtsReport", atsReportSchema);

module.exports = atsReportModel;
