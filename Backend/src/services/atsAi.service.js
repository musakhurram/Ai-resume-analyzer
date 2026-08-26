const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// Model name aligned with app-wide configuration
const MODEL_NAME = "gemini-3.5-flash-lite";

/**
 * 1. Fully flattened JSON Schema for ATS Analysis (No $ref - Gemini compliant)
 */
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
              severity: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Severity level of the ATS issue",
              },
              issue: {
                type: "string",
                description:
                  "Clear description of the ATS parsing or formatting flaw",
              },
              fix: {
                type: "string",
                description:
                  "Actionable recommendation to fix this specific issue",
              },
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
    strengths: {
      type: "array",
      items: { type: "string" },
      description:
        "List of strong resume aspects that meet or exceed ATS best practices",
    },
    topSuggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          priority: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
          section: {
            type: "string",
            description:
              "Section name (experience, skills, summary, contactInfo, formatting, education)",
          },
          suggestion: {
            type: "string",
            description: "Actionable improvement directive",
          },
          reasoning: {
            type: "string",
            description:
              "Why this change improves ATS ranking or recruiter conversion",
          },
        },
        required: ["priority", "section", "suggestion", "reasoning"],
      },
      description:
        "Top prioritized actionable suggestions to maximize ATS performance",
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

module.exports = {
  MODEL_NAME,
  atsAnalysisJsonSchema,
};

/**
 * 2. Fully flattened JSON Schema for AI Revised Resume (No $ref - Gemini compliant)
 */
const atsRevisedResumeJsonSchema = {
  type: "object",
  properties: {
    contact: {
      type: "object",
      properties: {
        fullName: { type: "string", description: "Candidate full name" },
        email: { type: "string", description: "Clean standard email address" },
        phone: { type: "string", description: "Standard formatted phone number" },
        location: { type: "string", description: "City, State or Country" },
        linkedin: { type: "string", description: "LinkedIn profile URL or handle" },
        github: { type: "string", description: "GitHub profile URL or handle (if technical)" },
        website: { type: "string", description: "Portfolio website URL" },
      },
      required: ["fullName", "email", "phone", "location"],
    },
    summary: {
      type: "string",
      description: "ATS-optimized professional summary with target role keywords (3-4 concise lines)",
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          location: { type: "string" },
          dates: { type: "string", description: "Employment dates, e.g. 'Jan 2022 – Present'" },
          bullets: {
            type: "array",
            items: { type: "string" },
            description: "Action-verb led, quantified achievement bullet points strictly preserving original facts",
          },
        },
        required: ["company", "title", "dates", "bullets"],
      },
      description: "Work history entries sorted reverse-chronologically",
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string", description: "Category name e.g., 'Languages & Frameworks', 'Cloud & DevOps'" },
          items: {
            type: "array",
            items: { type: "string" },
            description: "Individual skills extracted cleanly",
          },
        },
        required: ["category", "items"],
      },
      description: "Categorized skills for maximum ATS keyword parsing",
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          dates: { type: "string" },
          details: { type: "string", description: "Honors, GPA, relevant coursework (if present in original)" },
        },
        required: ["institution", "degree", "dates"],
      },
      description: "Educational history",
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
      description: "Key notable projects (if present in original resume)",
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
      description: "Professional certifications and licenses (if present in original resume)",
    },
  },
  required: ["contact", "summary", "experience", "skills", "education"],
};

// Retry transient failures (429 rate limit, 5xx) with exponential backoff
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

/**
 * 3. Gemini ATS Analysis Function
 */
