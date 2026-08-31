const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const MODEL_NAME = "gemini-3.5-flash-lite";

const atsAnalysisJsonSchema = {
  type: "object",
  properties: {
    overallScore: {
      type: "number",
      description:
        "Overall ATS readiness and resume quality score between 0 and 100",
    },
    atsCompatibility: {
      type: "object",
      properties: {
        score: {
          type: "number",
          description:
            "ATS structural and parseability score between 0 and 100",
        },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              severity: { type: "string", enum: ["high", "medium", "low"] },
              issue: { type: "string" },
              fix: { type: "string" },
            },
            required: ["severity", "issue", "fix"],
          },
        },
      },
      required: ["score", "issues"],
    },
    sections: {
      type: "object",
      properties: {
        contactInfo: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
          },
          required: ["score", "feedback", "suggestions"],
        },
        summary: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
          },
          required: ["score", "feedback", "suggestions"],
        },
        experience: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
          },
          required: ["score", "feedback", "suggestions"],
        },
        skills: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
          },
          required: ["score", "feedback", "suggestions"],
        },
        education: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
          },
          required: ["score", "feedback", "suggestions"],
        },
        formatting: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
          },
          required: ["score", "feedback", "suggestions"],
        },
      },
      required: [
        "contactInfo",
        "summary",
        "experience",
        "skills",
        "education",
        "formatting",
      ],
    },
    strengths: { type: "array", items: { type: "string" } },
    topSuggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          priority: { type: "string", enum: ["high", "medium", "low"] },
          section: { type: "string" },
          suggestion: { type: "string" },
          reasoning: { type: "string" },
        },
        required: ["priority", "section", "suggestion", "reasoning"],
      },
    },
  },
  required: [
    "overallScore",
    "atsCompatibility",
    "sections",
    "strengths",
    "topSuggestions",
  ],
};

const atsRevisedResumeJsonSchema = {
  type: "object",
  properties: {
    contact: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" },
        website: { type: "string" },
      },
      required: ["fullName", "email", "phone", "location"],
    },
    summary: {
      type: "string",
      description:
        "ATS-optimized professional summary with target role keywords (3-4 concise lines)",
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          location: { type: "string" },
          dates: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["company", "title", "dates", "bullets"],
      },
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["category", "items"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          dates: { type: "string" },
          details: { type: "string" },
        },
        required: ["institution", "degree", "dates"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
          link: { type: "string" },
        },
        required: ["name", "bullets"],
      },
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          issuer: { type: "string" },
          date: { type: "string" },
        },
        required: ["name", "issuer"],
      },
    },
  },
  required: ["contact", "summary", "experience", "skills", "education"],
};

