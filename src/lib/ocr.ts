/**
 * Reads text from a screenshot entirely in the browser using tesseract.js.
 *
 * Privacy: the image is passed straight from memory to a Web Worker. The
 * engine and English model are loaded from this app's own /ocr folder (see
 * scripts/copy-ocr-assets.mjs), never from a CDN, and tesseract's IndexedDB
 * cache is disabled, so nothing is stored by the OCR library.
 */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];

export type OcrStage = "loading" | "reading";

export interface OcrJob {
  promise: Promise<string>;
  cancel: () => void;
}

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Please choose a PNG, JPG, WebP, GIF or BMP image.";
  if (file.size > MAX_IMAGE_BYTES) return "That image is larger than 10 MB. Try cropping it to just the message.";
  return null;
}

/** Tidies OCR output: normalizes whitespace and drops empty runs of lines. */
export function cleanOcrText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function readImageText(image: Blob, onProgress: (stage: OcrStage, progress: number) => void): OcrJob {
  let terminate: (() => Promise<unknown>) | null = null;
  let cancelled = false;

  const promise = (async () => {
    const { createWorker } = await import("tesseract.js");
    onProgress("loading", 0);
    const worker = await createWorker("eng", 1, {
      workerPath: "/ocr/worker.min.js",
      corePath: "/ocr/core",
      langPath: "/ocr/lang",
      workerBlobURL: false,
      cacheMethod: "none",
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text") onProgress("reading", m.progress);
        else onProgress("loading", m.progress);
      },
    });
    terminate = () => worker.terminate();
    if (cancelled) {
      await worker.terminate();
      throw new DOMException("Cancelled", "AbortError");
    }
    try {
      const { data } = await worker.recognize(image);
      return cleanOcrText(data.text);
    } finally {
      await worker.terminate();
    }
  })();

  return {
    promise,
    cancel: () => {
      cancelled = true;
      void terminate?.();
    },
  };
}
