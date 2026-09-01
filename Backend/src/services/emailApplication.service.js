const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
const MODEL_NAME = "gemini-3.5-flash-lite";

const emailSchema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    message: { type: "string" },
  },
  required: ["subject", "message"],
};

async function generateJobApplicationEmail({
  resumeText = "",
  candidateName = "",
  recipientEmail = "",
  jobTitle = "",
  companyName = "",
  jobDescription = "",
  strengths = [],
}) {
  const prompt = `You are an expert recruiter and professional job-application writer.
Write one concise, personalized job-application email using ONLY facts supported by the candidate's resume.

CANDIDATE: ${candidateName || "Not provided"}
RECIPIENT: ${recipientEmail || "Not provided"}
JOB TITLE: ${jobTitle || "Not provided"}
COMPANY: ${companyName || "Not provided"}
JOB DESCRIPTION:
${jobDescription || "Not provided. Do not invent a role or company."}

RESUME:
${resumeText || "No resume provided"}

RELEVANT RESUME STRENGTHS:
${Array.isArray(strengths) ? strengths.slice(0, 6).join("; ") : ""}

RULES:
1. Never invent experience, skills, education, metrics, employers, titles, achievements, projects, links, or contact details.
2. If a job description is supplied, mention only genuine matches from the resume.
3. Keep the subject under 100 characters and natural. Prefer "Application for [Role] — [Name]" when both are known.
4. Keep the email between 90 and 180 words.
5. Use a normal professional structure: greeting, purpose, one short qualifications paragraph, attachment reference, courteous closing, candidate name.
6. Use "Dear Hiring Manager" when a recipient name is unavailable.
7. No emojis, hashtags, ALL CAPS, excessive punctuation, sales language, urgency, fake personalization, tracking language, or spam-like phrases.
8. Do not add phone numbers, URLs, addresses, or signature details unless they are explicitly present in the resume.
9. Do not mention that AI wrote the message.
10. Return only JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: emailSchema,
      temperature: 0.35,
      maxOutputTokens: 500,
    },
  });

  const result = JSON.parse(response.text);
  return {
    subject: String(result.subject || "Application").replace(/[\r\n]/g, " ").trim().slice(0, 100),
    message: String(result.message || "").replace(/\r\n/g, "\n").trim().slice(0, 5000),
  };
}

module.exports = { generateJobApplicationEmail };
