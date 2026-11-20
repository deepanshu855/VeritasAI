import mongoose from "mongoose";
import { routingQuestions } from "./questions.js";
import { runChat } from "../src/services/chat.graph.js";

const USER_ID = "6ae8b484e1c581be9729dcb9";
const CHAT_ID = "6afc5aa9f736249f562091b3";
const FILE_NAMES = ["SQL Notes by Apna College (1).pdf"];

await mongoose.connect(process.env.MONGO_URI);
try {
  for (const route of ["docs", "web", "direct"]) {
    const q = routingQuestions.find((x) => x.route === route);
    console.log(`\n=== expected=${q.route} #${q.id}: ${q.text}`);

    const start = Date.now();
    const stages = [];
    let text = "";
    let pieces = 0;
    let firstAt = null;

    const { answer, citations } = await runChat(
      [{ role: "user", content: q.text }],
      {
        userId: USER_ID,
        chatId: CHAT_ID,
        hasDocuments: true,
        fileNames: FILE_NAMES,
        onProgress: (stage) => stages.push(`${stage}@${Date.now() - start}`),
        onToken: (t) => {
          pieces++;
          text += t;
          if (firstAt === null) firstAt = Date.now() - start;
        },
      },
    );

    console.log(`  stages: ${stages.join(" > ")}`);
    console.log(`  pieces=${pieces} firstTokenAt=${firstAt}ms total=${Date.now() - start}ms citations=${citations.length}`);
    console.log(`  streamed (trimmed) equals returned answer: ${text.trim() === answer.trim()}`);
  }
} finally {
  await mongoose.disconnect();
}