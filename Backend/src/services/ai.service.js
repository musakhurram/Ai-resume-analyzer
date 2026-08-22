const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

async function invokeGeminiAi(prompt = "Hello gemini ! explain what is interview") {
    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    })
    console.log(response.text)
    return response.text
}

module.exports = invokeGeminiAi
module.exports.invokeGeminiAi = invokeGeminiAi
