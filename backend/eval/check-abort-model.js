import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  bigModel,
  fallbacks,
  answerModel,
} from "../src/services/ai.service.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(
  `fallbacks configured: ${fallbacks.map((m) => m.model ?? m.modelName ?? "?").join(", ")}`,
);

// Prints every model that starts, ends or fails, with a time stamp.
// Handler argument names follow my memory of the LangChain callback API: if a
// name prints "?", the field was not found there.
const makeHandler = (now) => {
  const names = new Map(); // runId -> model name
  return {
    handleChatModelStart(serialized, messages, runId, parentRunId, extraParams, tags, metadata) {
      const name =
        metadata?.ls_model_name ??
        extraParams?.invocation_params?.model ??
        "?";
      names.set(runId, name);
      console.log(`    +${now()}ms [model start] ${name}`);
    },
    handleLLMEnd(output, runId) {
      console.log(`    +${now()}ms [model end]   ${names.get(runId) ?? "?"}`);
    },
    handleLLMError(err, runId) {
      console.log(
        `    +${now()}ms [model error] ${names.get(runId) ?? "?"}: ${err?.name} ${String(err?.message).slice(0, 60)}`,
      );
    },
  };
};

const runCase = async (label, model, prompt, { abortAfterMs = null, waitMs = 0 }) => {
  console.log(`\n=== ${label}`);
  const controller = new AbortController();
  const start = Date.now();
  const now = () => Date.now() - start;
  let abortAt = null;

  const timer =
    abortAfterMs === null
      ? null
      : setTimeout(() => {
          abortAt = now();
          console.log(`  +${abortAt}ms >>> abort() called`);
          controller.abort();
        }, abortAfterMs);

  let outcome;
  try {
    const res = await model.invoke(
      [new SystemMessage("You are a helpful assistant."), new HumanMessage(prompt)],
      { signal: controller.signal, callbacks: [makeHandler(now)] },
    );
    outcome = `ANSWERED chars=${(res.text ?? "").length}`;
  } catch (err) {
    outcome = `THREW ${err?.name}: ${String(err?.message).slice(0, 100)}`;
  }
  const endAt = now();
  if (timer) clearTimeout(timer);

  console.log(`  --- invoke ended at +${endAt}ms: ${outcome}`);
  if (abortAt !== null) console.log(`  ended ${endAt - abortAt}ms after the abort`);

  if (waitMs) {
    console.log(`  waiting ${waitMs / 1000} s for late events...`);
    await sleep(waitMs);
    console.log(`  (end of waiting)`);
  }
};

const LONG = "Write a detailed explanation of how database indexes work, about 600 words.";

await runCase("CASE 0 control: answerModel, no abort", answerModel, "Reply with the single word: ok", {});
await runCase("CASE 1: bigModel ALONE, abort at 300 ms", bigModel, LONG, { abortAfterMs: 300, waitMs: 3000 });
await runCase("CASE 2: answerModel (WITH fallbacks), abort at 300 ms", answerModel, LONG, { abortAfterMs: 300, waitMs: 15000 });