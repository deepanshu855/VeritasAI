import app from "./src/app.js";
import connectToDb from "./src/config/database.js";
import http from "http";
import { initSocket } from "./src/sockets/server.sockets.js";

const httpServer = http.createServer(app);

initSocket(httpServer);
connectToDb();
httpServer.listen(3000, () => {
  console.log("Server running...");
});
