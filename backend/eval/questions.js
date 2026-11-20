// Answer key for the router. Routing only: no pages, no answer checks.
// hasDocuments: true means every question is asked in a chat that has the
// "SQL Notes by Apna College" PDF ready.
// route: "docs" = answer from the uploaded file, "web" = needs fresh internet info,
//        "direct" = small talk or general knowledge, no tool needed.
// ambiguous: true = even a human could argue either way, so it is reported
//        separately and NOT counted in the accuracy number.

export const routingQuestions = [
  // docs (reused from the retrieval set, same wording)
  { id: 1, route: "docs", text: "How do I make lookups on a column faster?" },
  { id: 2, route: "docs", text: "How do I undo changes if something fails midway in a transaction?" },
  { id: 3, route: "docs", text: "What does GROUP BY do?" },
  { id: 4, route: "docs", text: "What is HAVING used for?" },
  { id: 5, route: "docs", text: "What is the range of TINYINT?" },
  { id: 6, route: "docs", text: "Explain FULL OUTER JOIN" },

  // web (needs current information)
  { id: 7, route: "web", text: "What is the latest stable version of Node.js?" },
  { id: 8, route: "web", text: "What is today's USD to INR exchange rate?" },
  { id: 9, route: "web", text: "Who won the most recent Formula 1 race?" },
  { id: 10, route: "web", text: "What is the weather in Delhi today?" },
  { id: 11, route: "web", text: "What are the latest news headlines about the Indian cricket team?" },

  // direct (no tool needed)
  { id: 12, route: "direct", text: "Hi, how are you?" },
  { id: 13, route: "direct", text: "Thanks, that helps!" },
  { id: 14, route: "direct", text: "What is the capital of France?" },
  { id: 15, route: "direct", text: "Explain what a REST API is in simple words" },
  { id: 16, route: "direct", text: "How do I bake a chocolate cake?" },

  // ambiguous (a document is uploaded, but the question is general SQL knowledge)
  { id: 17, route: "docs", ambiguous: true, text: "What is a primary key?" },
  { id: 18, route: "direct", ambiguous: true, text: "How do I use window functions like ROW_NUMBER?" },
];

export const hasDocuments = true;