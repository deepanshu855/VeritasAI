import mongoose from "mongoose";
import { runChat } from "../services/chat.graph.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import fileModel from "../models/file.model.js";
import { deleteFiles } from "../services/storage.service.js";
import chunkModel from "../models/chunk.model.js";
import { prepareChat, saveAiMessage } from "../services/chat.service.js";

const MAX_FILES_PER_MESSAGE = 5;

export const sendMessage = async (req, res, next) => {
  try {
    const { message, chatId, fileIds = [] } = req.body;
    const { id } = req.user;

    // before the AI
    const { userChat, messages, runOptions } = await prepareChat({
      userId: id,
      message,
      chatId,
      fileIds,
    });

    // the AI (unchanged)
    const { answer: aiResponse, citations } = await runChat(
      messages,
      runOptions,
    );

    // after the AI
    await saveAiMessage({ chatId: userChat._id, content: aiResponse });

    res.status(200).json({
      success: true,
      chat: userChat,
      title: userChat.title,
      aiResponse,
      citations,
    });
  } catch (error) {
    next(error);
  }
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

  if (!mongoose.isValidObjectId(chatId)) {
    const error = new Error("Chat not found");
    error.status = 400;
    return next(error);
  }

  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id, // Ensure karna user apni hi chats access kr sake kisi or user ki nahi
  });

  if (!chat) {
    const error = new Error("Chat not found");
    error.status = 400;
    return next(error);
  }

  const messages = await messageModel
    .find({ chat: chatId })
    .populate("attachments", "originalName mimeType size url status");

  res.status(200).json({
    success: true,
    message: "Message fetched successfully",
    messages,
  });
};

export const deleteChat = async (req, res, next) => {
  const { chatId } = req.params;

  if (!mongoose.isValidObjectId(chatId)) {
    const error = new Error("Chat not found");
    error.status = 400;
    return next(error);
  }

  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id,
  });

  if (!chat) {
    const error = new Error("Chat not found");
    error.status = 400;
    return next(error);
  }

  // Remove the chat's files from ImageKit, then their records
  const files = await fileModel.find({ chat: chatId }).select("storageKey");
  await deleteFiles(files.map((f) => f.storageKey));
  await fileModel.deleteMany({ chat: chatId });

  // Remove the chat's chunks (filtered by user too, so only this user's data is touched)
  await chunkModel.deleteMany({ chat: chatId, user: req.user.id });

  const deleteChat = await chatModel.findByIdAndDelete(chatId);
  const deleteMessages = await messageModel.deleteMany({ chat: chatId });

  res.status(200).json({
    success: true,
    message: "Chat deleted successfully.",
    deleteChat,
    deleteMessages,
  });
};
