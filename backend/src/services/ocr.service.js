import Tesseract from "tesseract.js";

let workerPromise = null;
let queue = Promise.resolve();

// Create the worker once, on first use, and reuse it for every job.
const getWorker = () => {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker("eng", 1, {
      cachePath: ".ocr-cache", // where the English language file is stored
    }).catch((err) => {
      workerPromise = null; // allow a retry on the next call
      throw err;
    });
  }
  return workerPromise;
};

// Accepts an image Buffer, returns the recognized text.
// Jobs wait in line so only one OCR job runs at a time.
export const recognizeText = (image) => {
  const job = queue.then(async () => {
    const worker = await getWorker();
    const { data } = await worker.recognize(image);
    return data.text.trim();
  });
  queue = job.catch(() => {}); // a failed job must not block the next one
  return job;
};