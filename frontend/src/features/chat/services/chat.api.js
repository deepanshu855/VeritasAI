import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const instance = axios.create({
  baseURL: `${API_BASE}/api/chats`,
  withCredentials: true,
});

export const sendMessage = async ({ message, chatId, fileIds = [] }) => {
  const response = await instance.post("/", { message, chatId, fileIds });
  return response.data;
};

export const getChats = async () => {
  const response = await instance.get("/");
  return response.data;
};

export const getMessages = async (chatId) => {
  const response = await instance.get(`/${chatId}/messages`);
  return response.data;
};

export const deleteChat = async (chatId) => {
  const response = await instance.delete(`/delete/${chatId}`);
  return response.data;
};

export const uploadFile = async ({ chatId, file }) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await instance.post(`/${chatId}/files`, formData);
  return response.data;
};

export const getFileStatus = async ({ chatId, fileId }) => {
  const response = await instance.get(`/${chatId}/files/${fileId}`);
  return response.data;
};