async function generateContentWithRetry(payload, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(payload);
    } catch (err) {
      lastError = err;
      const status = err.status || err.code;
      const retryable =
        status === 429 || (status >= 500 && status < 600) || !status;
      if (!retryable || attempt === maxRetries) break;
      const delayMs = 1000 * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(
        `Gemini ATS request failed (${status}), retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function analyzeResumeForAts({ resumeText }) {
  const prompt = `
You are an authoritative ATS parser and elite talent acquisition director.
Analyze this resume against general ATS standards and recruiter screening best practices without a specific job description.

RESUME TEXT:
${resumeText || "No resume text provided"}

Evaluate: standard parseable headers; machine-readable formatting; contact information; resume length/content density; quantified achievements; action verbs and tense; role relevance and industry-standard keywords; skills; education completeness; and formatting risks.

Be honest and calibrated. Scores must reflect the actual content. Do not reward a resume merely because it looks polished. Pay particular attention to whether experience bullets demonstrate impact and whether education/projects/credentials were preserved.
Return actionable suggestions.
`;
  try {
    const response = await generateContentWithRetry({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: atsAnalysisJsonSchema,
      },
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.warn(
      "Structured ATS analysis output failed, retrying without schema:",
      err.message,
    );
    const response = await generateContentWithRetry({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text);
  }
}

function resumeJsonToText(resume) {
  const parts = [];
  const c = resume?.contact || {};
  parts.push(
    [c.fullName, c.email, c.phone, c.location, c.linkedin, c.github, c.website]
      .filter(Boolean)
      .join(" | "),
  );
  if (resume?.summary) parts.push(`SUMMARY\n${resume.summary}`);
  for (const s of resume?.skills || [])
    parts.push(`SKILLS - ${s.category}: ${(s.items || []).join(", ")}`);
  for (const e of resume?.experience || [])
    parts.push(
      `EXPERIENCE\n${e.title || ""} | ${e.company || ""} | ${e.dates || ""}\n${(e.bullets || []).map((b) => `- ${b}`).join("\n")}`,
    );
  for (const e of resume?.education || [])
    parts.push(
      `EDUCATION\n${e.degree || ""} | ${e.institution || ""} | ${e.dates || ""}\n${e.details || ""}`,
    );
  for (const p of resume?.projects || [])
    parts.push(
      `PROJECT\n${p.name || ""} | ${p.role || ""}\n${(p.bullets || []).map((b) => `- ${b}`).join("\n")}\n${p.link || ""}`,
    );
  for (const c of resume?.certifications || [])
    parts.push(
      `CERTIFICATION\n${c.name || ""} | ${c.issuer || ""} | ${c.date || ""}`,
    );
  return parts.filter(Boolean).join("\n\n");
}

async function reviseResumeForAts({
  resumeText,
  suggestions = [],
  sectionsToRevise = "all",
  optimizationFeedback = "",
}) {
  const suggestionsText =
    Array.isArray(suggestions) && suggestions.length > 0
      ? suggestions
          .map(
            (s, idx) =>
              `${idx + 1}. [${s.section || "General"}] ${s.suggestion || s}`,
          )
          .join("\n")
      : "Address all general ATS compatibility weaknesses, weak action verbs, formatting issues, and improve impact quantification where supported by original facts.";

  const prompt = `
You are an executive resume writer and ATS optimization specialist.
Rewrite and optimize the candidate's resume based strictly on the provided resume and suggestions.

ORIGINAL/BASE RESUME TEXT:
${resumeText}

TARGET SUGGESTIONS (${sectionsToRevise === "all" ? "ALL SECTIONS" : JSON.stringify(sectionsToRevise)}):
${suggestionsText}

${optimizationFeedback ? `POST-REVISION QA FEEDBACK — FIX THESE ISSUES WITHOUT REGRESSIONS:\n${optimizationFeedback}\n` : ""}

CRITICAL QUALITY RULES:
1. ZERO FABRICATION. Preserve every factual detail. Never invent employers, titles, dates, degrees, GPA, certifications, metrics, percentages, money, team sizes, or achievements.
2. DO NOT DROP INFORMATION. Preserve all original sections and useful content, including projects, certifications, GPA/coursework, links, and complete work history whenever they exist. A revision that removes factual content is a regression.
3. EXPERIENCE IS THE HIGHEST-IMPACT CONTENT AREA. Strengthen every experience bullet with a strong action verb, what was done, the technology/process used, and the real outcome. Use existing numbers when available. If no metric exists, improve specificity without inventing one.
4. PRESERVE EDUCATION DETAILS. Keep GPA/CGPA, honors, relevant coursework, institution, degree, and dates when present.
5. PRESERVE PROJECTS AND CERTIFICATIONS. Include them whenever present in the source; do not omit them just because they are optional in the schema.
6. SKILLS: Keep all genuine original skills and organize them into ATS-standard categories. Do not remove skills merely to shorten the resume.
7. SUMMARY: Make it specific to the candidate's actual background, not generic filler. Do not claim experience the candidate does not have.
8. FORMATTING: The output will be rendered into a clean single-column ATS template. Use standard section names and concise content.
9. SELF-CHECK BEFORE OUTPUT: Compare your revised content against the source. The revised resume must be at least as complete as the source and should improve the weakest ATS areas identified by the suggestions.
10. Return only the required structured JSON.
`;

  try {
    const response = await generateContentWithRetry({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: atsRevisedResumeJsonSchema,
      },
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.warn(
      "Structured ATS revise output failed, retrying without schema:",
      err.message,
    );
    const response = await generateContentWithRetry({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text);
  }
}

module.exports = {
  MODEL_NAME,
  atsAnalysisJsonSchema,
  atsRevisedResumeJsonSchema,
  analyzeResumeForAts,
  reviseResumeForAts,
  resumeJsonToText,
};
