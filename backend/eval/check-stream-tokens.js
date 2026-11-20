import mongoose from "mongoose";
import { routingQuestions } from "./questions.js";
import { chatGraph } from "../src/services/chat.graph.js";

const USER_ID = "6ae8b484e1c581be9729dcb9";
const CHAT_ID = "6afc5aa9f736249f562091b3";
const FILE_NAMES = ["SQL Notes by Apna College (1).pdf"];

// Cuts long values so the output stays readable
const short = (v) => {
  const s = JSON.stringify(v) ?? "undefined";
  return s.length > 120 ? `${s.slice(0, 120)}... (${s.length} chars)` : s;
};

await mongoose.connect(process.env.MONGO_URI);
try {
  for (const route of ["docs", "web", "direct"]) {
    const q = routingQuestions.find((x) => x.route === route);
    console.log(`\n=== expected=${q.route} #${q.id}: ${q.text}`);

    const start = Date.now();
    // CHANGED: two modes at once -> items arrive as [mode, data]
    const stream = await chatGraph.stream(
      {
        question: q.text,
        messages: [{ role: "user", content: q.text }],
        userId: USER_ID,
        chatId: CHAT_ID,
        hasDocuments: true,
        fileNames: FILE_NAMES,
      },
      { streamMode: ["updates", "messages"] },
    );

    const result = {}; // merged box updates, like runChat does
    const modesSeen = {}; // how many items per mode
    const byNode = {}; // token statistics per graph box
    const extraKeys = new Set(); // additional_kwargs keys seen on token chunks
    let lastUpdateAt = 0;
    let shapesPrinted = 0;

    for await (const item of stream) {
      const now = Date.now() - start;

      if (!Array.isArray(item) || item.length !== 2) {
        console.log(`  +${now}ms UNEXPECTED item shape: ${short(item)}`);
        continue;
      }
      const [mode, data] = item;
      modesSeen[mode] = (modesSeen[mode] ?? 0) + 1;

      if (mode === "updates") {
        lastUpdateAt = now;
        for (const [node, update] of Object.entries(data)) {
          Object.assign(result, update);
          console.log(
            `  +${now}ms updates: ${node} fields=${Object.keys(update ?? {}).join(",")}`,
          );
        }
      } else if (mode === "messages") {
        if (!Array.isArray(data)) {
          console.log(`  +${now}ms UNEXPECTED messages data: ${short(data)}`);
          continue;
        }
        const [msgChunk, metadata] = data;
        const node = metadata?.langgraph_node ?? "(none)";

        // print the exact shape for the first 2 token items only
        if (shapesPrinted < 2) {
          shapesPrinted++;
          console.log(
            `  +${now}ms SHAPE class=${msgChunk?.constructor?.name} contentIsArray=${Array.isArray(msgChunk?.content)} textType=${typeof msgChunk?.text} node=${node} metadataKeys=${Object.keys(metadata ?? {}).join(",")}`,
          );
        }

        const stats = (byNode[node] ??= {
          chunks: 0,
          withText: 0,
          text: "",
          firstAt: null,
          lastAt: null,
          gapFromBox: null,
        });
        const text = typeof msgChunk?.text === "string" ? msgChunk.text : "";
        stats.chunks++;
        if (text) {
          stats.withText++;
          stats.text += text;
          if (stats.firstAt === null) {
            stats.firstAt = now;
            stats.gapFromBox = now - lastUpdateAt; // since the previous box finished
          }
          stats.lastAt = now;
        }
        for (const k of Object.keys(msgChunk?.additional_kwargs ?? {})) {
          extraKeys.add(k);
        }
      }
    }

    const total = Date.now() - start;
    console.log(`  --- finished at +${total}ms, items per mode: ${JSON.stringify(modesSeen)}`);
    for (const [node, s] of Object.entries(byNode)) {
      console.log(
        `  tokens from "${node}": chunks=${s.chunks} withText=${s.withText} chars=${s.text.length} firstAt=${s.firstAt}ms lastAt=${s.lastAt}ms gapFromPreviousBox=${s.gapFromBox}ms`,
      );
    }
    console.log(`  additional_kwargs keys on token chunks: ${[...extraKeys].join(",") || "(none)"}`);

    const streamed = (byNode.generate?.text ?? "").trim();
    const final = (result.answer ?? "").trim();
    console.log(`  route=${result.route} usedFallback=${result.usedFallback}`);
    console.log(`  streamed text equals final answer: ${streamed === final}`);
    if (streamed !== final) {
      console.log(`  streamed: ${short(streamed)}`);
      console.log(`  final:    ${short(final)}`);
    }
  }
} finally {
  await mongoose.disconnect();
}