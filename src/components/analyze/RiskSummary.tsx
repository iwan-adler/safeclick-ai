"use client";

import { BrainCircuit, ChevronDown, Info } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { LEVEL_COPY, LEVEL_THRESHOLDS, type AnalysisResult } from "@/lib/analysis";
import { Badge, cn } from "../ui/primitives";
import { LEVEL_STYLE } from "./meta";

const R = 52;
const ARC = Math.PI * R;

function Gauge({ score, color }: { score: number; color: string }) {
  // Start empty and animate to the score after mount (CSS transition).
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  return (
    <div className="relative h-[84px] w-[148px] shrink-0" aria-hidden="true">
      <svg viewBox="0 0 128 72" className="h-full w-full overflow-visible">
        <path d={`M ${64 - R} 64 A ${R} ${R} 0 0 1 ${64 + R} 64`} fill="none" stroke="#eef0f5" strokeWidth="10" strokeLinecap="round" />
        <path
          d={`M ${64 - R} 64 A ${R} ${R} 0 0 1 ${64 + R} 64`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={ARC}
          strokeDashoffset={ARC * (1 - shown / 100)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2, 0.7, 0.2, 1)" }}
        />
        {[LEVEL_THRESHOLDS.caution, LEVEL_THRESHOLDS.high].map((t) => {
          const a = Math.PI * (1 - t / 100);
          return (
            <line
              key={t}
              x1={64 + (R - 8) * Math.cos(a)}
              y1={64 - (R - 8) * Math.sin(a)}
              x2={64 + (R - 13) * Math.cos(a)}
              y2={64 - (R - 13) * Math.sin(a)}
              stroke="#cdd4e1"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-[28px] font-semibold leading-none tracking-tight text-ink tabular-nums">{score}</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-subtle">of 100</span>
      </div>
    </div>
  );
}

function Scale({ score }: { score: number }) {
  return (
    <div className="mt-4">
      <div className="relative flex h-2 overflow-hidden rounded-full">
        <span className="bg-mint-200" style={{ width: `${LEVEL_THRESHOLDS.caution}%` }} />
        <span className="bg-amber-200" style={{ width: `${LEVEL_THRESHOLDS.high - LEVEL_THRESHOLDS.caution}%` }} />
        <span className="flex-1 bg-coral-200" />
      </div>
      <div className="relative h-0">
        <span
          className="absolute -top-[13px] h-[14px] w-[3px] -translate-x-1/2 rounded-full bg-navy-900 ring-2 ring-white transition-[left] duration-700"
          style={{ left: `${Math.min(99, Math.max(1, score))}%` }}
        />
      </div>
      <div className="mt-2 flex text-[11px] text-ink-subtle">
        <span style={{ width: `${LEVEL_THRESHOLDS.caution}%` }}>Lower</span>
        <span style={{ width: `${LEVEL_THRESHOLDS.high - LEVEL_THRESHOLDS.caution}%` }}>Caution</span>
        <span>High concern</span>
      </div>
    </div>
  );
}

export function RiskSummary({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const style = LEVEL_STYLE[result.level];
  const copy = LEVEL_COPY[result.level];
  const strong = result.signals.filter((s) => s.severity === "high").length;

  return (
    <section aria-labelledby={`${panelId}-title`} className="card overflow-hidden">
      <div className={cn("h-1", { lower: "bg-mint-500", caution: "bg-amber-500", high: "bg-coral-500" }[result.level])} />
      <div className="p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Gauge score={result.score} color={style.stroke} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={style.tone}>Heuristic result</Badge>
              <span className="text-xs text-ink-subtle">
                {result.signals.length === 0
                  ? "No warning signs found"
                  : `${result.signals.length} warning sign${result.signals.length === 1 ? "" : "s"}${strong ? `, ${strong} strong` : ""}`}
              </span>
            </div>
            <h2 id={`${panelId}-title`} className={cn("mt-2 text-xl font-semibold tracking-tight", style.text)}>
              {copy.label}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{copy.summary}</p>
          </div>
        </div>

        <Scale score={result.score} />

        {result.model && (
          <p className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-muted">
            <BrainCircuit aria-hidden="true" className="h-4 w-4 shrink-0 text-lavender-700" />
            <span>
              On-device pattern model:{" "}
              <strong className="font-semibold text-ink tabular-nums">{Math.round(result.model.probability * 100)}%</strong>{" "}
              resemblance to known scam messages
              {result.model.band === "low" ? " (below its warning threshold)" : ""}.
            </span>
          </p>
        )}

        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="mt-4 flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-[13px] font-medium text-brand-700 hover:text-brand-600"
        >
          What does this score mean?
          <ChevronDown aria-hidden="true" className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
        <div id={panelId} hidden={!open} className="mt-2 space-y-2 rounded-xl bg-sunken p-4 text-[13px] leading-relaxed text-ink-muted">
          <p>
            The score adds up the warning patterns found in the text, plus the on-device model when it recognizes a scam-like
            message. Stronger patterns (like asking for a code) count more than weaker ones (like a generic greeting). Patterns describing the same tactic are not counted twice, and some
            combinations that are typical of scams add a small, fixed amount.
          </p>
          <p>
            Below {LEVEL_THRESHOLDS.caution} is <strong className="text-ink">lower apparent risk</strong>,{" "}
            {LEVEL_THRESHOLDS.caution}–{LEVEL_THRESHOLDS.high - 1} <strong className="text-ink">needs caution</strong>, and{" "}
            {LEVEL_THRESHOLDS.high}+ is <strong className="text-ink">high concern</strong>.
          </p>
          {result.combinations.length > 0 && (
            <div>
              <p className="font-medium text-ink">Combinations found in this message:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {result.combinations.map((c) => (
                  <li key={c.id}>
                    {c.label} <span className="text-ink-subtle">(+{c.bonus})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-4 flex gap-2 rounded-xl border border-lavender-100 bg-lavender-50 px-3.5 py-3 text-[13px] leading-relaxed text-lavender-700">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This is a rule-based estimate, not a probability of fraud. A low score is not a guarantee of safety, and a high
            score is not proof of a scam. SafeClick cannot verify who sent a message.
          </span>
        </p>
      </div>
    </section>
  );
}
