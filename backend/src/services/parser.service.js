import { performance } from "node:perf_hooks";
import {
  definePDFJSModule,
  getDocumentProxy,
  extractText,
  renderPageAsImage,
} from "unpdf";
import { recognizeText } from "./ocr.service.js";

// Node 22 doesn't have Promise.try yet, but PDF.js calls it.
// This adds it only when it is missing.
if (typeof Promise.try !== "function") {
  Promise.try = (fn, ...args) => new Promise((resolve) => resolve(fn(...args)));
}

const MAX_PDF_PAGES = 50;
const MIN_TEXT_CHARS = 20; // fewer characters than this = treat the page as scanned
const RENDER_SCALE = 3; // higher = sharper image for OCR, but slower and heavier

// An error whose message is safe to show to the user
const userError = (message) => {
  const error = new Error(message);
  error.userFacing = true;
  return error;
};

// Page rendering needs the official PDF.js build, set up once.
// We use the "legacy" build because it is the one meant for Node.js.
let pdfjsReady = null;
const ensurePdfjs = () => {
  if (!pdfjsReady) {
    pdfjsReady = definePDFJSModule(
      () => import("pdfjs-dist/legacy/build/pdf.mjs"),
    ).catch((err) => {
      pdfjsReady = null;
      throw err;
    });
  }
  return pdfjsReady;
};

// Frees PDF.js memory. Cleanup problems are logged, never thrown,
// so they can't hide the real result of the parse.
const releasePdf = async (pdf) => {
  try {
    if (typeof pdf.destroy === "function") {
      await pdf.destroy();
    } else if (typeof pdf.loadingTask?.destroy === "function") {
      await pdf.loadingTask.destroy();
    }
  } catch (err) {
    console.error("PDF cleanup failed:", err);
  }
};

const parsePdf = async (buffer) => {
  await ensurePdfjs();

  let pdf;
  try {
    // new Uint8Array(buffer) makes a copy, so the original buffer stays intact
    pdf = await getDocumentProxy(new Uint8Array(buffer));
  } catch (err) {
    console.error("Could not open PDF:", err);
    throw userError(
      "Could not read this PDF. It may be corrupted or password-protected.",
    );
  }

  try {
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw userError(
        `This PDF has ${pdf.numPages} pages. The maximum is ${MAX_PDF_PAGES}.`,
      );
    }

    // Direct text for all pages at once
    const extractStart = performance.now();
    const { text } = await extractText(pdf, { mergePages: false });
    const extractShareMs = (performance.now() - extractStart) / pdf.numPages;

    const pages = [];
    for (let i = 0; i < pdf.numPages; i++) {
      const pageNumber = i + 1;
      const direct = (text[i] ?? "").trim();

      if (direct.length >= MIN_TEXT_CHARS) {
        pages.push({
          pageNumber,
          text: direct,
          method: "text",
          parseMs: Math.round(extractShareMs), // average share of the total
        });
        continue;
      }

      // Scanned page: draw it as an image, then OCR it
      const start = performance.now();
      const png = await renderPageAsImage(pdf, pageNumber, {
        canvasImport: () => import("@napi-rs/canvas"),
        scale: RENDER_SCALE,
      });
      const ocrText = await recognizeText(Buffer.from(png));

      // Keep whichever result has more text
      const useOcr = ocrText.length > direct.length;
      pages.push({
        pageNumber,
        text: useOcr ? ocrText : direct,
        method: useOcr ? "ocr" : "text",
        parseMs: Math.round(performance.now() - start),
      });
    }
    return pages;
  } finally {
    await releasePdf(pdf); // free the memory PDF.js holds
  }
};

const parseImage = async (buffer) => {
  const start = performance.now();
  try {
    const text = await recognizeText(buffer);
    return [
      {
        pageNumber: 1,
        text,
        method: "ocr",
        parseMs: Math.round(performance.now() - start),
      },
    ];
  } catch (err) {
    console.error("OCR failed on image:", err);
    throw userError("Could not read text from this image.");
  }
};

// Returns { pages, pageCount, parseMs } or throws an error
export const parseFile = async ({ buffer, mimeType }) => {
  const start = performance.now();

  const pages =
    mimeType === "application/pdf"
      ? await parsePdf(buffer)
      : await parseImage(buffer);

  if (!pages.some((page) => page.text.length > 0)) {
    throw userError("No readable text was found in this file.");
  }

  return {
    pages,
    pageCount: pages.length,
    parseMs: Math.round(performance.now() - start),
  };
};
