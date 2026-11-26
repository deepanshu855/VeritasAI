import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectToRedis, getRedis } from "../src/config/redis.config.js";
import { tavilySearch } from "../src/services/internet.service.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KEY_PATTERN = "tavily:v1:*";

const QUESTIONS = [
  "what is the capital of australia",
  "who won the 2022 fifa world cup",
  "how does a vector database work",
  "latest stable version of node.js",
  "what is retrieval augmented generation",
  "difference between sql and nosql databases",
  "how to center a div in css",
  "what is the speed of light in km per second",
  "best practices for jwt authentication",
  "what is cloud run in google cloud",
  "how does redis caching work",
  "what is the tallest building in the world",
  "explain big o notation simply",
  "what is docker compose used for",
  "how many people live in india",
  "what is the difference between tcp and udp",
  "how to prevent sql injection",
  "what is mongodb atlas search",
  "what is a websocket",
  "who wrote the book the pragmatic programmer",
];

const calls = [];
QUESTIONS.forEach((q) => calls.push({ pass: 1, query: q, expected: "MISS" }));
QUESTIONS.forEach((q) => calls.push({ pass: 2, query: q, expected: "HIT" }));
[
  QUESTIONS[0].toUpperCase(), // capitals
  "how does  a   vector database work", // extra spaces inside
  "  what is retrieval augmented generation  ", // spaces at the ends
  "How To Center A Div In CSS", // mixed case
  QUESTIONS[11] + " ", // trailing space
].forEach((q) => calls.push({ pass: 3, query: q, expected: "HIT" }));
// control: punctuation is NOT normalized, so this should be a MISS
calls.push({ pass: 4, query: QUESTIONS[18] + "?", expected: "MISS" });

const scanKeys = async (redis) => {
  const found = [];
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", KEY_PATTERN, "COUNT", 100);
    cursor = next;
    found.push(...keys);
  } while (cursor !== "0");
  return found;
};

const sorted = (a) => [...a].sort((x, y) => x - y);
const median = (a) => {
  const s = sorted(a);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const p95 = (a) => sorted(a)[Math.ceil(0.95 * a.length) - 1]; // nearest-rank
const stats = (a) =>
  a.length
    ? { n: a.length, min: Math.min(...a), median: median(a), p95: p95(a), max: Math.max(...a) }
    : null;

// ---- start ----
connectToRedis();
for (let i = 0; i < 50 && !getRedis(); i++) await sleep(100);
const redis = getRedis();
if (!redis) {
  console.log("Redis never became ready, stopping");
  process.exit(1);
}

const old = await scanKeys(redis);
if (old.length) await redis.del(...old);
console.log(`Deleted ${old.length} old tavily notes. Starting ${calls.length} calls...\n`);

// capture the app's own "[cache] tavily HIT/MISS" line for each call
const realLog = console.log;
let lastCacheLine = null;
console.log = (...args) => {
  const text = args.join(" ");
  if (text.startsWith("[cache] tavily")) {
    lastCacheLine = text;
    return;
  }
  realLog(...args);
};

const rows = [];
for (const c of calls) {
  lastCacheLine = null;
  const start = Date.now();
  let error = null;
  try {
    await tavilySearch({ query: c.query });
  } catch (err) {
    error = String(err.message).slice(0, 120);
  }
  const wallMs = Date.now() - start;
  const m = lastCacheLine?.match(/\] tavily (HIT|MISS) ms=(\d+)/);
  const status = error ? "ERROR" : m ? m[1] : "UNKNOWN";
  rows.push({ ...c, status, wallMs, loggedMs: m ? Number(m[2]) : null, error });
  realLog(
    `${String(rows.length).padStart(2)}. ${status.padEnd(5)} ${String(wallMs).padStart(5)} ms  (expected ${c.expected})  ${JSON.stringify(c.query)}`,
  );
}
console.log = realLog;

// ---- summary ----
const hits = rows.filter((r) => r.status === "HIT");
const misses = rows.filter((r) => r.status === "MISS");
const errors = rows.filter((r) => r.status === "ERROR" || r.status === "UNKNOWN");
const mismatches = rows.filter((r) => r.status !== r.expected);
const keysAfter = await scanKeys(redis);

const summary = {
  totalCalls: rows.length,
  hits: hits.length,
  misses: misses.length,
  errors: errors.length,
  expectedVsObservedMismatches: mismatches.length,
  tavilyCallsMade: misses.length,
  tavilyCallsSavedByCache: hits.length,
  redisKeysExpected: 21,
  redisKeysFound: keysAfter.length,
  hitWallMs: stats(hits.map((r) => r.wallMs)),
  missWallMs: stats(misses.map((r) => r.wallMs)),
};

realLog("\n=== SUMMARY ===");
realLog(JSON.stringify(summary, null, 2));
if (mismatches.length) {
  realLog("\nCalls that did not match the expectation:");
  mismatches.forEach((r) => realLog(`  pass ${r.pass} expected ${r.expected} got ${r.status}: ${JSON.stringify(r.query)}`));
}

// ---- save ----
const result = {
  date: new Date().toISOString(),
  conditions:
    "local Windows machine, Redis Cloud free plan (remote), Tavily free plan, default search depth, maxResults 5, TTL 3600 s, calls one at a time, single run",
  summary,
  rows,
};
const dir = path.join(fileURLToPath(new URL(".", import.meta.url)), "results");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `cache-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(file, JSON.stringify(result, null, 2));
realLog(`\nSaved: ${file}`);

redis.disconnect();
process.exit(0);