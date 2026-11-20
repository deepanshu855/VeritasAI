import mongoose from "mongoose";
import { generateTitle } from "./ai.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import fileModel from "../models/file.model.js";
import chunkModel from "../models/chunk.model.js";

const MAX_FILES_PER_MESSAGE = 5;

// An Error that carries an HTTP status (same style as the controller used)
const httpError = (text, status = 400) => {
  const error = new Error(text);
  error.status = status;
  return error;
};

// Part 1: everything that happens BEFORE the AI runs.
// Returns { userChat, messages, runOptions } (pass messages + runOptions to runChat).
export const prepareChat = async ({
  userId,
  message,
  chatId,
  fileIds = [],
}) => {
  if (!Array.isArray(fileIds) || fileIds.length > MAX_FILES_PER_MESSAGE) {
    throw httpError(
      `You can attach up to ${MAX_FILES_PER_MESSAGE} files per message`,
    );
  }

  const uniqueFileIds = [...new Set(fileIds.map(String))];
  if (!uniqueFileIds.every((fid) => mongoose.isValidObjectId(fid))) {
    throw httpError("Invalid file id");
  }

  // Text may be empty only when files are attached
  const text = typeof message === "string" ? message.trim() : "";
  if (!text && uniqueFileIds.length === 0) {
    throw httpError("Message or file is required");
  }

  let userChat = null;

  if (!chatId) {
    // Files are uploaded to an existing chat, so a brand-new chat can't have any
    if (uniqueFileIds.length > 0) {
      throw httpError("Files can only be attached to an existing chat");
    }

    const title = await generateTitle(message);
    userChat = await chatModel.create({ user: userId, title });
  } else {
    if (!mongoose.isValidObjectId(chatId)) {
      throw httpError("Chat not found");
    }

    // Must belong to this user
    userChat = await chatModel.findOne({ _id: chatId, user: userId });
    if (!userChat) {
      throw httpError("Chat not found");
    }
  }

  // Every attached file must belong to this user AND this chat, and be ready
  if (uniqueFileIds.length > 0) {
    const files = await fileModel
      .find({
        _id: { $in: uniqueFileIds },
        user: userId,
        chat: userChat._id,
      })
      .select("status");

    if (files.length !== uniqueFileIds.length) {
      throw httpError("One or more files were not found in this chat");
    }

    if (files.some((f) => f.status !== "ready")) {
      throw httpError(
        "One or more files are not ready yet. Wait until processing finishes, or upload the file again if it failed.",
      );
    }
  }

  await messageModel.create({
    chat: userChat._id,
    content: message,
    role: "user",
    attachments: uniqueFileIds,
  });

  // Load the ready files (the router needs their names)
  const readyFiles = await fileModel
    .find({ chat: userChat._id, user: userId, status: "ready" })
    .select("originalName")
    .limit(5);
  const hasDocuments = readyFiles.length > 0;

  // Router hint: file name + the start of the file's real text
  // (a name alone can mislead; blank/image pages are skipped)
  const fileNames = await Promise.all(
    readyFiles.map(async (f) => {
      const early = await chunkModel
        .find({ chat: userChat._id, user: userId, file: f._id })
        .sort({ pageNumber: 1, chunkIndex: 1 })
        .limit(8)
        .select("text")
        .lean();
      const snippet = early
        .map((c) => (c.text || "").replace(/\s+/g, " ").trim())
        .filter((t) => t.length >= 80)
        .slice(0, 3)
        .map((t) => t.slice(0, 150))
        .join(" ... ");
      return snippet
        ? `${f.originalName} (starts with: "${snippet}")`
        : f.originalName;
    }),
  );
  console.log(
    `[router-hint] files=${fileNames.length} chars=${fileNames.join("").length}`,
  );

  const messages = await messageModel.find({ chat: userChat._id });

  return {
    userChat,
    messages,
    runOptions: {
      userId,
      chatId: String(userChat._id),
      hasDocuments,
      fileNames,
    },
  };
};

// Part 2: save the AI's answer AFTER the AI has run
export const saveAiMessage = async ({ chatId, content }) => {
  if (!content) {
    throw httpError("Cannot get response, please try again later");
  }
  return messageModel.create({ chat: chatId, content, role: "ai" });
};