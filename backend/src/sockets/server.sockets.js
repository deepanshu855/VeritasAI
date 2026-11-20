import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { registerChatHandlers } from "./chat.sockets.js"; // NEW

let io;

// Reads one cookie value out of the raw "Cookie" header
const readCookie = (header, name) => {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // The door guard. Runs once for every new connection.
  io.use((socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie, "token");
      if (!token) return next(new Error("Unauthorized access"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.id;
      next();
    } catch {
      // Same message for every failure, so we don't leak why it failed
      next(new Error("Unauthorized access"));
    }
  });

  console.log("Socket.io server is running");

  io.on("connection", (socket) => {
    console.log(`[socket] connected socket=${socket.id} user=${socket.data.userId}`);
    registerChatHandlers(socket); // NEW
    socket.on("disconnect", (reason) => {
      console.log(`[socket] disconnected socket=${socket.id} reason=${reason}`);
    });
  });
};

export const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized.");

  return io;
};