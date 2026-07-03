import { GoogleGenAI } from "@google/genai";
import { searchInternet } from "./internet.service.js";

// Initialize the GoogleGenAI instance
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })
  : null;

if (!ai) {
  console.warn("⚠️ GEMINI_API_KEY is missing in your .env file! AI features will fail.");
}

// Generate chat title
export async function generateChatTitle(message) {
  try {
    if (!ai) {
      throw new Error("Google GenAI client is not initialized.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a title for this message: "${message}"`,
      config: {
        systemInstruction: `You are an AI assistant that generates concise, clear, and engaging titles for chat conversations.
Given a user's message, create a short title (2–3 words only) that accurately captures the main topic or intent of the conversation.
Do not include punctuation, emojis, or extra words.
Return only the title and nothing else.`
      }
    });

    console.log("Generated chat title:", response.text);
    return response.text.trim();
  } catch (err) {
    console.error("Error generating chat title:", err);
    throw new Error("Failed to generate chat title");
  }
}

// Generate response with optional web search (RAG)
export async function generateResponse(messages, webSearch = false) {
  try {
    if (!ai) {
      throw new Error("Google GenAI client is not initialized.");
    }

    // Convert messages to Google GenAI structure
    const contents = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    let systemInstruction = "You are a helpful and concise AI assistant.";

    if (webSearch) {
      // Get the last user message to use as the search query
      const lastUserMsg = [...messages].reverse().find(msg => msg.role === "user");
      const searchQuery = lastUserMsg ? lastUserMsg.content : "";

      let searchResultsStr = "";
      if (searchQuery) {
        console.log(`🌐 [ai.service] Performing web search for: "${searchQuery}"`);
        try {
          searchResultsStr = await searchInternet(searchQuery);
        } catch (searchError) {
          console.error("❌ [ai.service] Web search failed:", searchError.message);
          searchResultsStr = "No search results available (search failed).";
        }
      }

      systemInstruction = `You are a helpful and concise AI assistant with access to real-time search results.

Here are the latest web search results relevant to the user's query:
${searchResultsStr}

RULES:
1. Use the provided search results to generate a factually accurate, clear, and concise response.
2. If the search results do not contain relevant info or are empty, reply based on your knowledge but note that the search failed or was inconclusive.
3. Reference facts from the search results where appropriate.`;
    } else {
      systemInstruction = "You are a helpful and concise AI assistant. Answer the user directly without using any external tools.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (err) {
    console.error("Error in generateResponse:", err);
    throw new Error("Failed to generate response: " + err.message);
  }
}
