import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: "Hello, I am Sanket." }] },
        { role: "model", parts: [{ text: "Hi Sanket! How can I help you today?" }] },
        { role: "user", parts: [{ text: "What is my name?" }] }
      ],
      config: {
        systemInstruction: "You are a helpful and concise AI assistant."
      }
    });
    console.log("SUCCESS:", response.text);
  } catch (error) {
    console.error("FAILED:", error.message);
  }
}

run();
