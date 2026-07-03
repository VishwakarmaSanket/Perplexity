import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-flash-latest",
  apiKey: process.env.GEMINI_API_KEY,
});

async function run() {
  try {
    const response = await geminiModel.invoke([["user", "Hello"]]);
    console.log("SUCCESS:", response.content);
  } catch (error) {
    console.error("FAILED:", error.message);
  }
}

run();
