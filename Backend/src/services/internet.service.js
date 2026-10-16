import { tavily as Tavily } from "@tavily/core";

const tavilyApiKey = process.env.TAVILY_API_KEY?.trim();
const tavily = tavilyApiKey ? Tavily({ api_key: tavilyApiKey }) : null;

export const searchInternet = async (query) => {
  if (!tavily) {
    throw new Error("TAVILY_API_KEY is not configured.");
  }

  const results = await tavily.search(query, {
    maxResults: 5,
    searchDepth: "advanced",
  });

  const sources = (results.results || []).map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    publishedDate: result.published_date || null,
  }));

  return JSON.stringify({
    answer: results.answer || null,
    sources,
  });
};
