"use client";

import Link from "next/link";
import { ArrowRight, Eraser, ImagePlus, Lock, MessageSquare, MessagesSquare, ScanSearch } from "lucide-react";
import { forwardRef, useId, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/ocr";
import { MAX_MESSAGE_LENGTH, type AnalysisMode } from "@/lib/analysis";
import { EXAMPLES } from "@/lib/data/examples";
import { Button, cn } from "../ui/primitives";
import { useAnalyzer } from "./AnalyzerProvider";
import { ScreenshotStatus } from "./ScreenshotStatus";

const QUICK_SAMPLES = ["bank-otp", "parcel-fee", "internship-fee", "wrong-number-investment", "dentist-reminder"]
  .map((id) => EXAMPLES.find((e) => e.id === id))
  .filter((e) => e !== undefined);

const MODES: { value: AnalysisMode; label: string; icon: typeof MessageSquare }[] = [
  { value: "message", label: "Single message", icon: MessageSquare },
  { value: "conversation", label: "Conversation", icon: MessagesSquare },
];

const PLACEHOLDER: Record<AnalysisMode, string> = {
  message:
    "Paste the message you're unsure about. For example: “Your account will be suspended. Verify your details within 24 hours…”",
  conversation: [
    "Paste a chat thread, one message per line with the sender's name:",
    "Alex: Hi! Is this Sam?",
    "Me: No, wrong number",
    "Alex: Oh sorry! You seem so kind…",
  ].join("\n"),
};

export const MessageInput = forwardRef<HTMLTextAreaElement>(function MessageInput(_props, ref) {
  const { message, setMessage, mode, setMode, analyze, clear, status, outcome, screenshot } = useAnalyzer();
  const ids = { field: useId(), counter: useId(), hint: useId(), error: useId() };
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const reading = screenshot.state.status === "reading";

  const imageFrom = (files: FileList | null | undefined) =>
    files ? [...files].find((f) => f.type.startsWith("image/")) : undefined;

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const image = imageFrom(e.clipboardData.files);
    if (image) {
      e.preventDefault();
      void screenshot.read(image);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    setDragging(false);
    const image = imageFrom(e.dataTransfer.files);
    if (image) {
      e.preventDefault();
      void screenshot.read(image);
    }
  };

  const length = message.length;
  const tooLong = length > MAX_MESSAGE_LENGTH;
  const nearLimit = !tooLong && length > MAX_MESSAGE_LENGTH * 0.9;
  const empty = message.trim().length === 0;
  const scanning = status === "scanning";
  const error = outcome && !outcome.ok ? outcome.message : tooLong ? `Messages can be up to ${MAX_MESSAGE_LENGTH.toLocaleString("en-US")} characters.` : null;

  const submit = () => {
    if (!empty && !tooLong && !scanning) analyze(message);
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <label htmlFor={ids.field} className="text-[15px] font-semibold text-ink">
          Message to check
        </label>
        <div role="group" aria-label="What are you checking?" className="flex rounded-lg bg-sunken p-0.5">
          {MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors",
                mode === value ? "bg-surface text-ink shadow-[var(--shadow-card)]" : "text-ink-subtle hover:text-ink",
              )}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-3">
        <div
          onDragOver={(e) => {
            if ([...e.dataTransfer.types].includes("Files")) {
              e.preventDefault();
              setDragging(true);
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "rounded-xl border bg-surface transition-[border-color,box-shadow] duration-150 focus-within:shadow-[var(--shadow-focus)]",
            error ? "border-coral-200 focus-within:border-coral-500" : "border-line focus-within:border-brand-500",
            dragging && "border-brand-500 bg-brand-50/40 shadow-[var(--shadow-focus)]",
          )}
        >
          <textarea
            ref={ref}
            id={ids.field}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onPaste={onPaste}
            readOnly={reading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={8}
            spellCheck={false}
            autoComplete="off"
            placeholder={PLACEHOLDER[mode]}
            aria-describedby={`${ids.hint} ${ids.counter}${error ? ` ${ids.error}` : ""}`}
            aria-invalid={Boolean(error) || undefined}
            className="block min-h-[188px] w-full resize-y rounded-xl bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-subtle/80 focus-visible:outline-none"
          />
          <div className="flex items-center justify-between gap-2 border-t border-line/70 py-1.5 pl-2 pr-4 text-xs">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const image = imageFrom(e.target.files);
                if (image) void screenshot.read(image);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={reading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] font-medium text-brand-700 hover:bg-brand-50 disabled:text-ink-subtle"
            >
              <ImagePlus aria-hidden="true" className="h-4 w-4" />
              Check a screenshot
            </button>
            <span id={ids.hint} className="hidden text-ink-subtle xl:inline">
              <kbd className="rounded border border-line bg-sunken px-1 font-sans text-[11px]">Ctrl</kbd> +{" "}
              <kbd className="rounded border border-line bg-sunken px-1 font-sans text-[11px]">Enter</kbd> to analyze
            </span>
            <span
              id={ids.counter}
              className={cn(
                "ml-auto tabular-nums",
                tooLong ? "font-medium text-coral-700" : nearLimit ? "text-amber-700" : "text-ink-subtle",
              )}
            >
              {length.toLocaleString("en-US")} / {MAX_MESSAGE_LENGTH.toLocaleString("en-US")}
              <span className="sr-only"> characters</span>
            </span>
          </div>
        </div>
        <ScreenshotStatus state={screenshot.state} onDismiss={screenshot.reset} />
        {error && (
          <p id={ids.error} role="alert" className="mt-2 text-sm text-coral-700">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 px-5 pb-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-ink-subtle sm:max-w-[45%]">
          <Lock aria-hidden="true" className="h-3.5 w-3.5 text-mint-700" />
          Text and screenshots are checked on this device. Nothing is uploaded.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="danger-ghost" onClick={clear} disabled={empty && !outcome}>
            <Eraser aria-hidden="true" className="h-4 w-4" />
            Clear
          </Button>
          <Button variant="primary" size="md" onClick={submit} disabled={empty || tooLong || scanning || reading} className="min-w-[132px] flex-1 sm:flex-none">
            <ScanSearch aria-hidden="true" className={cn("h-4 w-4", scanning && "animate-pulse")} />
            {scanning ? "Checking…" : "Analyze"}
          </Button>
        </div>
      </div>

      <div className="border-t border-line bg-sunken/60 px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-medium text-ink-muted">Try a fictional example</p>
          <Link href="/examples" className="inline-flex items-center gap-1 rounded text-xs font-medium text-brand-700 hover:text-brand-600">
            All examples <ArrowRight aria-hidden="true" className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setMessage(sample.message);
                setMode(sample.mode ?? "message");
              }}
              aria-pressed={message === sample.message}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
                message === sample.message
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});
