"use client";

import { useEffect, useMemo, useRef } from "react";
import { segmentMessage, type Severity, type Signal } from "@/lib/analysis";
import { cn } from "../ui/primitives";
import { SEVERITY_MARK } from "./meta";

const RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

export interface FlashTarget {
  start: number;
  /** Changes on every request so repeated clicks re-trigger the flash. */
  nonce: number;
}

/**
 * Shows the analyzed message with evidence highlighted. Content is rendered
 * as React text nodes, never as HTML, so pasted markup is displayed inertly.
 */
export function AnnotatedMessage({
  text,
  signals,
  flash,
  onSelectSignal,
}: {
  text: string;
  signals: Signal[];
  flash: FlashTarget | null;
  onSelectSignal: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segments = useMemo(() => segmentMessage(text, signals), [text, signals]);
  const byId = useMemo(() => new Map(signals.map((s) => [s.id, s])), [signals]);

  useEffect(() => {
    if (!flash || !containerRef.current) return;
    // Find the highlight that contains the requested offset.
    const marks = [...containerRef.current.querySelectorAll<HTMLElement>("[data-start]")];
    const target = marks.filter((m) => Number(m.dataset.start) <= flash.start).pop();
    if (!target) return;
    target.scrollIntoView({ block: "nearest", behavior: "smooth" });
    target.classList.remove("animate-flash");
    // Force a reflow so the animation restarts on repeated clicks.
    void target.offsetWidth;
    target.classList.add("animate-flash");
  }, [flash]);

  return (
    <div
      ref={containerRef}
      className="max-h-72 overflow-y-auto rounded-xl border border-line bg-sunken/50 px-4 py-3.5 text-[14px] leading-7 text-ink [overflow-wrap:anywhere] whitespace-pre-wrap"
    >
      {segments.map((seg) => {
        if (seg.signalIds.length === 0) return <span key={seg.start}>{seg.text}</span>;
        const covering = seg.signalIds.map((id) => byId.get(id)).filter((s) => s !== undefined);
        const top = covering.reduce((a, b) => (RANK[b.severity] > RANK[a.severity] ? b : a));
        return (
          <button
            key={seg.start}
            type="button"
            data-start={seg.start}
            onClick={() => onSelectSignal(top.id)}
            title={covering.map((s) => s.title).join(" · ")}
            aria-label={`${seg.text}. Warning: ${covering.map((s) => s.title).join(", ")}. Show explanation.`}
            className={cn(
              "inline rounded-[4px] px-0.5 text-left underline decoration-2 underline-offset-[3px] transition-[filter] hover:brightness-95",
              SEVERITY_MARK[top.severity],
            )}
          >
            {seg.text}
          </button>
        );
      })}
    </div>
  );
}
