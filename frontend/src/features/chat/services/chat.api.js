import axios from "axios";

const instance = axios.create({
  baseURL: "https://veritasai-v214.onrender.com/api/chats",
  withCredentials: true,
});

export const sendMessage = async ({ message, chatId }) => {
  const response = await instance.post("/", { message, chatId });
  return response.data;
};

export const getChat = async () => {
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
