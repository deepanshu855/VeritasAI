import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { retrieveAll } from "../src/services/hybrid-retrieval.service.js";
import { questions } from "./questions.js";

// The clean test chat (SQL PDF uploaded once) and its owner
const USER_ID = "6ae8b484e1c581be9729dcb9";
const CHAT_ID = "6af9b6d398c23e1f7d52ec98";

const K = 5; // hit rate is measured on the top 5
const CUTOFF = 10; // same as the saved baseline: a page found below rank 10 counts as a miss
const PAUSE_MS = 700; // small pause between questions, to be gentle with API limits
const MODES = ["vector", "keyword", "hybrid"];

const here = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const median = (nums) => {
  const clean = nums.filter((n) => typeof n === "number");
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

// Position (1 = first) of the first chunk from an accepted page, or null
const rankOf = (list, pages) => {
  if (!pages.length) return null;
  const index = list.slice(0, CUTOFF).findIndex((c) => pages.includes(c.pageNumber));
  return index === -1 ? null : index + 1;
};

const brief = (list, n = 5) =>
  list.slice(0, n).map((c) => ({ page: c.pageNumber, score: Number(c.score.toFixed(4)) }));

const runOne = async (q) => {
  try {
    const all = await retrieveAll({ question: q.text, userId: USER_ID, chatId: CHAT_ID });
    const ranks = {};
    for (const mode of MODES) ranks[mode] = rankOf(all[mode], q.pages);
    return {
      ...q,
      ranks,
      top: { vector: brief(all.vector), keyword: brief(all.keyword), hybrid: brief(all.hybrid) },
      keywordCount: all.keyword.length,
      stats: all.stats,
      error: null,
    };
  } catch (err) {
    return {
      ...q,
      ranks: { vector: null, keyword: null, hybrid: null },
      top: { vector: [], keyword: [], hybrid: [] },
      keywordCount: 0,
      stats: null,
      error: err.message,
    };
  }
};

// hit@5, hit@10 and MRR for one mode over a group of questions
const summarize = (list, mode) => {
  const ranks = list.map((r) => r.ranks[mode]);
  return {
    questions: list.length,
    hitAt5: ranks.filter((r) => r !== null && r <= K).length,
    hitAt10: ranks.filter((r) => r !== null).length,
    mrr: list.length
      ? Number((ranks.reduce((sum, r) => sum + (r ? 1 / r : 0), 0) / list.length).toFixed(3))
      : null,
  };
};

// Is hybrid's rank better, worse or the same as vector-only's? (null = not found = worst)
const compare = (vectorRank, hybridRank) => {
  const a = vectorRank ?? Infinity;
  const b = hybridRank ?? Infinity;
  if (b < a) return "better";
  if (b > a) return "worse";
  return "same";
};

const show = (rank) => (rank === null ? "miss" : rank);

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const results = [];
  for (const q of questions) {
    results.push(await runOne(q));
    await sleep(PAUSE_MS);
  }

  const answerable = results.filter((r) => r.type !== "none" && !r.error);
  const groups = {
    overall: answerable,
    meaning: answerable.filter((r) => r.type === "meaning"),
    term: answerable.filter((r) => r.type === "term"),
  };
  const summary = {};
  for (const [name, list] of Object.entries(groups)) {
    summary[name] = {};
    for (const mode of MODES) summary[name][mode] = summarize(list, mode);
  }

  // ---- Per question: rank of the first correct page in each mode ----
  console.log("\n=== Rank of the first correct page (1 = best, miss = not in top 10) ===");
  console.table(
    results.map((r) => {
      const none = r.type === "none";
      return {
        id: r.id,
        type: r.type,
        question: r.text.slice(0, 40),
        vector: none ? "-" : show(r.ranks.vector),
        keyword: none ? "-" : show(r.ranks.keyword),
        hybrid: none ? "-" : show(r.ranks.hybrid),
        "hybrid vs vector": none ? "-" : compare(r.ranks.vector, r.ranks.hybrid),
        keywordChunks: r.keywordCount,
        error: r.error ?? "",
      };
    }),
  );

  // ---- Totals ----
  console.log("\n=== Totals ===");
  const rows = [];
  for (const [name, list] of Object.entries(groups)) {
    for (const mode of MODES) {
      const s = summary[name][mode];
      rows.push({
        group: name,
        mode,
        "hit@5": `${s.hitAt5}/${s.questions}`,
        "hit@10": `${s.hitAt10}/${s.questions}`,
        MRR: s.mrr,
      });
    }
  }
  console.table(rows);

  // ---- Wins, losses, ties of hybrid against vector-only ----
  const verdicts = answerable.map((r) => compare(r.ranks.vector, r.ranks.hybrid));
  const count = (v) => verdicts.filter((x) => x === v).length;
  const winsLossesTies = { better: count("better"), worse: count("worse"), same: count("same") };
  console.log(
    `\nHybrid vs vector-only, by rank: better in ${winsLossesTies.better}, worse in ${winsLossesTies.worse}, same in ${winsLossesTies.same} of ${answerable.length} questions`,
  );
  for (const r of answerable) {
    const verdict = compare(r.ranks.vector, r.ranks.hybrid);
    if (verdict !== "same") {
      console.log(
        `  #${r.id} "${r.text}": vector ${show(r.ranks.vector)} -> hybrid ${show(r.ranks.hybrid)} (${verdict})`,
      );
    }
  }
  const keywordMisses = answerable.filter((r) => r.ranks.keyword === null).map((r) => `#${r.id}`);
  console.log(`Keyword-only found no correct page in the top ${CUTOFF} for: ${keywordMisses.join(", ") || "none"}`);

  // ---- The questions that are not in the PDF ----
  console.log("\n=== Not in the PDF (what each mode returns) ===");
  for (const r of results.filter((r) => r.type === "none" && !r.error)) {
    const pages = (mode) => r.top[mode].slice(0, 3).map((t) => `p${t.page}`).join(", ") || "nothing";
    console.log(
      `#${r.id} "${r.text}" | keyword chunks found: ${r.keywordCount} | top 3 vector: ${pages("vector")} | keyword: ${pages("keyword")} | hybrid: ${pages("hybrid")}`,
    );
  }

  // ---- Check against the saved baseline ----
  console.log("\n=== Consistency check against eval/results/vector-baseline.json ===");
  try {
    const baseline = JSON.parse(fs.readFileSync(path.join(here, "results", "vector-baseline.json"), "utf8"));
    const saved = baseline.summary.overall;
    const now = summary.overall.vector;
    const same = saved.hitAt5 === now.hitAt5 && saved.hitAt10 === now.hitAt10 && saved.mrr === now.mrr;
    console.log(
      same
        ? `OK: vector-only here matches the saved baseline (hit@5 ${now.hitAt5}/${now.questions}, MRR ${now.mrr})`
        : `DIFFERENT: saved hit@5 ${saved.hitAt5}, MRR ${saved.mrr} | now hit@5 ${now.hitAt5}, MRR ${now.mrr}. Do not trust the comparison until we find out why.`,
    );
  } catch (err) {
    console.log("Could not read the saved baseline:", err.message);
  }

  // ---- Problems that would make the numbers unreliable ----
  const failed = results.filter((r) => r.error);
  const keywordErrors = results.filter((r) => r.stats?.keywordError);
  if (failed.length) console.log(`\nWARNING: ${failed.length} question(s) failed and are NOT counted. Re-run before trusting the totals.`);
  if (keywordErrors.length) console.log(`WARNING: keyword search failed for ${keywordErrors.length} question(s); those hybrid results are vector-only.`);

  // ---- Timing (single run, notes only) ----
  const stats = results.map((r) => r.stats).filter(Boolean);
  console.log(
    `\nMedian timing over ${stats.length} questions, single run (NOT for the resume): embedMs=${median(stats.map((s) => s.embedMs))} vectorMs=${median(stats.map((s) => s.vectorMs))} keywordMs=${median(stats.map((s) => s.keywordMs))} totalMs=${median(stats.map((s) => s.totalMs))}`,
  );

  // ---- Save everything ----
  const outDir = path.join(here, "results");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "compare.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        chatId: CHAT_ID,
        embeddingModel: "gemini-embedding-001:768",
        settings: { K, CUTOFF, fetchPerSearch: 20, rrfK: 60 },
        summary,
        winsLossesTies,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`\nSaved: ${outFile}`);
};

main()
  .catch((err) => console.error("Compare failed:", err))
  .finally(() => mongoose.disconnect());