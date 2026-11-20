import mongoose from "mongoose";
import { routingQuestions } from "./questions.js";
import { chatGraph } from "../src/services/chat.graph.js";

const USER_ID = "6ae8b484e1c581be9729dcb9";
const CHAT_ID = "6afc5aa9f736249f562091b3";
const FILE_NAMES = ["SQL Notes by Apna College (1).pdf"];

const q = routingQuestions.find((x) => x.route === "web");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// plan: { afterMs } = abort after a fixed time
//       { afterNode, delayMs } = abort some ms after that box has finished
const runCase = async (label, plan) => {
  console.log(`\n=== ${label}`);
  const controller = new AbortController();
  const start = Date.now();
  const now = () => Date.now() - start;
  const timers = [];
  let abortAt = null;

  const doAbort = () => {
    if (abortAt !== null) return;
    abortAt = now();
    console.log(`  +${abortAt}ms >>> abort() called`);
    controller.abort();
  };

  if (plan.afterMs !== undefined) timers.push(setTimeout(doAbort, plan.afterMs));

  let tokensBefore = 0;
  let tokensAfter = 0;
  let endedHow = "finished normally";

  try {
    const stream = await chatGraph.stream(
      {
        question: q.text,
        messages: [{ role: "user", content: q.text }],
        userId: USER_ID,
        chatId: CHAT_ID,
        hasDocuments: true,
        fileNames: FILE_NAMES,
      },
      { streamMode: ["updates", "messages"], signal: controller.signal },
    );

    for await (const [mode, data] of stream) {
      if (mode === "updates") {
        for (const node of Object.keys(data)) {
          console.log(`  +${now()}ms updates: ${node}`);
          if (plan.afterNode === node) {
            timers.push(setTimeout(doAbort, plan.delayMs ?? 0));
          }
        }
      } else if (mode === "messages") {
        const [chunk, metadata] = data;
        if (metadata?.langgraph_node === "generate" && chunk?.text) {
          if (abortAt === null) tokensBefore++;
          else tokensAfter++;
        }
      }
    }
  } catch (err) {
    endedHow = `THREW ${err?.name}: ${String(err?.message).slice(0, 100)}`;
  }

  const endAt = now();
  timers.forEach(clearTimeout);

  console.log(`  --- stream ended at +${endAt}ms: ${endedHow}`);
  console.log(
    abortAt === null
      ? `  abort was never called (the run ended first)`
      : `  abort at +${abortAt}ms, stream ended ${endAt - abortAt}ms later`,
  );
  console.log(`  visible token pieces: before abort=${tokensBefore} after abort=${tokensAfter}`);

  console.log(`  waiting 4 s for late log lines (work that did not stop)...`);
  await sleep(4000);
  console.log(`  (end of waiting)`);
};

await mongoose.connect(process.env.MONGO_URI);
try {
  await runCase("CASE 1: abort at 150 ms (router running)", { afterMs: 150 });
  await runCase("CASE 2: abort right after the router (search running)", {
    afterNode: "router",
    delayMs: 0,
  });
  await runCase("CASE 3: abort 300 ms after the search (model thinking)", {
    afterNode: "searchWeb",
    delayMs: 300,
  });
} finally {
  await mongoose.disconnect();
}