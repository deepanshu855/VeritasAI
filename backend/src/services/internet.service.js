import "dotenv/config";
import crypto from "node:crypto"; // NEW (built into Node)
import { tavily } from "@tavily/core";
import { getCached, setCached } from "./cache.service.js"; // NEW

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
// const response = await tvly.search("Who is Leo Messi?");

// NEW: 1 hour, as agreed. If you change maxResults, change v1 to v2 below.
const CACHE_TTL_SECONDS = 3600;
const MAX_RESULTS = 5;

// NEW: same question (any case, extra spaces) gives the same label
const makeCacheKey = (query) => {
  const normalized = String(query).trim().toLowerCase().replace(/\s+/g, " ");
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return `tavily:v1:${hash}`;
};

// CHANGED: checks the cache first
export const tavilySearch = async ({ query }) => {
  const key = makeCacheKey(query);
  const start = Date.now();

  // NEW: hit = return the saved note, Tavily is not called
  const cached = await getCached(key);
  if (cached) {
    console.log(`[cache] tavily HIT ms=${Date.now() - start}`);
    return JSON.stringify(cached);
  }

  // miss = call Tavily as before (CHANGED: uses MAX_RESULTS)
  const response = await tvly.search(query, {
    maxResults: MAX_RESULTS,
  });

  // NEW: save only if there is at least one result
  const hasResults =
    Array.isArray(response.results) && response.results.length > 0;
  const saved = hasResults
    ? await setCached(key, response, CACHE_TTL_SECONDS)
    : false;
  console.log(
    `[cache] tavily MISS ms=${Date.now() - start} results=${response.results?.length ?? 0} saved=${saved}`,
  );

  return JSON.stringify(response);
};