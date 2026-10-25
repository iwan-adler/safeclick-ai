"use client";

import { CircleAlert, CircleCheck, LoaderCircle, X } from "lucide-react";
import type { ReaderState } from "./useScreenshotReader";
import { Button, Progress } from "../ui/primitives";

export function ScreenshotStatus({ state, onDismiss }: { state: ReaderState; onDismiss: () => void }) {
  if (state.status === "idle") return null;

  if (state.status === "error") {
    return (
      <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-xl bg-coral-50 px-3.5 py-3 text-[13px] text-coral-700">
        <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="flex-1">{state.message}</p>
        <button type="button" onClick={onDismiss} className="rounded p-0.5 hover:bg-coral-100">
          <X aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      </div>
    );
  }

  const thumb = (
    // eslint-disable-next-line @next/next/no-img-element -- local object URL, not an optimizable remote image
    <img src={state.previewUrl} alt="Your screenshot" className="h-14 w-14 shrink-0 rounded-lg object-cover object-top ring-1 ring-line" />
  );

  if (state.status === "reading") {
    const pct = Math.round(state.progress * 100);
    return (
      <div role="status" className="mt-3 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3 animate-fade-in">
        {thumb}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
            <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin text-brand-600" />
            {state.stage === "loading" ? "Preparing the text reader…" : `Reading text from your screenshot… ${pct}%`}
          </p>
          <div className="mt-2">
            <Progress value={state.stage === "loading" ? 0 : pct} max={100} label="Screenshot reading progress" />
          </div>
          <p className="mt-1.5 text-[11.5px] text-ink-subtle">
            Runs on this device. The first time, about 7 MB of reader files load from SafeClick.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={
        "mt-3 flex items-center gap-3 rounded-xl p-3 animate-fade-in " +
        (state.empty ? "bg-amber-50 text-amber-700" : "bg-mint-50 text-mint-700")
      }
    >
      {thumb}
      <p className="flex-1 text-[13px] leading-relaxed">
        {state.empty ? (
          "No readable text was found in that image. Try a sharper screenshot or paste the text."
        ) : (
          <>
            <CircleCheck aria-hidden="true" className="mr-1 inline h-4 w-4 align-[-3px]" />
            Text added from your screenshot. Reading can make mistakes, so check it before you analyze.
          </>
        )}
      </p>
      <button type="button" onClick={onDismiss} className="rounded p-0.5 hover:bg-black/5">
        <X aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}
