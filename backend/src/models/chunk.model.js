import mongoose from "mongoose";

// One small piece of a page's text, plus its embedding vector.
const chunkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
    index: true, // used to delete or replace all chunks of one file
  },
  pageNumber: {
    type: Number, // starts at 1, same as in File.pages
    required: true,
  },
  chunkIndex: {
    type: Number, // running number per file: 0, 1, 2... keeps the original order
    required: true,
  },
  text: {
    type: String,
    required: true,
  },

  // NEW: fingerprint (SHA-256) of the text, used by the embedding cache
  contentHash: {
    type: String,
  },
  // NEW: which model and size made the vector, e.g. "gemini-embedding-001:768".
  // A vector from another model or size must never be reused.
  embeddingModel: {
    type: String,
  },
  // NEW: the vector itself. Hidden by default so normal queries stay small.
  // default: undefined stops Mongoose from storing an empty array.
  embedding: {
    type: [Number],
    default: undefined,
    select: false,
  },
});

// Retrieval will always filter by user + chat, so index them together
chunkSchema.index({ user: 1, chat: 1 });
// The cache lookup: "same user, same text fingerprint, same model"
chunkSchema.index({ user: 1, contentHash: 1, embeddingModel: 1 });

const chunkModel = mongoose.model("Chunk", chunkSchema);

export default chunkModel;