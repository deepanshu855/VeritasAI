import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

let socket = null;

export const connectSocket = () => {
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(API_BASE, {
    withCredentials: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

export const isSocketConnected = () => Boolean(socket?.connected);

export const sendChatMessage = ({ message, chatId, fileIds = [] }) => {
  if (!socket) return;
  socket.emit("chat:send", { message, chatId, fileIds });
};

export const cancelChatRun = () => {
  if (!socket) return;
  socket.emit("chat:cancel");
};

const subscribe = (event, callback) => {
  if (!socket || typeof callback !== "function") return () => {};
  socket.on(event, callback);
  return () => {
    socket?.off(event, callback);
  };
};

export const onConnect = (cb) => subscribe("connect", cb);
export const onDisconnect = (cb) => subscribe("disconnect", cb);
export const onConnectError = (cb) => subscribe("connect_error", cb);
export const onChatProgress = (cb) => subscribe("chat:progress", cb);
export const onChatToken = (cb) => subscribe("chat:token", cb);
export const onChatDone = (cb) => subscribe("chat:done", cb);
export const onChatError = (cb) => subscribe("chat:error", cb);
export const onChatCancelled = (cb) => subscribe("chat:cancelled", cb);
