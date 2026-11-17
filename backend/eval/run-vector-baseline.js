import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { retrieveChunks } from "../src/services/retrieval.service.js";
import { questions } from "./questions.js";

// The clean test chat (SQL PDF uploaded once) and its owner
const USER_ID = "6ae8b484e1c581be9729dcb9";
const CHAT_ID = "6af9b6d398c23e1f7d52ec98";

const LIMIT = 10; // we look at the top 10 ...
const K = 5; // ... but the hit rate is measured on the top 5
const PAUSE_MS = 700; // small pause between questions, to be gentle with API limits

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const median = (nums) => {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

// Asks one question and works out where the first correct page ranked
const runOne = async (q) => {
  try {
    const { chunks, stats } = await retrieveChunks({
      question: q.text,
      userId: USER_ID,
      chatId: CHAT_ID,
      limit: LIMIT,
    });
    const top = chunks.map((c) => ({
      page: c.pageNumber,
      chunk: c.chunkIndex,
      score: Number(c.score.toFixed(4)),
    }));
    const index = q.pages.length ? top.findIndex((t) => q.pages.includes(t.page)) : -1;
    const rank = index === -1 ? null : index + 1;
    return { ...q, rank, hitAt5: rank !== null && rank <= K, top, stats, error: null };
  } catch (err) {
    return { ...q, rank: null, hitAt5: false, top: [], stats: null, error: err.message };
  }
};

// Hit rate and average reciprocal rank for a group of questions
const summarize = (list) => ({
  questions: list.length,
  hitAt5: list.filter((r) => r.hitAt5).length,
  hitAt10: list.filter((r) => r.rank !== null).length,
  mrr: list.length
    ? Number((list.reduce((sum, r) => sum + (r.rank ? 1 / r.rank : 0), 0) / list.length).toFixed(3))
    : null,
});

const line = (name, s) =>
  `${name}: hit@5 = ${s.hitAt5}/${s.questions}, hit@10 = ${s.hitAt10}/${s.questions}, MRR = ${s.mrr}`;

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const results = [];
  for (const q of questions) {
    results.push(await runOne(q));
    await sleep(PAUSE_MS);
  }

  console.log("\n=== Per question ===");
  console.table(
    results.map((r) => ({
      id: r.id,
      type: r.type,
      question: r.text.slice(0, 45),
      rank: r.type === "none" ? "-" : (r.rank ?? "miss"),
      "hit@5": r.type === "none" ? "-" : r.hitAt5 ? "yes" : "no",
      "top 5 pages": r.top.slice(0, 5).map((t) => t.page).join(","),
      topScore: r.top[0]?.score ?? "-",
      error: r.error ?? "",
    })),
  );

  const errors = results.filter((r) => r.error);
  const answerable = results.filter((r) => r.type !== "none" && !r.error);
  const summary = {
    overall: summarize(answerable),
    meaning: summarize(answerable.filter((r) => r.type === "meaning")),
    term: summarize(answerable.filter((r) => r.type === "term")),
  };

  console.log("\n=== Totals (vector-only) ===");
  console.log(line("Overall", summary.overall));
  console.log(line("Meaning", summary.meaning));
  console.log(line("Exact-term", summary.term));
  if (errors.length) {
    console.log(`WARNING: ${errors.length} question(s) failed and are NOT counted. Re-run before trusting the totals.`);
  }

  console.log("\n=== Misses (not in top 5) ===");
  for (const r of answerable.filter((r) => !r.hitAt5)) {
    console.log(
      `#${r.id} "${r.text}" accepted pages: ${r.pages.join(",")} | rank: ${r.rank ?? "not in top 10"} | top 5: ${r.top
        .slice(0, 5)
        .map((t) => `p${t.page} (${t.score})`)
        .join(", ")}`,
    );
  }

  console.log("\n=== No-answer questions (top scores) ===");
  for (const r of results.filter((r) => r.type === "none" && !r.error)) {
    console.log(`#${r.id} "${r.text}" -> top 3: ${r.top.slice(0, 3).map((t) => `p${t.page} (${t.score})`).join(", ")}`);
  }

  const embedMs = results.filter((r) => r.stats).map((r) => r.stats.embedMs);
  const searchMs = results.filter((r) => r.stats).map((r) => r.stats.searchMs);
  console.log(
    `\nMedian timing, single run, limit ${LIMIT}: embedMs = ${median(embedMs)}, searchMs = ${median(searchMs)} (NOT for the resume)`,
  );

  // Save everything so the hybrid run can be compared to exactly this
  const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "results");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "vector-baseline.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        chatId: CHAT_ID,
        embeddingModel: "gemini-embedding-001:768",
        limit: LIMIT,
        k: K,
        summary,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`\nSaved: ${outFile}`);
};

main()
  .catch((err) => console.error("Eval failed:", err))
  .finally(() => mongoose.disconnect());