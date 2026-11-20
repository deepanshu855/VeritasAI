import { io } from "socket.io-client";

const chatId = process.env.TEST_CHAT_ID;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const connect = () =>
  new Promise((resolve) => {
    const s = io("http://localhost:3000", {
      reconnection: false,
      extraHeaders: { cookie: `token=${process.env.TEST_TOKEN}` },
    });
    s.on("connect", () => resolve(s));
    s.on("connect_error", (err) => {
      console.log("connect failed:", err.message);
      process.exit(1);
    });
  });

// Sends one order. Options: cancelOnStage (+ delayMs) presses stop; closeOnStage closes the socket.
const ask = (socket, label, payload, { cancelOnStage, closeOnStage, delayMs = 300 } = {}) =>
  new Promise((resolve) => {
    console.log(`\n=== ${label}`);
    const start = Date.now();
    const stamp = () => `+${Date.now() - start}ms`;
    const terminals = [];
    let pieces = 0;
    let graceTimer = null;

    const finish = () => {
      clearTimeout(hardTimer);
      for (const [ev, fn] of Object.entries(handlers)) socket.off(ev, fn);
      console.log(`  token pieces=${pieces} terminal events=[${terminals.join(", ")}]`);
      resolve();
    };
    const terminal = (name, extra = "") => {
      console.log(`  ${stamp()} ${name} ${extra}`);
      terminals.push(name);
      // wait a little, so a second (wrong) terminal event would still be seen
      if (!graceTimer) graceTimer = setTimeout(finish, 1500);
    };

    const handlers = {
      "chat:progress": ({ stage }) => {
        console.log(`  ${stamp()} stage=${stage}`);
        if (stage === cancelOnStage) {
          setTimeout(() => {
            console.log(`  ${stamp()} >>> chat:cancel sent`);
            socket.emit("chat:cancel");
          }, delayMs);
        }
        if (stage === closeOnStage) {
          setTimeout(() => {
            console.log(`  ${stamp()} >>> socket closed by the client`);
            socket.close();
            setTimeout(finish, 12000); // no events can arrive; wait for the server log
          }, delayMs);
        }
      },
      "chat:token": () => {
        pieces++;
      },
      "chat:done": (d) => terminal("DONE", `answer: ${d.aiResponse.slice(0, 50)}`),
      "chat:error": (d) => terminal("ERROR", `"${d.message}"`),
      "chat:cancelled": (d) => terminal("CANCELLED", `chatId=${d.chatId}`),
    };
    for (const [ev, fn] of Object.entries(handlers)) socket.on(ev, fn);

    const hardTimer = setTimeout(() => {
      console.log(`  ${stamp()} TIMEOUT (30 s)`);
      finish();
    }, 30000);

    socket.emit("chat:send", payload);
  });

const web = { chatId, message: "What is the latest stable version of Node.js?" };
const s1 = await connect();

await ask(s1, "1: cancel 300 ms after searching_web", web, { cancelOnStage: "searching_web" });
await ask(s1, "2: cancel 300 ms after writing (model thinking)", web, { cancelOnStage: "writing" });
await ask(s1, "3: normal order after the cancels (busy flag released?)", {
  chatId,
  message: "Hi, how are you?",
});

console.log("\n=== 4: chat:cancel while nothing is running");
let idleEvents = 0;
const count = () => idleEvents++;
s1.onAny(count);
s1.emit("chat:cancel");
await sleep(1500);
s1.offAny(count);
console.log(`  events received: ${idleEvents} (expected 0)`);
s1.close();

const s2 = await connect();
await ask(s2, "5: client closes the socket during a run (check the SERVER log)", web, {
  closeOnStage: "searching_web",
});
console.log("\nfinished");