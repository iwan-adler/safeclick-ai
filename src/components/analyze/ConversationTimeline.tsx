"use client";

import { Info, TrendingUp } from "lucide-react";
import type { ConversationInfo, Signal } from "@/lib/analysis";
import { cn } from "../ui/primitives";
import { KIND_ICON, KIND_LABEL } from "./meta";

const PREFIX = /^[ \t]*(?:\[[^\]\n]{1,25}\][ \t]*|\d{1,2}[:.]\d{2}(?:[ \t]*[ap]\.?m\.?)?[ \t]*[-–][ \t]*)?[^:\n]{1,32}:[ \t]+/i;

/**
 * Chat-style view of a pasted thread. Turns with warning signs show their
 * icons; the turn where a request follows a friendly build-up is marked.
 */
export function ConversationTimeline({
  text,
  info,
  signals,
  onSelectSignal,
}: {
  text: string;
  info: ConversationInfo;
  signals: Signal[];
  onSelectSignal: (id: string) => void;
}) {
  if (!info.parsed) {
    return (
      <section aria-labelledby="timeline-title" className="card p-5">
        <h2 id="timeline-title" className="text-[15px] font-semibold text-ink">
          Conversation timeline
        </h2>
        <p className="mt-2 flex gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-700">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            We couldn&apos;t find separate messages, so this was checked as one message. Put each message on its own line
            starting with the sender&apos;s name, for example <span className="font-mono">Alex: hi</span>, or separate
            messages with blank lines.
          </span>
        </p>
      </section>
    );
  }

  const firstSignalIn = (start: number, end: number) =>
    signals.find((s) => s.evidence.some((e) => e.start >= start && e.start < end));

  return (
    <section aria-labelledby="timeline-title" className="card p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="timeline-title" className="text-[15px] font-semibold text-ink">
          Conversation timeline <span className="font-normal text-ink-subtle">({info.turns.length} messages)</span>
        </h2>
        <span className="text-xs text-ink-subtle">Tap a flagged message</span>
      </div>

      {info.escalationTurn !== null && (
        <p className="mb-3 flex gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-[13px] leading-relaxed text-coral-700">
          <TrendingUp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Trust, then a request.</span> {info.turnsBeforeRequest} messages without any request came
            before the first request, in message {info.escalationTurn + 1}.
          </span>
        </p>
      )}

      <ol className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {info.turns.map((turn) => {
          const body = text.slice(turn.start, turn.end).replace(PREFIX, "").trim();
          const flagged = turn.kinds.length > 0;
          const isEscalation = turn.index === info.escalationTurn;
          const target = flagged ? firstSignalIn(turn.start, turn.end) : undefined;
          const content = (
            <>
              <span className="mb-0.5 flex items-center gap-2 text-[11px] font-medium text-ink-subtle">
                {turn.isUser ? "You" : (turn.speaker ?? `Message ${turn.index + 1}`)}
                {isEscalation && (
                  <span className="rounded bg-coral-100 px-1.5 py-px text-[10.5px] font-semibold text-coral-700">Request</span>
                )}
              </span>
              <span className="line-clamp-3 block text-[13px] leading-relaxed text-ink [overflow-wrap:anywhere]">{body}</span>
              {flagged && (
                <span className="mt-1.5 flex flex-wrap gap-1">
                  {turn.kinds.map((k) => {
                    const Icon = KIND_ICON[k];
                    return (
                      <span key={k} className="inline-flex items-center gap-1 rounded bg-surface/80 px-1.5 py-px text-[10.5px] text-ink-muted ring-1 ring-inset ring-line">
                        <Icon aria-hidden="true" className="h-3 w-3" />
                        {KIND_LABEL[k]}
                      </span>
                    );
                  })}
                </span>
              )}
            </>
          );
          const bubble = cn(
            "block max-w-[88%] rounded-2xl px-3.5 py-2.5 text-left",
            turn.isUser ? "ml-auto rounded-br-sm bg-brand-50" : "rounded-bl-sm bg-sunken",
            flagged && !isEscalation && "ring-1 ring-inset ring-amber-200",
            isEscalation && "bg-coral-50 ring-1 ring-inset ring-coral-200",
          );
          return (
            <li key={turn.index} className="flex">
              {target ? (
                <button type="button" onClick={() => onSelectSignal(target.id)} className={cn(bubble, "transition-[filter] hover:brightness-[0.97]")}>
                  {content}
                </button>
              ) : (
                <div className={bubble}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
