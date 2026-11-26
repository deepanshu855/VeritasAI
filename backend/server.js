import app from "./src/app.js";
import connectToDb from "./src/config/database.js";
import { connectToRedis } from "./src/config/redis.config.js"; // NEW
import http from "http";
import { initSocket } from "./src/sockets/server.sockets.js";

const httpServer = http.createServer(app);

initSocket(httpServer);
connectToDb();
connectToRedis(); // NEW
httpServer.listen(8080, () => {
  console.log("Server running...");
});