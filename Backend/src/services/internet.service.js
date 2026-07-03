import { tavily as Tavily } from "@tavily/core";

const tavily = Tavily({ api_key: process.env.TAVILY_API_KEY });

export const searchInternet = async (query) => {
  const results = await tavily.search(query, {
    maxResults: 5,
    searchDepth: "advanced",
  });

  return JSON.stringify(results);
};
