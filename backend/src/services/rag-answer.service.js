import { answerFromSources, NOT_IN_DOCUMENT } from "./ai.service.js";
import { buildSources, checkCitations } from "./rag-sources.service.js";

// Returns { answer, citations, sources, stats }
//  citations: only the sources the answer really cites (built by us, not by the model)
//  sources:   everything we sent to the model (no text), useful for the evaluation
export const answerQuestion = async ({ question, userId, chatId }) => {
  // 1) Find the most relevant chunks and number them
  const { sources, retrieval } = await buildSources({
    question,
    userId,
    chatId,
  });

  // 2) Nothing to read = nothing to answer from, so we don't call the model
  if (sources.length === 0) {
    return {
      answer: NOT_IN_DOCUMENT,
      citations: [],
      sources: [],
      stats: {
        retrieval,
        sourceCount: 0,
        skippedModel: true,
        notInDocument: true,
        invalidCitations: 0,
        uncited: false,
        answerMs: 0,
      },
    };
  }

  // 3) Ask the model
  const started = Date.now();
  const rawAnswer = await answerFromSources({ question, sources });
  const answerMs = Date.now() - started;

  if (typeof rawAnswer !== "string" || !rawAnswer.trim()) {
    const failure = new Error(
      "Could not generate an answer. Please try again.",
    );
    failure.userFacing = true;
    throw failure;
  }

  // 4) Check the citations in our own code
  const { cleaned, used, invalid, reformatted } = checkCitations(
    rawAnswer,
    sources.length,
  );
  const notInDocument = cleaned === NOT_IN_DOCUMENT;
  const uncited = !notInDocument && used.length === 0;

  const citations = notInDocument
    ? []
    : used.map((n) => {
        const s = sources[n - 1];
        return { number: n, fileName: s.fileName, pageNumber: s.pageNumber };
      });

  const stats = {
    retrieval,
    sourceCount: sources.length,
    skippedModel: false,
    notInDocument,
    invalidCitations: invalid,
    reformattedCitations: reformatted,
    uncited,
    answerMs,
  };

  console.log(
    `[answer-svc] chat=${chatId} sources=${sources.length} cited=${used.length} invalid=${invalid} reformatted=${reformatted} uncited=${uncited} notInDocument=${notInDocument} answerMs=${answerMs}`,
  );

  return {
    answer: cleaned,
    citations,
    sources: sources.map(({ number, fileName, pageNumber }) => ({
      number,
      fileName,
      pageNumber,
    })),
    stats,
  };
};