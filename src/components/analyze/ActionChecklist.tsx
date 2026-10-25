"use client";

import { Check, PartyPopper } from "lucide-react";
import { useState } from "react";
import type { RecommendedAction } from "@/lib/analysis";
import { cn, Progress } from "../ui/primitives";

export function ActionChecklist({ actions }: { actions: RecommendedAction[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const count = actions.filter((a) => done.has(a.id)).length;
  const complete = count === actions.length && actions.length > 0;

  return (
    <section aria-labelledby="actions-title" className="card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="actions-title" className="text-[15px] font-semibold text-ink">
          Recommended next steps
        </h2>
        <span className="text-xs tabular-nums text-ink-subtle" aria-live="polite">
          {count} of {actions.length} done
        </span>
      </div>
      <div className="mt-3">
        <Progress value={count} max={actions.length} label="Recommended steps completed" tone="mint" />
      </div>
      <ul className="mt-4 space-y-1">
        {actions.map((a) => {
          const checked = done.has(a.id);
          return (
            <li key={a.id}>
              <label className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-sunken/70">
                <input type="checkbox" checked={checked} onChange={() => toggle(a.id)} className="peer sr-only" />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2",
                    checked ? "border-mint-500 bg-mint-500 text-white" : "border-line-strong bg-surface group-hover:border-ink-subtle",
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5 animate-pop" strokeWidth={3} />}
                </span>
                <span className={cn("text-[13.5px] leading-relaxed transition-colors", checked ? "text-ink-subtle line-through decoration-line-strong" : "text-ink")}>
                  {a.text}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {complete && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-mint-50 px-3 py-2 text-[13px] text-mint-700 animate-fade-up" role="status">
          <PartyPopper aria-hidden="true" className="h-4 w-4" />
          Nicely done. Taking these steps is how you stay in control.
        </p>
      )}
    </section>
  );
}
