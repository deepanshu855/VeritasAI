import { io } from "socket.io-client";

export const initializeSocketConnection = () => {
  const socket = io("https://veritasai-v214.onrender.com/", {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Connected to socket.io server");
  });
};
