import mongoose from "mongoose";

// One parsed page of a file. No _id needed: pageNumber identifies it.
const pageSchema = new mongoose.Schema(
  {
    pageNumber: { type: Number, required: true }, // starts at 1
    text: { type: String, default: "" },
    method: { type: String, enum: ["text", "ocr"], required: true },
    parseMs: { type: Number, default: 0 }, // time to read this page
  },
  { _id: false },
);

const fileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
    },
    size: {
      type: Number, // in bytes
      required: true,
    },
    storageKey: {
      type: String, // ImageKit fileId, needed to delete the file later
      required: true,
    },
    url: {
      type: String, // ImageKit URL of the original file, for preview/download
      required: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
    },
    errorMessage: {
      type: String, // only filled when status is "failed"
    },

    // NEW: filled by the parsing step
    pageCount: {
      type: Number,
      default: 0,
    },
    parseMs: {
      type: Number, // total parse time for the whole file
    },
    pages: {
      type: [pageSchema],
      select: false, // hidden by default, so normal queries don't load all the text
    },
  },
  {
    timestamps: true,
  },
);

const fileModel = mongoose.model("File", fileSchema);

export default fileModel;