import "dotenv/config";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
// const response = await tvly.search("Who is Leo Messi?");

export const tavilySearch = async ({query}) => {
  const response = await tvly.search(query);

  return JSON.stringify(response);
};
