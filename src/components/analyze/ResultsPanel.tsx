"use client";

import Link from "next/link";
import { Banknote, CircleCheck, Clock, KeyRound, Link2, RefreshCw, RotateCcw, ScanSearch, Siren } from "lucide-react";
import { useCallback, useState } from "react";
import { buildSummaryText, LEVEL_COPY, type AnalysisResult } from "@/lib/analysis";
import { CopyButton } from "../ui/CopyButton";
import { Button, buttonClass } from "../ui/primitives";
import { ActionChecklist } from "./ActionChecklist";
import { useAnalyzer } from "./AnalyzerProvider";
import { AnnotatedMessage, type FlashTarget } from "./AnnotatedMessage";
import { ConversationTimeline } from "./ConversationTimeline";
import { LinkReport } from "./LinkReport";
import { RiskSummary } from "./RiskSummary";
import { SignalCard } from "./SignalCard";
import { WarningCardButton } from "./WarningCard";

const LOOKS_FOR = [
  { icon: Clock, label: "Pressure and deadlines" },
  { icon: KeyRound, label: "Requests for codes or passwords" },
  { icon: Banknote, label: "Unusual payment requests" },
  { icon: Link2, label: "Deceptive links" },
];

function EmptyState() {
  return (
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <div aria-hidden="true" className="dot-grid absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
      <div className="relative">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
          <ScanSearch aria-hidden="true" className="h-6 w-6" />
        </div>
        <h2 className="text-center text-base font-semibold text-ink">Your analysis will appear here</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-center text-sm leading-relaxed text-ink-muted">
          Paste a message or pick an example. You&apos;ll see each warning sign, why it matters, and what to do next.
        </p>
        <ul className="mx-auto mt-6 grid max-w-md gap-2 sm:grid-cols-2">
          {LOOKS_FOR.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/80 px-3 py-2.5 text-[13px] text-ink-muted">
              <Icon aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScanningState() {
  return (
    <div className="card p-6" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-brand-50 ring-1 ring-inset ring-brand-100">
          <ScanSearch aria-hidden="true" className="absolute inset-0 m-auto h-5 w-5 text-brand-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Checking warning patterns…</p>
          <p className="text-xs text-ink-subtle">Running locally in your browser</p>
        </div>
      </div>
      <div className="mt-5 space-y-2.5" aria-hidden="true">
        {[92, 76, 84].map((w) => (
          <div key={w} className="relative h-3 overflow-hidden rounded-full bg-sunken" style={{ width: `${w}%` }}>
            <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-brand-100 to-transparent animate-scan" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultView({ result, text, onAnalyzeAnother }: { result: AnalysisResult; text: string; onAnalyzeAnother: () => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(result.signals.slice(0, 1).map((s) => s.id)));
  const [flash, setFlash] = useState<FlashTarget | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectSignal = useCallback((id: string) => {
    setExpanded((prev) => new Set(prev).add(id));
    requestAnimationFrame(() =>
      document.getElementById(`signal-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  }, []);

  const allOpen = result.signals.length > 0 && result.signals.every((s) => expanded.has(s.id));

  return (
    <div className="space-y-4 animate-fade-up">
      <RiskSummary result={result} />

      <div className="flex flex-wrap gap-2">
        <CopyButton label="Copy summary" getText={() => buildSummaryText(result)} />
        <Button size="sm" variant="ghost" onClick={onAnalyzeAnother}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Check another message
        </Button>
        <WarningCardButton result={result} message={text} />
        {result.level !== "lower" && (
          <Link href="/help" className={buttonClass("ghost", "sm", "text-coral-700 hover:bg-coral-50 hover:text-coral-700")}>
            <Siren aria-hidden="true" className="h-4 w-4" />
            I already responded
          </Link>
        )}
      </div>

      {result.conversation && (
        <ConversationTimeline text={text} info={result.conversation} signals={result.signals} onSelectSignal={selectSignal} />
      )}

      <section aria-labelledby="annotated-title" className="card p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="annotated-title" className="text-[15px] font-semibold text-ink">
            Your message, annotated
          </h2>
          {result.signals.length > 0 && <span className="text-xs text-ink-subtle">Tap a highlight to see why</span>}
        </div>
        <AnnotatedMessage text={text} signals={result.signals} flash={flash} onSelectSignal={selectSignal} />
      </section>

      <section aria-labelledby="signals-title" className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="signals-title" className="text-[15px] font-semibold text-ink">
            Warning signs <span className="font-normal text-ink-subtle">({result.signals.length})</span>
          </h2>
          {result.signals.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(allOpen ? new Set() : new Set(result.signals.map((s) => s.id)))}
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
          )}
        </div>
        {result.signals.length === 0 ? (
          <div className="flex gap-3 rounded-xl bg-mint-50 p-4 text-[13.5px] leading-relaxed text-mint-700">
            <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <span className="font-medium">No common warning patterns found.</span> That&apos;s a good sign, but it is not
              a guarantee. Scams can be written to avoid these patterns, so stay alert to anything unexpected.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {result.signals.map((s) => (
              <SignalCard
                key={s.id}
                signal={s}
                expanded={expanded.has(s.id)}
                onToggle={() => toggle(s.id)}
                onEvidence={(start) => setFlash({ start, nonce: Date.now() })}
              />
            ))}
          </ul>
        )}
      </section>

      <LinkReport urls={result.urls} />
      <ActionChecklist actions={result.recommendations} />
    </div>
  );
}

export function ResultsPanel({ onAnalyzeAnother }: { onAnalyzeAnother: () => void }) {
  const { outcome, status, runId, analyzedText, message, mode, analyze } = useAnalyzer();

  if (status === "scanning") return <ScanningState />;
  if (!outcome || !outcome.ok) return <EmptyState />;

  const stale = message !== analyzedText || mode !== outcome.mode;
  return (
    <div className="space-y-4">
      <p className="sr-only" role="status">
        Analysis complete: {LEVEL_COPY[outcome.level].label}, {outcome.signals.length} warning signs.
      </p>
      {stale && (
        <div className="flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[13px] text-brand-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{message !== analyzedText ? "The message has changed since this analysis." : "You switched mode since this analysis."}</span>
          <Button size="sm" variant="primary" onClick={() => analyze(message)} disabled={!message.trim()}>
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Re-analyze
          </Button>
        </div>
      )}
      <ResultView key={runId} result={outcome} text={analyzedText} onAnalyzeAnother={onAnalyzeAnother} />
    </div>
  );
}
