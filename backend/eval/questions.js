// The fixed test set for retrieval. Used by the vector-only baseline now,
// and by the hybrid comparison later, so both see exactly the same questions.
//
// pages: a hit means at least one chunk from one of these pages is in the top 5.
// Pages are counted from the "SQL Notes by Apna College" PDF (29 pages).
// type: "meaning" = paraphrased question, "term" = exact keyword, "none" = not in the PDF.

export const questions = [
  // Plain-meaning questions
  { id: 1, type: "meaning", text: "Is SQL itself a database?", pages: [1] },
  { id: 2, type: "meaning", text: "How do I make lookups on a column faster?", pages: [4] },
  { id: 3, type: "meaning", text: "How do I undo changes if something fails midway in a transaction?", pages: [13] },
  { id: 4, type: "meaning", text: "How can I let a user read a table?", pages: [11] },
  { id: 5, type: "meaning", text: "How do I list each employee with their manager's name?", pages: [20, 21] },
  { id: 6, type: "meaning", text: "How do I combine two queries and keep the duplicate rows?", pages: [24, 25] },

  // Exact-term questions
  { id: 7, type: "term", text: "What does GROUP BY do?", pages: [8, 9] },
  { id: 8, type: "term", text: "What is HAVING used for?", pages: [9] },
  { id: 9, type: "term", text: "How does the % wildcard work with LIKE?", pages: [6, 7] },
  { id: 10, type: "term", text: "What is the range of TINYINT?", pages: [2] },
  // The PDF never defines "primary key"; pages 3 and 4 only mention it
  { id: 11, type: "term", text: "What is a primary key?", pages: [3, 4] },
  { id: 12, type: "term", text: "Explain FULL OUTER JOIN", pages: [18, 19] },

  // No answer in the PDF: not counted in hit rate, we only look at the scores
  { id: 13, type: "none", text: "How do I bake a chocolate cake?", pages: [] },
  { id: 14, type: "none", text: "How do I use window functions like ROW_NUMBER?", pages: [] },
];