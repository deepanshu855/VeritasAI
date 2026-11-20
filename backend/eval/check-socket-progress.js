import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  reconnection: false,
  extraHeaders: { cookie: `token=${process.env.TEST_TOKEN}` },
});
const chatId = process.env.TEST_CHAT_ID;

await new Promise((resolve) => {
  socket.on("connect", resolve);
  socket.on("connect_error", (err) => {
    console.log("connect failed:", err.message);
    process.exit(1);
  });
});

// Sends one order, prints every event with its time, and waits for done or error
const ask = (label, payload) =>
  new Promise((resolve) => {
    console.log(`\n=== ${label}`);
    const start = Date.now();
    const stamp = () => `+${Date.now() - start}ms`;

    // NEW: token bookkeeping
    let pieces = 0;
    let streamed = "";
    let firstAt = null;
    let lastAt = null;

    const onProgress = ({ stage }) => console.log(`  ${stamp()} stage=${stage}`);
    // NEW: one piece of answer text
    const onToken = ({ text }) => {
      pieces++;
      streamed += text;
      if (firstAt === null) firstAt = Date.now() - start;
      lastAt = Date.now() - start;
    };
    const onDone = (d) => {
      console.log(
        `  ${stamp()} DONE chat=${d.chat?._id} citations=${d.citations.length} answer: ${d.aiResponse.slice(0, 80)}`,
      );
      // NEW: summary of the tokens
      console.log(
        `  tokens: pieces=${pieces} firstAt=${firstAt}ms lastAt=${lastAt}ms streamed equals aiResponse: ${streamed.trim() === d.aiResponse.trim()}`,
      );
      finish();
    };
    const onError = (d) => {
      console.log(`  ${stamp()} ERROR "${d.message}" (pieces before the error: ${pieces})`);
      finish();
    };
    const timer = setTimeout(() => {
      console.log(`  ${stamp()} TIMEOUT (no done/error in 60 s)`);
      finish();
    }, 60000);
    const finish = () => {
      clearTimeout(timer);
      socket.off("chat:progress", onProgress);
      socket.off("chat:token", onToken); // NEW
      socket.off("chat:done", onDone);
      socket.off("chat:error", onError);
      resolve();
    };

    socket.on("chat:progress", onProgress);
    socket.on("chat:token", onToken); // NEW
    socket.on("chat:done", onDone);
    socket.on("chat:error", onError);
    socket.emit("chat:send", payload);
  });

await ask("A docs", { chatId, message: "How do I make lookups on a column faster?" });
await ask("B web", { chatId, message: "What is the latest stable version of Node.js?" });
await ask("C direct", { chatId, message: "Hi, how are you?" });
await ask("D new chat (no chatId)", { message: "Hello, who are you?" });

socket.close();