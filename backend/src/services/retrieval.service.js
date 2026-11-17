import mongoose from "mongoose";
import { embedQuery } from "./embedding.service.js";
import { vectorSearch, dedupe, toChunk } from "./hybrid-retrieval.service.js";

const DEFAULT_LIMIT = 5;
// We fetch more than we need, because duplicate chunks (same file uploaded twice)
// would otherwise fill the result slots. Starting guess.
const FETCH_MULTIPLIER = 4; // ask for 20 when we want 5

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Vector-only search. The query itself lives in hybrid-retrieval.service.js.
// returns { chunks: [{ chunkId, file, pageNumber, chunkIndex, text, score }], stats }
export const retrieveChunks = async ({
  question,
  userId,
  chatId,
  limit = DEFAULT_LIMIT,
}) => {
  if (!isValidId(userId) || !isValidId(chatId)) {
    throw new Error("Invalid user or chat id");
  }
  if (typeof question !== "string" || !question.trim()) {
    return { chunks: [], stats: null };
  }

  // $vectorSearch filters do NOT auto-convert strings, so we convert ourselves
  const user = new mongoose.Types.ObjectId(userId);
  const chat = new mongoose.Types.ObjectId(chatId);

  // 1) Embed the question
  const embedStart = Date.now();
  let queryVector;
  try {
    queryVector = await embedQuery(question);
  } catch (err) {
    console.error("[retrieve] could not embed the question:", err);
    const failure = new Error(
      "Could not search your documents right now. Please try again in a few minutes.",
    );
    failure.userFacing = true;
    throw failure;
  }
  const embedMs = Date.now() - embedStart;

  // 2) Vector search, always limited to this user + this chat
  const searchStart = Date.now();
  const rows = await vectorSearch({
    queryVector,
    user,
    chat,
    fetchLimit: limit * FETCH_MULTIPLIER,
  });
  const searchMs = Date.now() - searchStart;

  // 3) Remove repeated text (best copy wins), keep the top `limit`
  const { unique, dropped } = dedupe(rows);
  const chunks = unique.slice(0, limit).map(toChunk);

  const stats = {
    questionChars: question.length,
    candidates: rows.length,
    uniqueCandidates: unique.length,
    duplicatesDropped: dropped,
    returned: chunks.length,
    embedMs,
    searchMs,
  };
  console.log(
    `[retrieve] chat=${chatId} questionChars=${stats.questionChars} candidates=${stats.candidates} unique=${stats.uniqueCandidates} duplicatesDropped=${stats.duplicatesDropped} returned=${stats.returned} embedMs=${stats.embedMs} searchMs=${stats.searchMs}`,
  );

  return { chunks, stats };
};