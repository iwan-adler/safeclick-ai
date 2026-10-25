"use client";

import {
  Banknote,
  Check,
  ChevronDown,
  CloudOff,
  Download,
  KeyRound,
  LifeBuoy,
  MessageSquareWarning,
  RotateCcw,
  Siren,
  Smartphone,
  UserLock,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { downloadText } from "@/lib/clipboard";
import { GUIDE_SECTIONS, type GuideIcon, type GuideSection } from "@/lib/data/guide";
import { CopyButton } from "../ui/CopyButton";
import { Button, cn, PageHeader, Progress } from "../ui/primitives";

const ICONS: Record<GuideIcon, LucideIcon> = {
  message: MessageSquareWarning,
  "user-lock": UserLock,
  key: KeyRound,
  banknote: Banknote,
  smartphone: Smartphone,
  "life-buoy": LifeBuoy,
};

type OfflineStatus = "checking" | "ready" | "unavailable";

/** Reports whether this page is actually in the service worker cache. */
function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>("checking");
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const hit = "caches" in window ? await caches.match("/guide") : undefined;
        if (!cancelled) setStatus(hit ? "ready" : "unavailable");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    };
    check();
    if ("serviceWorker" in navigator) navigator.serviceWorker.ready.then(check).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return status;
}

function checklistText(section: GuideSection, done: Set<string>): string {
  return [
    `SafeClick AI: ${section.title} checklist`,
    "",
    ...section.checklist.map((item) => `[${done.has(item) ? "x" : " "}] ${item}`),
    "",
    "General guidance only. Contact your bank or local authorities through official channels for help.",
  ].join("\n");
}

function Steps({ section }: { section: GuideSection }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  return (
    <ol className="space-y-2">
      {section.steps.map((step, i) => {
        const expanded = open.has(i);
        const id = `${section.id}-step-${i}`;
        return (
          <li key={step.title} className="rounded-xl border border-line bg-surface">
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={id}
                onClick={() =>
                  setOpen((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-sunken/60"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                  {i + 1}
                </span>
                <span className="flex-1 text-[14px] font-medium text-ink">{step.title}</span>
                <ChevronDown aria-hidden="true" className={cn("h-4 w-4 text-ink-subtle transition-transform", expanded && "rotate-180")} />
              </button>
            </h3>
            <p id={id} hidden={!expanded} className="px-4 pb-4 pl-[52px] text-[13.5px] leading-relaxed text-ink-muted animate-fade-in">
              {step.detail}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Checklist({ section }: { section: GuideSection }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const count = section.checklist.filter((c) => done.has(c)).length;
  return (
    <section aria-labelledby={`${section.id}-checklist`} className="card p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id={`${section.id}-checklist`} className="text-[15px] font-semibold text-ink">
          Checklist
        </h3>
        <span className="text-xs tabular-nums text-ink-subtle" aria-live="polite">
          {count} / {section.checklist.length}
        </span>
      </div>
      <div className="mt-3">
        <Progress value={count} max={section.checklist.length} label={`${section.title} checklist progress`} tone="mint" />
      </div>
      <ul className="mt-3 space-y-0.5">
        {section.checklist.map((item) => {
          const checked = done.has(item);
          return (
            <li key={item}>
              <label className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-sunken/70">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked}
                  onChange={() =>
                    setDone((prev) => {
                      const next = new Set(prev);
                      if (next.has(item)) next.delete(item);
                      else next.add(item);
                      return next;
                    })
                  }
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2",
                    checked ? "border-mint-500 bg-mint-500 text-white" : "border-line-strong bg-surface group-hover:border-ink-subtle",
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5 animate-pop" strokeWidth={3} />}
                </span>
                <span className={cn("text-[13.5px] leading-relaxed", checked ? "text-ink-subtle line-through decoration-line-strong" : "text-ink")}>
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <CopyButton label="Copy" getText={() => checklistText(section, done)} />
        <Button size="sm" onClick={() => downloadText(`safeclick-${section.id}-checklist.txt`, checklistText(section, done))}>
          <Download aria-hidden="true" className="h-4 w-4" />
          Download .txt
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDone(new Set())} disabled={count === 0}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Reset
        </Button>
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-subtle">Ticks are kept only while this tab is open and are not saved.</p>
    </section>
  );
}

export function GuideView() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const offline = useOfflineStatus();
  const section = GUIDE_SECTIONS[active];
  const Icon = ICONS[section.icon];

  // WAI-ARIA tabs pattern: arrow keys move between tabs.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = GUIDE_SECTIONS.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? active === last ? 0 : active + 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? active === 0 ? last : active - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Safety guide"
        title="Know what to do next."
        subtitle="Practical steps for common situations. Keep this page handy: once loaded, it can be used without a connection."
        aside={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset sm:self-auto",
              offline === "ready" ? "bg-mint-50 text-mint-700 ring-mint-100" : "bg-sunken text-ink-muted ring-line",
            )}
          >
            <CloudOff aria-hidden="true" className="h-3.5 w-3.5" />
            {offline === "ready" ? "Saved for offline use" : offline === "checking" ? "Checking offline copy…" : "Offline copy not saved yet"}
          </span>
        }
      />

      <div className="mb-5 flex gap-3 rounded-[var(--radius-card)] border border-coral-100 bg-coral-50 p-4 text-[13.5px] leading-relaxed text-coral-700">
        <Siren aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <span className="font-semibold">In immediate danger?</span> Contact your local emergency number now. For fraud,
          call your bank using the number on your card or in its official app, never one from a suspicious message.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
        <div
          role="tablist"
          aria-label="Guide topics"
          aria-orientation="vertical"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
        >
          {GUIDE_SECTIONS.map((s, i) => {
            const TabIcon = ICONS[s.icon];
            const selected = i === active;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`tab-${s.id}`}
                type="button"
                aria-selected={selected}
                aria-controls={`panel-${s.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={onKeyDown}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors",
                  selected ? "bg-surface text-ink shadow-[var(--shadow-card)] ring-1 ring-line" : "text-ink-muted hover:bg-surface/70 hover:text-ink",
                )}
              >
                <TabIcon aria-hidden="true" className={cn("h-4 w-4", selected ? "text-brand-600" : "text-ink-subtle")} />
                <span className="lg:hidden">{s.short}</span>
                <span className="hidden lg:inline">{s.title}</span>
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`panel-${section.id}`} aria-labelledby={`tab-${section.id}`} key={section.id} className="animate-fade-in">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">{section.title}</h2>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{section.intro}</p>
            </div>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Steps section={section} />
            <Checklist section={section} />
          </div>
        </div>
      </div>
    </div>
  );
}
