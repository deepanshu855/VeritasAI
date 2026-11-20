import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { fallbacks } from "../src/services/ai.service.js";

const modelName = (m) => m.model ?? m.modelName ?? "unknown";
const ask = "Reply with the single word: ok";

console.log(`fallbacks configured: ${fallbacks.length}`);

// Part 1: does each fallback work on its own?
for (const m of fallbacks) {
  const start = Date.now();
  try {
    const res = await m.invoke(ask);
    console.log(
      `OK    ${modelName(m)} ${Date.now() - start} ms -> ${JSON.stringify((res.text || "").slice(0, 80))}`,
    );
  } catch (err) {
    console.log(
      `FAIL  ${modelName(m)} ${Date.now() - start} ms -> ${String(err.message).slice(0, 150)}`,
    );
  }
}

// Part 2: a broken primary must fall through to the list
const broken = new ChatGroq({
  model: "this-model-does-not-exist",
  apiKey: process.env.GROQ_API_KEY,
  maxRetries: 0,
});
const chain = broken.withFallbacks(fallbacks);
const start = Date.now();
try {
  const res = await chain.invoke(ask);
  console.log(
    `CHAIN worked ${Date.now() - start} ms -> ${JSON.stringify((res.text || "").slice(0, 80))}`,
  );
} catch (err) {
  console.log(
    `CHAIN failed ${Date.now() - start} ms -> ${String(err.message).slice(0, 150)}`,
  );
}
process.exit(0);