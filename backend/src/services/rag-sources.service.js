import fileModel from "../models/file.model.js";
import { retrieveHybrid } from "./hybrid-retrieval.service.js";

// Matches [1], [1, 2], 【3】 and 【1†L1-L4】 (the style the model used in the first test run).
// Only brackets that START with a number are treated as citations.
const CITATION_PATTERN =
  /[\[【]\s*(\d+(?:\s*[,;]\s*\d+)*)(?:\s*†[^\]】]*)?\s*[\]】]/g;

// file id -> original file name (only this user's files in this chat)
const getFileNames = async ({ fileIds, userId, chatId }) => {
  const files = await fileModel
    .find({ _id: { $in: fileIds }, user: userId, chat: chatId })
    .select("originalName");
  return new Map(files.map((f) => [String(f._id), f.originalName]));
};

// Finds the top chunks for a question and numbers them 1..N.
// Returns { sources: [{ number, fileName, pageNumber, text }], retrieval }
// (retrieval = the stats of the search; sources is empty when nothing was found)
export const buildSources = async ({ question, userId, chatId, limit }) => {
  const { chunks, stats: retrieval } = await retrieveHybrid({
    question,
    userId,
    chatId,
    limit,
  });

  if (chunks.length === 0) return { sources: [], retrieval };

  const fileIds = [...new Set(chunks.map((c) => String(c.file)))];
  const names = await getFileNames({ fileIds, userId, chatId });

  const sources = chunks.map((chunk, index) => ({
    number: index + 1,
    fileName: names.get(String(chunk.file)) ?? "Unknown file",
    pageNumber: chunk.pageNumber,
    text: chunk.text,
  }));

  return { sources, retrieval };
};

// Keeps citations that point at a real source (1..sourceCount), removes the others,
// and rewrites every valid one as plain [n].
export const checkCitations = (answer, sourceCount) => {
  const used = new Set();
  let invalid = 0;
  let reformatted = 0;

  const cleaned = answer.replace(CITATION_PATTERN, (match, list) => {
    const valid = [];
    for (const part of list.split(/[,;]/)) {
      const n = Number(part.trim());
      if (n >= 1 && n <= sourceCount) {
        valid.push(n);
        used.add(n);
      } else {
        invalid += 1;
      }
    }
    if (!/^\[\d+\]$/.test(match)) reformatted += 1; // not plain [n]
    return valid.map((n) => `[${n}]`).join("");
  });

  return {
    cleaned: cleaned.trim(),
    used: [...used].sort((a, b) => a - b),
    invalid,
    reformatted,
  };
};