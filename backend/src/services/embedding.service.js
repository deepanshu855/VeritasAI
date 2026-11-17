import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import chunkModel from "../models/chunk.model.js";

const MODEL = "gemini-embedding-001";
const DIMENSIONS = 768;
// Stored on every chunk, so a vector from another model or size is never reused
export const EMBEDDING_MODEL = `${MODEL}:${DIMENSIONS}`;

const BATCH_SIZE = 50; // texts per Google call (a cautious guess, tune later)
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000; // waits 2s, 4s, 8s between retries

let client = null;
const getClient = () => {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The "fingerprint" of a text: same text always gives the same hash
export const hashText = (text) =>
  crypto.createHash("sha256").update(text).digest("hex");

// gemini-embedding-001 needs manual normalizing when the size is not 3072
const normalize = (vector) => {
  const length = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
  return length === 0 ? vector : vector.map((x) => x / length);
};

// Rate limits and short outages are worth retrying; other errors are not.
// (The exact error shape of the SDK is not verified, so we check a few signals.)
const isRetryable = (err) => {
  const status = err?.status ?? err?.code;
  if (status === 429 || status === 500 || status === 503) return true;
  return /RESOURCE_EXHAUSTED|UNAVAILABLE|429/i.test(String(err?.message));
};

// Sends one batch to Google and returns one normalized vector per text
const embedBatch = async (texts, taskType = "RETRIEVAL_DOCUMENT") => {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await getClient().models.embedContent({
        model: MODEL,
        contents: texts,
        config: {
          taskType,
          outputDimensionality: DIMENSIONS,
        },
      });

      const vectors = (response.embeddings || []).map((e) => e.values);
      if (
        vectors.length !== texts.length ||
        vectors.some((v) => !Array.isArray(v) || v.length !== DIMENSIONS)
      ) {
        throw new Error("Unexpected embedding response shape");
      }
      return vectors.map(normalize);
    } catch (err) {
      if (attempt >= MAX_RETRIES || !isRetryable(err)) throw err;
      await sleep(RETRY_BASE_MS * 2 ** attempt);
    }
  }
};

// chunks: [{ pageNumber, chunkIndex, text }]
// returns the same chunks plus contentHash, embeddingModel and embedding,
// and some stats for the log
export const embedChunks = async ({ chunks, userId, label = "" }) => {
  const started = Date.now();
  if (chunks.length === 0) return { chunks: [], stats: null };

  const hashed = chunks.map((chunk) => ({
    ...chunk,
    contentHash: hashText(chunk.text),
  }));

  // One text per fingerprint (a file can repeat the same text)
  const textByHash = new Map();
  for (const chunk of hashed) textByHash.set(chunk.contentHash, chunk.text);

  // 1) Look in the "notebook": this user's chunks that already have a vector
  const cachedRows = await chunkModel
    .find({
      user: userId,
      contentHash: { $in: [...textByHash.keys()] },
      embeddingModel: EMBEDDING_MODEL,
      embedding: { $exists: true },
    })
    .select("contentHash +embedding")
    .lean();

  const lookupMs = Date.now() - started;

  const vectorByHash = new Map();
  for (const row of cachedRows) {
    if (row.embedding?.length === DIMENSIONS) {
      vectorByHash.set(row.contentHash, row.embedding);
    }
  }
  const cacheHits = hashed.filter((c) =>
    vectorByHash.has(c.contentHash),
  ).length;

  // 2) Ask Google only for the texts we don't have yet
  const missingHashes = [...textByHash.keys()].filter(
    (hash) => !vectorByHash.has(hash),
  );
  let apiCalls = 0;

  try {
    for (let i = 0; i < missingHashes.length; i += BATCH_SIZE) {
      const batchHashes = missingHashes.slice(i, i + BATCH_SIZE);
      const vectors = await embedBatch(
        batchHashes.map((h) => textByHash.get(h)),
      );
      apiCalls++;
      batchHashes.forEach((hash, idx) => vectorByHash.set(hash, vectors[idx]));
    }
  } catch (err) {
    console.error(`[embed] file=${label} failed:`, err);
    const failure = new Error(
      "Could not index this file right now. Please try again in a few minutes.",
    );
    failure.userFacing = true;
    throw failure;
  }

  const stats = {
    chunks: chunks.length,
    cacheHits,
    sentToGoogle: missingHashes.length,
    apiCalls,
    lookupMs,
    embedMs: Date.now() - started,
  };

  console.log(
    `[embed] file=${label} chunks=${stats.chunks} cacheHits=${stats.cacheHits} sentToGoogle=${stats.sentToGoogle} apiCalls=${stats.apiCalls} lookupMs=${stats.lookupMs} embedMs=${stats.embedMs}`,
  );

  return {
    chunks: hashed.map((chunk) => ({
      ...chunk,
      embeddingModel: EMBEDDING_MODEL,
      embedding: vectorByHash.get(chunk.contentHash),
    })),
    stats,
  };
};

// Turns one user question into one normalized vector, ready for $vectorSearch
export const embedQuery = async (question) => {
  const text = typeof question === "string" ? question.trim() : "";
  if (!text) throw new Error("Question is empty");

  const [vector] = await embedBatch([text], "RETRIEVAL_QUERY");
  return vector;
};
