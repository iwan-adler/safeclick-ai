"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readImageText, validateImage, type OcrJob, type OcrStage } from "@/lib/ocr";

export type ReaderState =
  | { status: "idle" }
  | { status: "reading"; stage: OcrStage; progress: number; previewUrl: string }
  | { status: "done"; previewUrl: string; empty: boolean }
  | { status: "error"; message: string };

/**
 * Manages one screenshot-to-text job. The preview is a local object URL that
 * is revoked when replaced or cleared; the image itself is never uploaded.
 */
export function useScreenshotReader(onText: (text: string) => void) {
  const [state, setState] = useState<ReaderState>({ status: "idle" });
  const job = useRef<OcrJob | null>(null);
  const preview = useRef<string | null>(null);

  const releasePreview = () => {
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = null;
  };

  useEffect(
    () => () => {
      job.current?.cancel();
      releasePreview();
    },
    [],
  );

  const read = useCallback(
    async (file: File) => {
      const invalid = validateImage(file);
      if (invalid) {
        setState({ status: "error", message: invalid });
        return;
      }
      job.current?.cancel();
      releasePreview();
      const previewUrl = URL.createObjectURL(file);
      preview.current = previewUrl;
      setState({ status: "reading", stage: "loading", progress: 0, previewUrl });

      const current = readImageText(file, (stage, progress) =>
        setState((s) => (s.status === "reading" ? { ...s, stage, progress } : s)),
      );
      job.current = current;
      try {
        const text = await current.promise;
        if (job.current !== current) return;
        onText(text);
        setState({ status: "done", previewUrl, empty: text.length === 0 });
      } catch (err) {
        if (job.current !== current || (err instanceof DOMException && err.name === "AbortError")) return;
        setState({
          status: "error",
          message: "We couldn't read text from that image. Try a clearer screenshot, or paste the text instead.",
        });
      } finally {
        if (job.current === current) job.current = null;
      }
    },
    [onText],
  );

  const reset = useCallback(() => {
    job.current?.cancel();
    job.current = null;
    releasePreview();
    setState({ status: "idle" });
  }, []);

  return useMemo(() => ({ state, read, reset }), [state, read, reset]);
}
