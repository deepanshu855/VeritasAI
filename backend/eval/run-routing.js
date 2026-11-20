import { writeFile, mkdir } from "node:fs/promises";
import { routingQuestions, hasDocuments } from "./questions.js";
import { routerGraph } from "../src/services/router.graph.js";

const FILE_NAMES = ["SQL Notes by Apna College (1).pdf"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
for (const q of routingQuestions) {
  try {
    const out = await routerGraph.invoke({
      question: q.text,
      hasDocuments,
      fileNames: hasDocuments ? FILE_NAMES : [],
    });
    rows.push({
      id: q.id,
      expected: q.route,
      got: out.route,
      ok: out.route === q.route,
      ambiguous: Boolean(q.ambiguous),
      raw: out.rawRoute,
      routerMs: out.routerMs,
      text: q.text,
    });
  } catch (err) {
    console.error(`Question ${q.id} failed:`, err.message);
    rows.push({ id: q.id, expected: q.route, got: "error", ok: false, ambiguous: Boolean(q.ambiguous), raw: "", routerMs: 0, text: q.text });
  }
  await sleep(1000); // be gentle with the Groq rate limit
}

console.table(rows.map(({ id, expected, got, ok, ambiguous, routerMs }) => ({ id, expected, got, ok, ambiguous, routerMs })));

const counted = rows.filter((r) => !r.ambiguous);
const errors = rows.filter((r) => r.got === "error").length;
console.log(`\nCounted questions: ${counted.length}, correct: ${counted.filter((r) => r.ok).length}, errors (any question): ${errors}`);
for (const route of ["docs", "web", "direct"]) {
  const group = counted.filter((r) => r.expected === route);
  console.log(`  ${route}: ${group.filter((r) => r.ok).length}/${group.length}`);
}
console.log("Ambiguous (reported separately):");
for (const r of rows.filter((r) => r.ambiguous)) {
  console.log(`  #${r.id} expected ${r.expected}, got ${r.got}: ${r.text}`);
}
const times = rows.filter((r) => r.routerMs > 0).map((r) => r.routerMs).sort((a, b) => a - b);
if (times.length) console.log(`Router time: median ${times[Math.floor(times.length / 2)]} ms, max ${times[times.length - 1]} ms`);

await mkdir("eval/results", { recursive: true });
await writeFile("eval/results/routing-router-only.json", JSON.stringify(rows, null, 2));
console.log("Saved eval/results/routing-router-only.json");