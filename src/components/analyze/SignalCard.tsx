"use client";

import { ChevronDown, Quote, ShieldCheck } from "lucide-react";
import type { Signal } from "@/lib/analysis";
import { Badge, cn } from "../ui/primitives";
import { KIND_ICON, KIND_LABEL, SEVERITY_LABEL, SEVERITY_TILE, SEVERITY_TONE } from "./meta";

export function SignalCard({
  signal,
  expanded,
  onToggle,
  onEvidence,
}: {
  signal: Signal;
  expanded: boolean;
  onToggle: () => void;
  onEvidence: (start: number) => void;
}) {
  const Icon = KIND_ICON[signal.kind];
  const panelId = `signal-panel-${signal.id}`;

  return (
    <li id={`signal-${signal.id}`} className={cn("rounded-xl border bg-surface transition-[border-color,box-shadow]", expanded ? "border-line-strong shadow-[var(--shadow-card)]" : "border-line")}>
      <h3>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left hover:bg-sunken/60"
        >
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", SEVERITY_TILE[signal.severity])}>
            <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-ink">{signal.title}</span>
            <span className="block text-xs text-ink-subtle">{KIND_LABEL[signal.kind]}</span>
          </span>
          <Badge tone={SEVERITY_TONE[signal.severity]}>{SEVERITY_LABEL[signal.severity]}</Badge>
          <ChevronDown aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200", expanded && "rotate-180")} />
        </button>
      </h3>
      <div id={panelId} hidden={!expanded} className="px-3.5 pb-4">
        <div className="ml-12 space-y-3 animate-fade-in">
          <p className="text-[13.5px] leading-relaxed text-ink-muted">{signal.explanation}</p>
          {signal.evidence.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-ink-subtle">Found in your message (tap to locate)</p>
              <ul className="flex flex-wrap gap-1.5">
                {signal.evidence.map((e) => (
                  <li key={e.start}>
                    <button
                      type="button"
                      onClick={() => onEvidence(e.start)}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-sunken px-2 py-1 text-left text-[12.5px] text-ink hover:border-brand-200 hover:bg-brand-50"
                    >
                      <Quote aria-hidden="true" className="h-3 w-3 shrink-0 text-ink-subtle" />
                      <span className="truncate [max-width:22ch] sm:[max-width:36ch]">{e.text.trim()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="flex gap-2 rounded-lg bg-mint-50 px-3 py-2 text-[13px] leading-relaxed text-mint-700">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{signal.recommendation}</span>
          </p>
        </div>
      </div>
    </li>
  );
}
