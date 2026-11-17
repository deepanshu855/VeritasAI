import mongoose from "mongoose";
import chatModel from "../models/chat.model.js";
import fileModel from "../models/file.model.js";
import { saveFile, deleteFile } from "../services/storage.service.js";
import { processFile } from "../services/ingestion.service.js";

export const uploadFile = async (req, res, next) => {
  const { chatId } = req.params;
  const { id } = req.user;

  // 1. Check the chat exists and belongs to this user
  if (!mongoose.isValidObjectId(chatId)) {
    const error = new Error("Chat not found");
    error.status = 400;
    return next(error);
  }

  const chat = await chatModel.findOne({ _id: chatId, user: id });
  if (!chat) {
    const error = new Error("Chat not found");
    error.status = 400;
    return next(error);
  }

  // 2. Upload the file to ImageKit
  const { buffer, originalname, mimetype, size } = req.file;

  let stored;
  try {
    stored = await saveFile({
      buffer,
      originalName: originalname,
      userId: id,
      chatId,
    });
  } catch (err) {
    console.error("ImageKit upload failed:", err);
    const error = new Error("Could not store the file, please try again");
    error.status = 502;
    return next(error);
  }

  // 3. Create the File record. If this fails, remove the file from
  // ImageKit so nothing is left orphaned.
  try {
    const file = await fileModel.create({
      user: id,
      chat: chatId,
      originalName: originalname,
      mimeType: mimetype,
      size,
      storageKey: stored.storageKey,
      url: stored.url,
      status: "uploaded",
    });

    // 4. Send the details back
    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: {
        fileId: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        status: file.status,
      },
    });

    // 5. Parse in the background. Not awaited on purpose, so the
    // upload response is not delayed.
    processFile({ fileId: file._id, buffer, mimeType: mimetype });
  } catch (err) {
    await deleteFile(stored.storageKey).catch(() => {});
    next(err);
  }
};

export const getFile = async (req, res, next) => {
  const { chatId, fileId } = req.params;
  const { id } = req.user;

  const notFound = () => {
    const error = new Error("File not found");
    error.status = 404;
    return error;
  };

  if (!mongoose.isValidObjectId(chatId) || !mongoose.isValidObjectId(fileId)) {
    return next(notFound());
  }

  const file = await fileModel
    .findOne({ _id: fileId, chat: chatId, user: id })
    .select("+pages");
  if (!file) return next(notFound());

  res.json({
    success: true,
    file: {
      fileId: file._id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      status: file.status,
      errorMessage: file.errorMessage,
      pageCount: file.pageCount,
      parseMs: file.parseMs,
      pages: file.pages.map((page) => ({
        pageNumber: page.pageNumber,
        method: page.method,
        parseMs: page.parseMs,
        chars: page.text.length,
        preview: page.text.slice(0, 200),
      })),
    },
  });
};