async function analyzeResumeForAts({ resumeText }) {
  const prompt = `
You are an authoritative ATS (Applicant Tracking System) parser and elite talent acquisition director.
Analyze the following resume purely against general industry ATS standards and technical recruiter screening best practices (without a specific job description).

---
RESUME TEXT:
${resumeText || "No resume text provided"}

---
EVALUATION CRITERIA & RULES:
1. Standard, Parseable Section Headers: Verify standard naming (Summary, Work Experience, Skills, Education, Projects, Certifications) that standard ATS parsers (Workday, Taleo, Greenhouse, Lever) recognize.
2. ATS Formatting & Parsing Compatibility: Flag risks like multi-column layouts, tables, text boxes, graphics, non-standard symbols, missing labels, or irregular date formats that scramble parser tokenization.
3. Quantified Achievements vs. Vague Statements: Check whether bullet points demonstrate measurable business impact (%, $, scale, performance metrics, latency, volume) rather than simple duty descriptions.
4. Action Verbs & Tense Consistency: Check for powerful active verbs (e.g., "Architected", "Engineered", "Spearheaded") vs weak passive phrasing ("Responsible for", "Assisted with"). Ensure past jobs use past tense, current roles use present tense.
5. Machine-Readable Contact Info: Check for clear full name, email address, standardized phone format, location (City, State/Country or Remote), and clean professional URLs (LinkedIn, GitHub, Portfolio).
6. Resume Length & Content Density: Evaluate appropriateness (1 page for early career / <5 yrs, 2 pages for senior/lead). Check for fluff, redundant statements, or awkward whitespace.
7. Inferred Role & Keyword Relevance: Infer the candidate's target profession/discipline and seniority level directly from their background. Evaluate whether industry-standard technical keywords, competencies, tools, and methodologies are effectively incorporated.

Return honest, calibrated scores (0-100) and actionable, high-utility suggestions.
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
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  }
}

/**
 * 4. Gemini ATS Resume Revise Function (Strict "No Fabrication" Rule)
 */
async function reviseResumeForAts({ resumeText, suggestions = [], sectionsToRevise = "all" }) {
  const suggestionsText = Array.isArray(suggestions) && suggestions.length > 0
    ? suggestions.map((s, idx) => `${idx + 1}. [${s.section || "General"}] ${s.suggestion || s}`).join("\n")
    : "Address all general ATS compatibility weaknesses, weak action verbs, formatting issues, and improve impact quantification where supported by original facts.";

  const prompt = `
You are an executive resume writer and ATS optimization specialist.
Rewrite and optimize the candidate's resume based strictly on the provided resume text and targeted suggestions.

---
ORIGINAL RESUME TEXT:
${resumeText}

---
TARGET SUGGESTIONS & SECTIONS TO IMPROVE (${sectionsToRevise === "all" ? "ALL SECTIONS" : JSON.stringify(sectionsToRevise)}):
${suggestionsText}

---
CRITICAL ANTI-FABRICATION & QUALITY CONSTRAINTS (STRICTLY ENFORCED):
1. ZERO FABRICATION: You MUST strictly preserve all factual content. Do NOT invent companies, job titles, employment dates, schools, degrees, GPAs, credentials, or certifications.
2. NO INVENTED METRICS: Do NOT fabricate artificial percentages, dollar amounts, revenue numbers, or team sizes that are not present or directly supported in the original resume text. If a bullet states "improved database query performance", you may rephrase to "Optimized complex database queries to reduce execution latency", but you MUST NOT claim "reduced query latency by 87.4% and saved $450,000" if those numbers were not in the original text.
3. TRANSFORM BULLETS WITH GOOGLE X-Y-Z FORMULA: Rephrase passive duties ("Responsible for maintaining servers") into strong, active achievement bullets ("Maintained high-availability server clusters to ensure system uptime and reliability").
4. KEYWORD TAXONOMY: Group skills into logical, ATS-standard categories (e.g., "Languages", "Frameworks & Libraries", "Cloud & Infrastructure", "Databases", "Developer Tools").
5. GRAMMAR & TENSE: Ensure flawless spelling, grammar, and consistent tense (past tense for past roles, present tense for current positions).
6. STRUCTURED JSON: Output the full revised resume in the required structured JSON format so it can be rendered into a clean single-column ATS template.
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
      config: {
        responseMimeType: "application/json",
      },
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
};
