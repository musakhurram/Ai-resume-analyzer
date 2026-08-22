const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

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

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema)
        }
    })

     
    return JSON.parse(response.text)
}

module.exports = {
    generateInterviewReport,
    interviewReportSchema
}
module.exports.generateInterviewReport = generateInterviewReport
