import mongoose from "mongoose";
import { routingQuestions } from "./questions.js";
import { chatGraph } from "../src/services/chat.graph.js";

const USER_ID = "6ae8b484e1c581be9729dcb9";
const CHAT_ID = "6afc5aa9f736249f562091b3";
const FILE_NAMES = ["SQL Notes by Apna College (1).pdf"];
const IDS = [2, 5, 8, 12, 14, 18];

await mongoose.connect(process.env.MONGO_URI);
try {
  for (const id of IDS) {
    const q = routingQuestions.find((x) => x.id === id);
    const out = await chatGraph.invoke({
      question: q.text,
      messages: [{ role: "user", content: q.text }],
      userId: USER_ID,
      chatId: CHAT_ID,
      hasDocuments: true,
      fileNames: FILE_NAMES,
    });
    console.log(`\n=== #${id} expected=${q.route} got=${out.route}: ${q.text}`);
    console.log("ANSWER:", out.answer);
    console.log("CITATIONS:", JSON.stringify(out.citations));
    console.log(
      `ms: router=${out.routerMs} retrieve=${out.retrieveMs ?? "-"} search=${out.searchMs ?? "-"} generate=${out.generateMs}`,
    );
  }
} finally {
  await mongoose.disconnect();
}