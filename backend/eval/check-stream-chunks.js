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
  // The first question of each expected route
  for (const route of ["docs", "web", "direct"]) {
    const q = routingQuestions.find((x) => x.route === route);
    console.log(`\n=== expected=${q.route} #${q.id}: ${q.text}`);

    const start = Date.now();
    const stream = await chatGraph.stream(
      {
        question: q.text,
        messages: [{ role: "user", content: q.text }],
        userId: USER_ID,
        chatId: CHAT_ID,
        hasDocuments: true,
        fileNames: FILE_NAMES,
      },
      { streamMode: "updates" },
    );

    for await (const chunk of stream) {
      console.log(
        `  +${Date.now() - start}ms isArray=${Array.isArray(chunk)} keys=${JSON.stringify(Object.keys(chunk))}`,
      );
      for (const [node, update] of Object.entries(chunk)) {
        console.log(`     ${node}: fields=${Object.keys(update ?? {}).join(",")}`);
        console.log(`     ${short(update)}`);
      }
    }
  }
} finally {
  await mongoose.disconnect();
}