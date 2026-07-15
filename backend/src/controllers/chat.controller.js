import { generateResponse, generateTitle } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { success, tuple } from "zod/v4";

export const sendMessage = async (req, res, next) => {
  const { message, chatId } = req.body;
  const { id } = req.user;

  let title = null;
  let userChat = null;
  if (!chatId) {
    title = await generateTitle(message);
    userChat = await chatModel.create({
      user: id,
      title,
    });
  } else {
    title = await chatModel.findById(chatId);
  }

  const userMessage = await messageModel.create({
    chat: chatId || userChat._id,
    content: message,
    role: "user",
  });

  const messages = await messageModel.find({ chat: chatId || userChat._id });
  const aiResponse = await generateResponse(messages);

  if (!aiResponse) {
    const error = new Error("Cannot get response, please try again later");
    error.status = 400;
    return next(error);
  }

  const aiMessage = await messageModel.create({
    chat: chatId || userChat._id,
    content: aiResponse,
    role: "ai",
  });

  res.status(200).json({
    success: true,
    chat: chatId || userChat._id,
    title: title.title,
    aiResponse,
  });
};

export const getUserChats = async (req, res, next) => {
  const { id } = req.user;

  const chats = await chatModel.find({ user: id });

  res.status(200).json({
    success: true,
    message: "User chats fetched successfully",
    chats,
  });
};

export const getMessage = async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id, // Ensure karna user apni hi chats access kr sake kisi or user ki nahi
  });

  if (!chat) {
    const error = new Error("Chat not found");
    error.status = 400;
    return next(error);
  }

  const messages = await messageModel.find({ chat: chatId });

  res.status(200).json({
    success: true,
    message: "Message fetched successfully",
    messages,
  });
};

export const deleteChat = async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id,
  });

  if (!chat) {
    const error = new Error("Chat not found");
    error.status = 400;
    return next(error);
  }

  const deleteChat = await chatModel.findByIdAndDelete(chatId);

  // We also need to delete messages.
  const deleteMessages = await messageModel.deleteMany({ chat: chatId });

  res.status(200).json({
    success: true,
    message: "Chat deleted successfully.",
    deleteChat,
    deleteMessages,
  });
};
