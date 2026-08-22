const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer, what key concepts and points to cover")
    })).describe("List of technical interview questions tailored to the candidate and role"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer using the STAR method (Situation, Task, Action, Result) and key points to cover")
    })).describe("List of behavioral interview questions"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The missing or weak skill identified"),
        severity: z.enum(["low", "medium", "high"]).describe("Severity level of the skill gap")
    })).describe("Identified gaps between candidate qualifications and job requirements"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("Day number of the study/preparation plan (e.g. 1, 2, 3...)"),
        focus: z.string().describe("The primary focus area or topic for this day"),
        tasks: z.string().describe("Detailed practice tasks, resources, or topics to study")
    })).describe("Step-by-step day-wise interview preparation roadmap")
})

// Clean JSON schema for Gemini's structured output (zodToJsonSchema output
// includes $schema/additionalProperties that Gemini's parser sometimes rejects).
const interviewReportJsonSchema = {
    type: "object",
    properties: {
        matchScore: { type: "number", description: "A score between 0 and 100 indicating how well the candidate matches the job description" },
        technicalQuestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    skill: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] }
                },
                required: ["skill", "severity"]
            }
        },
        preparationPlan: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    day: { type: "number" },
                    focus: { type: "string" },
                    tasks: { type: "string" }
                },
                required: ["day", "focus", "tasks"]
            }
        }
    },
    required: ["matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"]
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `
You are an expert technical interviewer and hiring manager.
Analyze the candidate's profile against the given Job Description and generate a comprehensive interview preparation report.

---
JOB DESCRIPTION:
${jobDescription || "Not provided"}

---
RESUME:
${resume || "Not provided"}

---
SELF DESCRIPTION:
${selfDescription || "Not provided"}

---
Provide a structured assessment including:
1. Match score (0 to 100)
2. Relevant technical interview questions with interviewer intention and comprehensive sample answers
3. Behavioral interview questions with intention and recommended STAR method answers
4. Identified skill gaps with severity (low, medium, high)
5. A day-wise preparation plan to help the candidate succeed in the interview
`;

    // Try structured output first; if Gemini's schema validation fails,
    // retry once without the schema and parse the JSON from the text.
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: interviewReportJsonSchema
            }
        })
        return JSON.parse(response.text)
    } catch (err) {
        console.warn("Structured output failed, retrying without schema:", err.message)
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        })
        return JSON.parse(response.text)
    }
}

module.exports = {
    generateInterviewReport,
    interviewReportSchema
}
module.exports.generateInterviewReport = generateInterviewReport
