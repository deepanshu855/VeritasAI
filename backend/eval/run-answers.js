import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { answerQuestion } from "../src/services/rag-answer.service.js";
import { questions } from "./questions.js";

// Same clean test chat as the retrieval evaluation (SQL PDF uploaded once)
const USER_ID = "6ae8b484e1c581be9729dcb9";
const CHAT_ID = "6af9b6d398c23e1f7d52ec98";

// Groq free plan: 8,000 tokens per minute for this model. Measured calls were about
// 1.3-2.2K tokens each, so 3 calls per minute is about 6.6K at most. If you get 429
// errors, raise this back to 30_000.
const PAUSE_MS = 20_000;
const RETRY_WAIT_MS = 65_000;

const here = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const median = (nums) => {
  const clean = nums.filter((n) => typeof n === "number");
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

// Optional: node --env-file=.env eval/run-answers.js 13 14   (only these question ids)
const onlyIds = process.argv
  .slice(2)
  .map(Number)
  .filter((n) => Number.isInteger(n) && n > 0);

const runOne = async (q) => {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const out = await answerQuestion({
        question: q.text,
        userId: USER_ID,
        chatId: CHAT_ID,
      });
      const pagesSent = out.sources.map((s) => s.pageNumber);
      const pagesCited = out.citations.map((c) => c.pageNumber);
      return {
        ...q,
        answer: out.answer,
        citations: out.citations,
        sources: out.sources,
        stats: out.stats,
        // Was an accepted page among the 5 chunks the model SAW?
        retrievedRightPage: q.pages.some((p) => pagesSent.includes(p)),
        // Did the answer CITE an accepted page?
        citedRightPage: q.pages.some((p) => pagesCited.includes(p)),
        retried: attempt === 2,
        error: null,
      };
    } catch (err) {
      if (attempt === 1) {
        console.log(
          `#${q.id} failed (${err.message}). Waiting ${RETRY_WAIT_MS / 1000}s, then trying once more...`,
        );
        await sleep(RETRY_WAIT_MS);
        continue;
      }
      return {
        ...q,
        answer: null,
        citations: [],
        sources: [],
        stats: null,
        retrievedRightPage: false,
        citedRightPage: false,
        retried: true,
        error: err.message,
      };
    }
  }
};

const count = (list, test) => list.filter(test).length;

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const selected = onlyIds.length
    ? questions.filter((q) => onlyIds.includes(q.id))
    : questions;
  if (selected.length === 0) {
    console.log("No question matches those ids.");
    return;
  }
  console.log(
    `Running ${selected.length} question(s), pause ${PAUSE_MS / 1000}s between them (about ${Math.round((selected.length * (PAUSE_MS / 1000 + 3)) / 60)} min)...`,
  );

  const results = [];
  for (let i = 0; i < selected.length; i++) {
    const r = await runOne(selected[i]);
    results.push(r);

    // Print each answer as soon as it is ready, so you can read it
    console.log(`\n#${r.id} [${r.type}] ${r.text}`);
    console.log(
      `  accepted pages: ${r.pages.join(", ") || "none (not in the PDF)"}`,
    );
    if (r.error) {
      console.log(`  ERROR: ${r.error}`);
    } else {
      const cites = r.citations
        .map((c) => `[${c.number}] p${c.pageNumber}`)
        .join(", ");
      console.log(`  cited: ${cites || "nothing"}`);
      console.log(`  answer: ${r.answer}`);
    }

    if (i < selected.length - 1) await sleep(PAUSE_MS);
  }

  const ok = results.filter((r) => !r.error);
  const answerable = ok.filter((r) => r.type !== "none");
  const none = ok.filter((r) => r.type === "none");

  const summary = {
    answerable: {
      questions: answerable.length,
      citedRightPage: count(answerable, (r) => r.citedRightPage),
      retrievedRightPage: count(answerable, (r) => r.retrievedRightPage),
      refusedWrongly: count(answerable, (r) => r.stats.notInDocument),
      uncited: count(answerable, (r) => r.stats.uncited),
    },
    notInPdf: {
      questions: none.length,
      correctRefusal: count(none, (r) => r.stats.notInDocument),
      citedAnything: count(none, (r) => r.citations.length > 0),
    },
    invalidCitationsTotal: ok.reduce(
      (sum, r) => sum + (r.stats.invalidCitations ?? 0),
      0,
    ),
    reformattedCitationsTotal: ok.reduce(
      (sum, r) => sum + (r.stats.reformattedCitations ?? 0),
      0,
    ),
    medianAnswerMs: median(
      ok.map((r) => r.stats.answerMs).filter((ms) => ms > 0),
    ),
  };

  console.log("\n=== Per question ===");
  console.table(
    results.map((r) => ({
      id: r.id,
      type: r.type,
      accepted: r.pages.join(",") || "-",
      citedPages: r.citations.map((c) => c.pageNumber).join(",") || "-",
      "cited right page": r.type === "none" ? "-" : r.citedRightPage,
      "exact refusal": r.stats ? r.stats.notInDocument : "-",
      uncited: r.stats ? r.stats.uncited : "-",
      invalid: r.stats ? r.stats.invalidCitations : "-",
      retried: r.retried,
      error: r.error ?? "",
    })),
  );

  const a = summary.answerable;
  const n = summary.notInPdf;
  console.log("\n=== Totals ===");
  console.log(
    `Answerable: cited an accepted page in ${a.citedRightPage}/${a.questions}`,
  );
  console.log(
    `  (an accepted page was among the 5 chunks the model saw in ${a.retrievedRightPage}/${a.questions})`,
  );
  console.log(
    `  refused although answerable: ${a.refusedWrongly} | answered without any citation: ${a.uncited}`,
  );
  console.log(
    `Not in the PDF: exact refusal in ${n.correctRefusal}/${n.questions} | cited something anyway: ${n.citedAnything}`,
  );
  console.log(
    `Invalid citation numbers removed by our code (total): ${summary.invalidCitationsTotal}`,
  );
  console.log(
    `Citations not in plain [n] style, rewritten by our code (total): ${summary.reformattedCitationsTotal}`,
  );
  console.log(
    `Median answer time (model call only), single run, NOT for the resume: ${summary.medianAnswerMs} ms`,
  );

  const failed = results.filter((r) => r.error);
  if (failed.length) {
    console.log(
      `\nWARNING: ${failed.length} question(s) failed and are NOT counted. Re-run them before trusting the totals: node --env-file=.env eval/run-answers.js ${failed.map((r) => r.id).join(" ")}`,
    );
  }
  console.log(
    "\nREMEMBER: 'cited right page' does not prove the claim is true. Read each answer next to its cited page in the PDF.",
  );

  const outDir = path.join(here, "results");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(
    outDir,
    onlyIds.length ? "answers-partial.json" : "answers.json",
  );
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        chatId: CHAT_ID,
        conditions: {
          answerModel: "openai/gpt-oss-120b (Groq)",
          temperature: 0,
          maxTokens: 1024,
          retrieval: "hybrid, top 5 chunks",
          embeddingModel: "gemini-embedding-001:768",
          pauseMs: PAUSE_MS,
        },
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
  .catch((err) => console.error("Answer test failed:", err))
  .finally(() => mongoose.disconnect());
