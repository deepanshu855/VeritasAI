import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// ~400 tokens and ~50 tokens, using the rough rule of 4 characters per token
const CHUNK_SIZE = 1600;
const CHUNK_OVERLAP = 200;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
});

// pages: [{ pageNumber, text, ... }] from the parser
// returns: [{ pageNumber, chunkIndex, text }]
export const chunkPages = async (pages) => {
  const chunks = [];
  let chunkIndex = 0; // running number across the whole file

  for (const page of pages) {
    const pageText = (page.text || "").trim();
    if (!pageText) continue; // blank page, nothing to chunk

    // await is safe even if splitText turns out to be synchronous
    const pieces = await splitter.splitText(pageText);

    for (const piece of pieces) {
      const text = piece.trim();
      if (!text) continue;

      chunks.push({ pageNumber: page.pageNumber, chunkIndex, text });
      chunkIndex++;
    }
  }

  return chunks;
};