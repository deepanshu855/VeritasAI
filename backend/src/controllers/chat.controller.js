import mongoose from "mongoose";
import { generateResponse, generateTitle } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import fileModel from "../models/file.model.js";
import { deleteFiles } from "../services/storage.service.js";
import chunkModel from "../models/chunk.model.js";

const MAX_FILES_PER_MESSAGE = 5;

export const sendMessage = async (req, res, next) => {
  const { message, chatId, fileIds = [] } = req.body;
  const { id } = req.user;

  const fail = (text, status = 400) => {
    const error = new Error(text);
    error.status = status;
    return next(error);
  };

  if (!Array.isArray(fileIds) || fileIds.length > MAX_FILES_PER_MESSAGE) {
    return fail(
      `You can attach up to ${MAX_FILES_PER_MESSAGE} files per message`,
    );
  }

  const uniqueFileIds = [...new Set(fileIds.map(String))];
  if (!uniqueFileIds.every((fid) => mongoose.isValidObjectId(fid))) {
    return fail("Invalid file id");
  }

  // Text may be empty only when files are attached
  const text = typeof message === "string" ? message.trim() : "";
  if (!text && uniqueFileIds.length === 0) {
    return fail("Message or file is required");
  }

  let userChat = null;

  if (!chatId) {
    // Files are uploaded to an existing chat, so a brand-new chat can't have any
    if (uniqueFileIds.length > 0) {
      return fail("Files can only be attached to an existing chat");
    }

    const title = await generateTitle(message);
    userChat = await chatModel.create({ user: id, title });
  } else {
    if (!mongoose.isValidObjectId(chatId)) {
      return fail("Chat not found");
    }

    // Must belong to this user
    userChat = await chatModel.findOne({ _id: chatId, user: id });
    if (!userChat) {
      return fail("Chat not found");
    }
  }

  // Every attached file must belong to this user AND this chat, and be ready
  if (uniqueFileIds.length > 0) {
    const files = await fileModel
      .find({
        _id: { $in: uniqueFileIds },
        user: id,
        chat: userChat._id,
      })
      .select("status");

    if (files.length !== uniqueFileIds.length) {
      return fail("One or more files were not found in this chat");
    }

    if (files.some((f) => f.status !== "ready")) {
      return fail(
        "One or more files are not ready yet. Wait until processing finishes, or upload the file again if it failed.",
      );
    }
  }

  const userMessage = await messageModel.create({
    chat: userChat._id,
    content: message,
    role: "user",
    attachments: uniqueFileIds,
  });

  // Only chats with at least one fully processed file get the document tool
  const hasDocuments = Boolean(
    await fileModel.exists({
      chat: userChat._id,
      user: id,
      status: "ready",
    }),
  );

  const messages = await messageModel.find({ chat: userChat._id });
  const { answer: aiResponse, citations } = await generateResponse(messages, {
    userId: id,
    chatId: String(userChat._id),
    hasDocuments,
  });

  if (!aiResponse) {
    return fail("Cannot get response, please try again later");
  }

  const aiMessage = await messageModel.create({
    chat: userChat._id,
    content: aiResponse,
    role: "ai",
  });

  res.status(200).json({
    success: true,
    chat: userChat,
    title: userChat.title,
    aiResponse,
    citations,
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
