import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  reconnection: false,
  extraHeaders: { cookie: `token=${process.env.TEST_TOKEN}` },
});
const chatId = process.env.TEST_CHAT_ID;

// Every event the server sends us, in order
const events = [];
socket.on("chat:done", (data) => events.push({ type: "done", data }));
socket.on("chat:error", (data) => events.push({ type: "error", data }));

// Waits until `count` events have arrived (max 60 s)
const waitFor = async (count) => {
  const deadline = Date.now() + 60000;
  while (events.length < count && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
  }
};

const show = (label, from) => {
  const got = events.slice(from);
  if (got.length === 0) console.log(`${label}: NO EVENT (timeout)`);
  for (const e of got) {
    if (e.type === "done") {
      console.log(
        `${label}: DONE chars=${e.data.aiResponse.length} citations=${JSON.stringify(e.data.citations)}`,
      );
      console.log(`   answer starts: ${e.data.aiResponse.slice(0, 100)}`);
    } else {
      console.log(`${label}: ERROR "${e.data.message}"`);
    }
  }
};

await new Promise((resolve) => {
  socket.on("connect", resolve);
  socket.on("connect_error", (err) => {
    console.log("connect failed:", err.message);
    process.exit(1);
  });
});

// A: a normal docs question
let from = events.length;
socket.emit("chat:send", { chatId, message: "What is the range of TINYINT?" });
await waitFor(from + 1);
show("A docs question", from);

// B: empty payload
from = events.length;
socket.emit("chat:send", {});
await waitFor(from + 1);
show("B empty payload", from);

// C: two orders at the same moment
from = events.length;
socket.emit("chat:send", { chatId, message: "What does GROUP BY do?" });
socket.emit("chat:send", { chatId, message: "What does ORDER BY do?" });
await waitFor(from + 2);
show("C two at once", from);

socket.close();