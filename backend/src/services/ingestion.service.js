import fileModel from "../models/file.model.js";
import chunkModel from "../models/chunk.model.js";
import { parseFile } from "./parser.service.js";
import { chunkPages } from "./chunker.service.js";
import { embedChunks } from "./embedding.service.js";

// Runs in the background. It never throws, it records the outcome on the File.
export const processFile = async ({ fileId, buffer, mimeType }) => {
  try {
    // user and chat are needed on every chunk. If the file is gone, stop quietly.
    const file = await fileModel.findById(fileId).select("user chat");
    if (!file) return;

    await fileModel.updateOne({ _id: fileId }, { $set: { status: "processing" } });

    const { pages, pageCount, parseMs } = await parseFile({ buffer, mimeType });

    const chunks = await chunkPages(pages);

    // Embed BEFORE deleting old chunks, so this file's own old chunks
    // can also act as cache when a file is processed again
    const { chunks: embeddedChunks } = await embedChunks({
      chunks,
      userId: file.user,
      label: String(fileId),
    });

    await chunkModel.deleteMany({ file: fileId });
    if (embeddedChunks.length > 0) {
      await chunkModel.insertMany(
        embeddedChunks.map((chunk) => ({
          ...chunk,
          user: file.user,
          chat: file.chat,
          file: file._id,
        })),
      );
    }

    // "ready" is set only after the chunks (with vectors) are saved
    await fileModel.updateOne(
      { _id: fileId },
      {
        $set: { status: "ready", pages, pageCount, parseMs },
        $unset: { errorMessage: "" },
      },
    );
  } catch (err) {
    console.error(`Processing failed for file ${fileId}:`, err);
    const message = err.userFacing ? err.message : "Could not process this file.";

    // Remove any half-saved chunks (best effort)
    await chunkModel
      .deleteMany({ file: fileId })
      .catch((dbErr) => console.error("Could not clean up chunks:", dbErr));

    await fileModel
      .updateOne({ _id: fileId }, { $set: { status: "failed", errorMessage: message } })
      .catch((dbErr) => console.error("Could not save failed status:", dbErr));
  }
};