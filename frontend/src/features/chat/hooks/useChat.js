import { initializeSocketConnection } from "../services/chat.socket";
import {
  sendMessage,
  getChat,
  getMessages,
  deleteChat,
} from "../services/chat.api.js";
import {
  setChats,
  setError,
  setCurrentChatId,
  setLoading,
  addMessages,
  addNewMessages,
  createNewChat,
} from "../chat.slice.js";
import { useDispatch } from "react-redux";

export const useChat = () => {
  const dispatch = useDispatch();

  const handleSendMessage = async ({ message, chatId }) => {
    dispatch(setLoading(true));
    console.log("Hook ", message, chatId);
    const data = await sendMessage({ message, chatId });
    const { chat, aiResponse } = data;
    console.log("Api response ", chat, aiResponse);
    if (!chatId) {
      dispatch(
        createNewChat({
          chatId: chat._id,
          title: chat.title,
        }),
      );
    }
    dispatch(
      addNewMessages({
        chatId: chatId || chat._id,
        content: message,
        role: "user",
      }),
    );
    dispatch(
      addNewMessages({
        chatId: chatId || chat._id,
        content: aiResponse,
        role: "ai",
      }),
    );
    dispatch(setCurrentChatId(chatId || chat._id));
    dispatch(setLoading(false));
  };

  const handleGetChats = async () => {
    dispatch(setLoading(false));
    const data = await getChat();
    const { chats } = data;
    dispatch(
      setChats(
        chats.reduce((acc, chat) => {
          acc[chat._id] = {
            id: chat._id,
            title: chat.title,
            messages: [],
            lastUpdated: chat.updatedAt,
          };
          return acc;
        }, {}),
      ),
    );
    dispatch(setLoading(false));
  };

  const handleOpenChats = async (chatId, chats) => {
    if (chats[chatId]?.messages.length === 0) {
      dispatch(setLoading(true));
      const data = await getMessages(chatId);
      const { messages } = data;

      const formattedMessages = messages.map((message) => ({
        content: message.content,
        role: message.role,
      }));

      dispatch(
        addMessages({
          chatId: chatId,
          messages: formattedMessages,
        }),
      );
      dispatch(setLoading(false));
    }
  };

  const handleDeleteChats = async (chatId) => {
    try {
      dispatch(setLoading(true));
      const response = await deleteChat(chatId);
      await handleGetChats();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "deletion failed";
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    initializeSocketConnection,
    handleSendMessage,
    handleGetChats,
    handleOpenChats,
    handleDeleteChats
  };
};
