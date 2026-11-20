import mongoose from "mongoose";
import { runChat } from "../src/services/chat.graph.js";

const USER_ID = "6ae8b484e1c581be9729dcb9";
const CHAT_ID = "6afc5aa9f736249f562091b3";
const FILE_NAMES = ["SQL Notes by Apna College (1).pdf"];

const questions = [
  "How do I make lookups on a column faster?", // docs
  "What is the latest stable version of Node.js?", // web
  "Hi, how are you?", // direct
];

await mongoose.connect(process.env.MONGO_URI);
try {
  for (const q of questions) {
    console.log(`\n=== ${q}`);
    const start = Date.now();
    const { answer, citations } = await runChat(
      [{ role: "user", content: q }],
      {
        userId: USER_ID,
        chatId: CHAT_ID,
        hasDocuments: true,
        fileNames: FILE_NAMES,
        onProgress: (stage) => console.log(`  +${Date.now() - start}ms stage=${stage}`),
      },
    );
    console.log(
      `  +${Date.now() - start}ms DONE citations=${citations.length} answer: ${answer.slice(0, 80)}`,
    );
  }
} finally {
  await mongoose.disconnect();
}