import mongoose from "mongoose";
import chunkModel from "../models/chunk.model.js";
import { embedQuery } from "./embedding.service.js";

const VECTOR_INDEX = "chunk_vector_index";
const TEXT_INDEX = "chunk_text_index";

const DEFAULT_LIMIT = 5; // chunks returned by retrieveHybrid
const FETCH_LIMIT = 20; // chunks fetched from EACH search before merging
const CANDIDATE_MULTIPLIER = 10; // vector search looks at 10x what it returns
const RRF_K = 60; // the usual default for Reciprocal Rank Fusion (a guess, not tuned)

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Same text = same fingerprint (contentHash). Used to drop repeated chunks.
const keyOf = (row) => row.contentHash ?? row.text;

const timed = async (fn) => {
  const started = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - started };
};

// What we hand back for one chunk (no vector, only what is needed)
export const toChunk = (row) => ({
  chunkId: row._id,
  file: row.file,
  pageNumber: row.pageNumber,
  chunkIndex: row.chunkIndex,
  text: row.text,
  score: row.score,
});

// ---- Search 1: by meaning (same query as retrieval.service.js) ----
export const vectorSearch = ({ queryVector, user, chat, fetchLimit }) =>
  chunkModel.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX,
        path: "embedding",
        queryVector,
        numCandidates: fetchLimit * CANDIDATE_MULTIPLIER,
        limit: fetchLimit,
        filter: {
          $and: [{ user: { $eq: user } }, { chat: { $eq: chat } }],
        },
      },
    },
    {
      $project: {
        file: 1,
        pageNumber: 1,
        chunkIndex: 1,
        text: 1,
        contentHash: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

// ---- Search 2: by words ----
// "must" = the chunk has to contain at least one of the question's words.
// "filter" = limit to this user + chat, without changing the scores.
const keywordSearch = ({ question, user, chat, fetchLimit }) =>
  chunkModel.aggregate([
    {
      $search: {
        index: TEXT_INDEX,
        compound: {
          must: [{ text: { query: question, path: "text" } }],
          filter: [
            { equals: { path: "user", value: user } },
            { equals: { path: "chat", value: chat } },
          ],
        },
      },
    },
    { $limit: fetchLimit },
    {
      $project: {
        file: 1,
        pageNumber: 1,
        chunkIndex: 1,
        text: 1,
        contentHash: 1,
        score: { $meta: "searchScore" },
      },
    },
  ]);

// Drops repeated text; the first (best) copy wins
export const dedupe = (rows) => {
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    const key = keyOf(row);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return { unique, dropped: rows.length - unique.length };
};

// Reciprocal Rank Fusion: every list gives a chunk 1 / (60 + position) points.
// A chunk liked by both searches collects points twice.
const fuse = (vectorRows, keywordRows) => {
  const merged = new Map();

  const addList = (rows, rankField) => {
    rows.forEach((row, index) => {
      const key = keyOf(row);
      const entry = merged.get(key) ?? {
        row,
        vectorRank: null,
        keywordRank: null,
        rrf: 0,
      };
      entry[rankField] = index + 1;
      entry.rrf += 1 / (RRF_K + index + 1);
      merged.set(key, entry);
    });
  };
  addList(vectorRows, "vectorRank");
  addList(keywordRows, "keywordRank");

  return [...merged.values()]
    .sort(
      (a, b) =>
        b.rrf - a.rrf ||
        (a.vectorRank ?? 1e9) - (b.vectorRank ?? 1e9), // tie: the better vector rank first
    )
    .map((entry) => ({
      ...toChunk(entry.row),
      score: entry.rrf,
      vectorRank: entry.vectorRank,
      keywordRank: entry.keywordRank,
    }));
};

// Returns all three lists (used by the evaluation script).
// { vector: [...], keyword: [...], hybrid: [...], stats }
export const retrieveAll = async ({
  question,
  userId,
  chatId,
  fetchLimit = FETCH_LIMIT,
}) => {
  if (!isValidId(userId) || !isValidId(chatId)) {
    throw new Error("Invalid user or chat id");
  }
  if (typeof question !== "string" || !question.trim()) {
    return { vector: [], keyword: [], hybrid: [], stats: null };
  }

  const user = new mongoose.Types.ObjectId(userId);
  const chat = new mongoose.Types.ObjectId(chatId);
  const started = Date.now();

  // Keyword search does not need the vector, so it starts right away.
  // If it fails, we carry on with vector results only and report the error in stats.
  let keywordError = null;
  const keywordPromise = timed(() =>
    keywordSearch({ question, user, chat, fetchLimit }),
  ).catch((err) => {
    keywordError = err.message;
    console.error("[hybrid] keyword search failed, using vector only:", err);
    return { result: [], ms: null };
  });

  // 1) Embed the question (once)
  const embedStart = Date.now();
  let queryVector;
  try {
    queryVector = await embedQuery(question);
  } catch (err) {
    console.error("[hybrid] could not embed the question:", err);
    const failure = new Error(
      "Could not search your documents right now. Please try again in a few minutes.",
    );
    failure.userFacing = true;
    throw failure;
  }
  const embedMs = Date.now() - embedStart;

  // 2) Vector search, then wait for the keyword search that was already running
  const vectorRun = await timed(() =>
    vectorSearch({ queryVector, user, chat, fetchLimit }),
  );
  const keywordRun = await keywordPromise;

  // 3) Clean up and merge
  const vectorList = dedupe(vectorRun.result);
  const keywordList = dedupe(keywordRun.result);
  const hybrid = fuse(vectorList.unique, keywordList.unique);

  const stats = {
    questionChars: question.length,
    vectorCount: vectorList.unique.length,
    keywordCount: keywordList.unique.length,
    hybridCount: hybrid.length,
    vectorDuplicatesDropped: vectorList.dropped,
    keywordDuplicatesDropped: keywordList.dropped,
    embedMs,
    vectorMs: vectorRun.ms,
    keywordMs: keywordRun.ms,
    totalMs: Date.now() - started,
    keywordError,
  };
  console.log(
    `[hybrid] chat=${chatId} questionChars=${stats.questionChars} vector=${stats.vectorCount} keyword=${stats.keywordCount} hybrid=${stats.hybridCount} embedMs=${stats.embedMs} vectorMs=${stats.vectorMs} keywordMs=${stats.keywordMs} totalMs=${stats.totalMs}`,
  );

  return {
    vector: vectorList.unique.map(toChunk),
    keyword: keywordList.unique.map(toChunk),
    hybrid,
    stats,
  };
};

// The version the app will use later: only the merged top chunks
export const retrieveHybrid = async ({
  question,
  userId,
  chatId,
  limit = DEFAULT_LIMIT,
}) => {
  const { hybrid, stats } = await retrieveAll({ question, userId, chatId });
  return { chunks: hybrid.slice(0, limit), stats };
};