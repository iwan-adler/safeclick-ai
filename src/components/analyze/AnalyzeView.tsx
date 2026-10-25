"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SAFETY_TIPS } from "@/lib/data/tips";
import { LocalBadge } from "../shell/LocalBadge";
import { PageHeader } from "../ui/primitives";
import { useAnalyzer } from "./AnalyzerProvider";
import { MessageInput } from "./MessageInput";
import { ResultsPanel } from "./ResultsPanel";
import { ShareReceiver } from "./ShareReceiver";

function SafetyTip() {
  const [index, setIndex] = useState(0);
  return (
    <aside aria-labelledby="tip-title" className="rounded-[var(--radius-card)] border border-lavender-100 bg-lavender-50/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="tip-title" className="flex items-center gap-2 text-[13px] font-semibold text-lavender-700">
          <Lightbulb aria-hidden="true" className="h-4 w-4" />
          Safety tip {index + 1} of {SAFETY_TIPS.length}
        </h2>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % SAFETY_TIPS.length)}
          className="rounded-md px-2 py-1 text-xs font-medium text-lavender-700 hover:bg-lavender-100"
        >
          Next tip
        </button>
      </div>
      <p key={index} className="mt-2 text-[14px] leading-relaxed text-ink animate-fade-in" aria-live="polite">
        {SAFETY_TIPS[index]}
      </p>
    </aside>
  );
}

function HowItWorks() {
  const steps = ["Paste a message or add a screenshot", "Rules and a small model check it on your device", "Review signs and next steps"];
  return (
    <div className="card p-5">
      <h2 className="text-[13px] font-semibold text-ink">How it works</h2>
      <ol className="mt-3 space-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-[13px] text-ink-muted">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
      <Link href="/privacy" className="mt-4 inline-flex items-center gap-1 rounded text-[13px] font-medium text-brand-700 hover:text-brand-600">
        Privacy &amp; limitations <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function AnalyzeView() {
  const { status, runId, clear } = useAnalyzer();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const lastRun = useRef(runId);

  // On narrow screens the results are below the input, so bring them into view.
  useEffect(() => {
    if (status !== "done" || runId === lastRun.current) return;
    lastRun.current = runId;
    if (window.matchMedia("(max-width: 1279px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }, [status, runId]);

  const analyzeAnother = () => {
    clear();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    inputRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Message check"
        title="Think before you click."
        subtitle="Understand suspicious messages and choose a safer next step."
        aside={
          <div className="lg:hidden">
            <LocalBadge variant="light" />
          </div>
        }
      />
      <ShareReceiver />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] xl:gap-6">
        <div className="space-y-5">
          <MessageInput ref={inputRef} />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <SafetyTip />
            <HowItWorks />
          </div>
        </div>
        <div ref={resultsRef} className="scroll-mt-20" aria-busy={status === "scanning"}>
          <ResultsPanel onAnalyzeAnother={analyzeAnother} />
        </div>
      </div>
    </div>
  );
}
