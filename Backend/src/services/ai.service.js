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

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_MODELS = [
  GEMINI_MODEL,
  "gemini-3.8-flash",
].filter((model, index, models) => models.indexOf(model) === index);
const transientStatusCodes = new Set([429, 500, 502, 503, 504]);

function getResponseText(response) {
  const value = typeof response?.text === "function" ? response.text() : response?.text;
  return typeof value === "string" ? value.trim() : "";
}

function fallbackTitle(message) {
  const words = String(message)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);

  return words.length ? words.join(" ") : "New chat";
}

async function generateContentWithRetry(request, retries = 3) {
  let lastError;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await ai.models.generateContent({ ...request, model });
      } catch (error) {
        lastError = error;
        const modelUnavailable = error.status === 400 || error.status === 404;
        const shouldRetry = transientStatusCodes.has(error.status) && attempt < retries;

        if (modelUnavailable || !shouldRetry) break;

        const delay = 750 * 2 ** attempt;
        console.warn(
          `Gemini request failed with ${error.status}; retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Generate chat title
export async function generateChatTitle(message) {
  // Titles are deliberately local. They are only navigation labels, and
  // making them a second provider request delays the first useful answer.
  const title = fallbackTitle(message);
  console.log("Generated chat title:", title);
  return title;
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

      const currentDate = new Date().toISOString().slice(0, 10);
      systemInstruction = `You are a helpful and concise AI assistant with access to real-time search results.

Today is ${currentDate}. For questions about recent events or a specific year, prioritize the supplied search results and use their publication dates when available.

Here are the latest web search results relevant to the user's query:
${searchResultsStr}

RULES:
1. Use the provided search results to generate a factually accurate, clear, and concise response.
2. If the search results do not contain relevant info or are empty, reply based on your knowledge but note that the search failed or was inconclusive.
3. Reference facts from the search results where appropriate.`;
    } else {
      systemInstruction = "You are a helpful and concise AI assistant. Answer the user directly without using any external tools.";
    }

    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const result = getResponseText(response);
    if (!result) {
      throw new Error("The AI provider returned an empty response.");
    }
    return result;
  } catch (err) {
    console.error("Error in generateResponse:", err);
    throw new Error("Failed to generate response: " + err.message);
  }
}
