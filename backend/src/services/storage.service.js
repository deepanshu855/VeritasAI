import "dotenv/config";
import ImageKit, { toFile } from "@imagekit/nodejs";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

export const saveFile = async ({ buffer, originalName, userId, chatId }) => {
  const file = await toFile(buffer, originalName);

  const result = await imagekit.files.upload({
    file,
    fileName: originalName,
    folder: `/veritasai/${userId}/${chatId}`,
  });

  return {
    storageKey: result.fileId,
    url: result.url,
  };
};

export const deleteFile = async (storageKey) => {
  await imagekit.files.delete(storageKey);
};

// Used when a chat is deleted. allSettled means one failed delete
// doesn't stop the others.
export const deleteFiles = async (storageKeys) => {
  const results = await Promise.allSettled(
    storageKeys.map((key) => imagekit.files.delete(key)),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`Failed to delete ${failed.length} file(s) from ImageKit`);
  }
};