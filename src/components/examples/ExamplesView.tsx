"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Inbox, Mail, MessageCircle, MessageSquare, ScanSearch, Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { RULES } from "@/lib/analysis/rules";
import { EXAMPLE_CATEGORIES, EXAMPLES, type ExampleCategory, type ExampleMessage } from "@/lib/data/examples";
import { useAnalyzer } from "../analyze/AnalyzerProvider";
import { KIND_ICON } from "../analyze/meta";
import { Badge, Button, cn, PageHeader } from "../ui/primitives";

const CHANNEL_ICON = { SMS: MessageSquare, Email: Mail, Chat: MessageCircle } as const;

// Rule metadata for expected-signal chips (the link and hidden-character
// signals are produced outside RULES, so they are listed here explicitly).
const SIGNAL_INFO: Record<string, { title: string; kind: keyof typeof KIND_ICON }> = {
  ...Object.fromEntries(RULES.map((r) => [r.id, { title: r.title, kind: r.kind }])),
  "suspicious-link": { title: "Link has unusual characteristics", kind: "link" },
  "hidden-characters": { title: "Uses hidden or look-alike characters", kind: "obfuscation" },
  "trust-then-request": { title: "Builds trust first, then asks", kind: "escalation" },
};

function ExampleCard({ example, onAnalyze }: { example: ExampleMessage; onAnalyze: () => void }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const ChannelIcon = CHANNEL_ICON[example.channel];
  const benign = example.expectedSignals.length === 0;

  return (
    <li className="card flex flex-col p-5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{example.category}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-ink-subtle">
            <ChannelIcon aria-hidden="true" className="h-3.5 w-3.5" />
            {example.mode === "conversation" ? "Chat thread" : example.channel}
          </span>
        </div>
        <Badge tone="lavender">Fictional</Badge>
      </div>

      <h2 className="mt-3 text-[15px] font-semibold text-ink">{example.title}</h2>
      <blockquote className="mt-2 rounded-xl rounded-tl-sm bg-sunken px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-muted [overflow-wrap:anywhere]">
        <p className="line-clamp-4 whitespace-pre-line">{example.message}</p>
      </blockquote>

      <div className="mt-3">
        {benign ? (
          <Badge tone="mint">No warning signs expected</Badge>
        ) : (
          <ul className="flex flex-wrap gap-1.5" aria-label="Expected warning signs">
            {example.expectedSignals.map((id) => {
              const info = SIGNAL_INFO[id];
              const Icon = KIND_ICON[info?.kind ?? "generic"];
              return (
                <li key={id}>
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 text-[11.5px] text-ink-muted ring-1 ring-inset ring-line">
                    <Icon aria-hidden="true" className="h-3 w-3 text-ink-subtle" />
                    {info?.title ?? id}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{example.explanation}</p>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="mt-3 flex items-center gap-1 self-start rounded text-[13px] font-medium text-brand-700 hover:text-brand-600"
      >
        Safe next step
        <ChevronDown aria-hidden="true" className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <p id={panelId} hidden={!open} className="mt-2 rounded-lg bg-mint-50 px-3 py-2 text-[13px] leading-relaxed text-mint-700">
        {example.safeNextStep}
      </p>

      <div className="mt-auto pt-4">
        <Button variant="primary" size="sm" onClick={onAnalyze} className="w-full">
          <ScanSearch aria-hidden="true" className="h-4 w-4" />
          Analyze this example
        </Button>
      </div>
    </li>
  );
}

export function ExamplesView() {
  const router = useRouter();
  const { analyze } = useAnalyzer();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExampleCategory | "All">("All");
  const searchId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXAMPLES.filter(
      (e) =>
        (category === "All" || e.category === category) &&
        (!q || [e.title, e.message, e.category, e.explanation].some((f) => f.toLowerCase().includes(q))),
    );
  }, [query, category]);

  const reset = () => {
    setQuery("");
    setCategory("All");
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Examples library"
        title="Learn the patterns."
        subtitle="Fictional messages that show common tactics, plus one ordinary message for comparison. Load any of them into the analyzer."
      />

      <div className="card mb-5 p-4">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search examples
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword, e.g. “gift card” or “internship”"
            className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface pl-9 pr-10 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-brand-500 focus:shadow-[var(--shadow-focus)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle hover:bg-sunken hover:text-ink"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        <div role="group" aria-label="Filter by category" className="mt-3 flex flex-wrap gap-1.5">
          {(["All", ...EXAMPLE_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                category === c ? "bg-ink text-canvas" : "bg-sunken text-ink-muted hover:bg-line hover:text-ink",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs text-ink-subtle" aria-live="polite">
        Showing {filtered.length} of {EXAMPLES.length} examples
      </p>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-ink-subtle">
            <Inbox aria-hidden="true" className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-ink">No examples match</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">Try a different keyword or category.</p>
          <Button className="mt-5" onClick={reset}>
            Reset filters
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <ExampleCard
              key={e.id}
              example={e}
              onAnalyze={() => {
                analyze(e.message, e.mode ?? "message");
                router.push("/");
              }}
            />
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink-subtle">
        All organizations, names, numbers and links in these examples are invented for training. Links use the reserved
        <span className="font-mono"> .example</span> domain or documentation-only addresses and do not lead anywhere real.
      </p>
    </div>
  );
}
