import { io } from "socket.io-client";

const URL = "http://localhost:3000";

// Tries to connect with the given Cookie header and says what happened
const tryConnect = (label, cookie) =>
  new Promise((resolve) => {
    const socket = io(URL, {
      reconnection: false,
      extraHeaders: cookie ? { cookie } : {},
    });
    const timer = setTimeout(() => {
      socket.close();
      resolve(`${label}: TIMEOUT (no answer in 5 s)`);
    }, 5000);
    socket.on("connect", () => {
      clearTimeout(timer);
      socket.close();
      resolve(`${label}: CONNECTED`);
    });
    socket.on("connect_error", (err) => {
      clearTimeout(timer);
      socket.close();
      resolve(`${label}: REFUSED (${err.message})`);
    });
  });

console.log(await tryConnect("1 no cookie", null));
console.log(await tryConnect("2 bad token", "token=not-a-real-token"));

const good = process.env.TEST_TOKEN;
if (good) {
  console.log(await tryConnect("3 valid token", `token=${good}`));
} else {
  console.log("3 valid token: SKIPPED (set TEST_TOKEN first)");
}