"use client";

import {
  Banknote,
  Check,
  ClipboardList,
  CreditCard,
  Download,
  Hash,
  HeartHandshake,
  IdCard,
  KeyRound,
  Lock,
  MessageCircleReply,
  MonitorSmartphone,
  MousePointerClick,
  PhoneCall,
  Printer,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { downloadText } from "@/lib/clipboard";
import { buildPlan, EXPOSURES, type Exposure, type PlanStep, type Region, type Urgency } from "@/lib/emergency/plan";
import { buildIncidentReport, EMPTY_DETAILS, type IncidentDetails } from "@/lib/emergency/report";
import { useAnalyzer } from "../analyze/AnalyzerProvider";
import { CopyButton } from "../ui/CopyButton";
import { Button, cn, PageHeader, Progress } from "../ui/primitives";

const EXPOSURE_ICON: Record<Exposure, LucideIcon> = {
  paid: Banknote,
  card: CreditCard,
  otp: KeyRound,
  password: Lock,
  "remote-app": MonitorSmartphone,
  "dial-code": Hash,
  "id-documents": IdCard,
  clicked: MousePointerClick,
  replied: MessageCircleReply,
};

const URGENCY_UI: Record<Urgency, { label: string; dot: string; text: string }> = {
  now: { label: "Do this now", dot: "bg-coral-500", text: "text-coral-700" },
  today: { label: "Today", dot: "bg-amber-500", text: "text-amber-700" },
  soon: { label: "In the next few days", dot: "bg-ink-subtle", text: "text-ink-muted" },
};

const CHANNELS = ["", "SMS", "WhatsApp", "Phone call", "Video call", "Email", "Social media", "Other"];
const METHODS = ["", "UPI", "Bank transfer (NEFT/IMPS/RTGS)", "Debit or credit card", "Wallet", "Gift card", "Cryptocurrency", "Cash", "Other"];

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  options?: string[];
}) {
  const id = useId();
  const base =
    "w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-brand-500 focus:shadow-[var(--shadow-focus)]";
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12.5px] font-medium text-ink-muted">
        {label}
      </label>
      {options ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(base, "h-10")}>
          {options.map((o) => (
            <option key={o} value={o}>
              {o || "Choose…"}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className={cn(base, "resize-y py-2")} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(base, "h-10")} autoComplete="off" />
      )}
    </div>
  );
}

export function HelpView() {
  const { analyzedText } = useAnalyzer();
  const [exposures, setExposures] = useState<Exposure[]>([]);
  const [region, setRegion] = useState<Region>("india");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<IncidentDetails>(EMPTY_DETAILS);

  const plan = useMemo(() => buildPlan(exposures, region), [exposures, region]);
  const completed = plan.filter((s) => done.has(s.id));
  const report = useMemo(() => buildIncidentReport(details, exposures, completed), [details, exposures, completed]);
  const set = (key: keyof IncidentDetails) => (v: string) => setDetails((d) => ({ ...d, [key]: v }));

  const toggleExposure = (e: Exposure) =>
    setExposures((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  const toggleStep = (s: PlanStep) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(s.id)) next.delete(s.id);
      else next.add(s.id);
      return next;
    });

  const grouped = (["now", "today", "soon"] as const)
    .map((u) => ({ urgency: u, steps: plan.filter((s) => s.urgency === u) }))
    .filter((g) => g.steps.length > 0);

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Emergency help"
        title="Already clicked, paid or shared?"
        subtitle="Tell us what happened and get a step-by-step plan, then build a report for your bank or the police. Nothing you enter is stored or sent."
      />

      <div className="mb-5 flex gap-3 rounded-[var(--radius-card)] border border-lavender-100 bg-lavender-50 p-4 text-[13.5px] leading-relaxed text-lavender-700">
        <HeartHandshake aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <span className="font-semibold">You are not alone, and it&apos;s not your fault.</span> Scams are designed to
          rush careful people. Acting quickly, especially within the first hours, gives you the best chance of limiting the
          damage.
        </p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-6">
        <div className="space-y-5">
          <section aria-labelledby="what-happened" className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="what-happened" className="text-[15px] font-semibold text-ink">
                1. What happened? <span className="font-normal text-ink-subtle">(choose all that apply)</span>
              </h2>
              <div role="group" aria-label="Where are you?" className="flex rounded-lg bg-sunken p-0.5">
                {(["india", "elsewhere"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={region === r}
                    onClick={() => setRegion(r)}
                    className={cn(
                      "h-8 rounded-md px-3 text-[12.5px] font-medium transition-colors",
                      region === r ? "bg-surface text-ink shadow-[var(--shadow-card)]" : "text-ink-subtle hover:text-ink",
                    )}
                  >
                    {r === "india" ? "I'm in India" : "Elsewhere"}
                  </button>
                ))}
              </div>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {EXPOSURES.map(({ id, label, hint }) => {
                const Icon = EXPOSURE_ICON[id];
                const selected = exposures.includes(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleExposure(id)}
                      className={cn(
                        "flex h-full w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color]",
                        selected ? "border-brand-500 bg-brand-50" : "border-line bg-surface hover:border-line-strong hover:bg-sunken/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          selected ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted",
                        )}
                      >
                        {selected ? <Check aria-hidden="true" className="h-4 w-4 animate-pop" /> : <Icon aria-hidden="true" className="h-4 w-4" />}
                      </span>
                      <span>
                        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
                        <span className="block text-xs text-ink-subtle">{hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="plan-title" className="card p-5" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="plan-title" className="text-[15px] font-semibold text-ink">
                2. Your action plan
              </h2>
              {exposures.length > 0 && (
                <span className="text-xs tabular-nums text-ink-subtle">
                  {completed.length} of {plan.length} done
                </span>
              )}
            </div>
            {exposures.length === 0 ? (
              <p className="mt-3 rounded-xl bg-sunken px-4 py-6 text-center text-sm text-ink-muted">
                Choose what happened above to see what to do first.
              </p>
            ) : (
              <>
                <div className="mt-3">
                  <Progress value={completed.length} max={plan.length} label="Action plan progress" tone="mint" />
                </div>
                {region === "india" && exposures.includes("paid") && (
                  <a
                    href="tel:1930"
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-coral-500 px-4 py-3 text-[15px] font-semibold text-white shadow-[var(--shadow-card)] hover:bg-coral-700"
                  >
                    <PhoneCall aria-hidden="true" className="h-5 w-5" />
                    Call 1930 now (National Cyber Crime Helpline)
                  </a>
                )}
                <div className="mt-4 space-y-4">
                  {grouped.map(({ urgency, steps }) => (
                    <div key={urgency}>
                      <h3 className={cn("mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide", URGENCY_UI[urgency].text)}>
                        <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", URGENCY_UI[urgency].dot)} />
                        {URGENCY_UI[urgency].label}
                      </h3>
                      <ul className="space-y-1">
                        {steps.map((s) => {
                          const checked = done.has(s.id);
                          return (
                            <li key={s.id}>
                              <label className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-sunken/70">
                                <input type="checkbox" checked={checked} onChange={() => toggleStep(s)} className="peer sr-only" />
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2",
                                    checked ? "border-mint-500 bg-mint-500 text-white" : "border-line-strong bg-surface group-hover:border-ink-subtle",
                                  )}
                                >
                                  {checked && <Check className="h-3.5 w-3.5 animate-pop" strokeWidth={3} />}
                                </span>
                                <span>
                                  <span className={cn("block text-[13.5px] font-medium", checked ? "text-ink-subtle line-through" : "text-ink")}>
                                    {s.title}
                                  </span>
                                  <span className="block text-[12.5px] leading-relaxed text-ink-muted">{s.detail}</span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        <section aria-labelledby="report-title" className="card p-5">
          <div className="flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="h-4 w-4 text-brand-600" />
            <h2 id="report-title" className="text-[15px] font-semibold text-ink">
              3. Incident report
            </h2>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            Fill in what you know. Card and account numbers are masked and codes or PINs are removed automatically.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="When did it happen?" value={details.happenedAt} onChange={set("happenedAt")} placeholder="e.g. 12 Nov, 9:40 PM" />
            <Field label="How did it reach you?" value={details.channel} onChange={set("channel")} options={CHANNELS} />
            <Field label="Sender (number, ID or profile)" value={details.sender} onChange={set("sender")} placeholder="e.g. +91 98… or a UPI ID" />
            <Field label="Amount lost (if any)" value={details.amount} onChange={set("amount")} placeholder="e.g. Rs.8,500" />
            <Field label="Payment method" value={details.paymentMethod} onChange={set("paymentMethod")} options={METHODS} />
            <Field label="Transaction / UTR / reference IDs" value={details.transactionIds} onChange={set("transactionIds")} />
            <div className="sm:col-span-2">
              <Field label="Your bank or payment app" value={details.bank} onChange={set("bank")} />
            </div>
            <div className="sm:col-span-2">
              <Field label="The scam message" value={details.message} onChange={set("message")} placeholder="Paste or type the message" multiline />
              {analyzedText && details.message !== analyzedText && (
                <button
                  type="button"
                  onClick={() => set("message")(analyzedText)}
                  className="mt-1.5 rounded text-[12.5px] font-medium text-brand-700 hover:text-brand-600"
                >
                  Use the message you analyzed
                </button>
              )}
            </div>
            <div className="sm:col-span-2">
              <Field label="Anything else" value={details.notes} onChange={set("notes")} placeholder="What they said, what you did, names they used" multiline />
            </div>
          </div>

          <h3 className="mt-5 text-[13px] font-semibold text-ink">Preview</h3>
          <pre
            id="incident-report"
            className="mt-2 max-h-80 overflow-auto rounded-xl border border-line bg-sunken/60 p-4 font-mono text-[12px] leading-relaxed text-ink whitespace-pre-wrap [overflow-wrap:anywhere]"
          >
            {report}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton label="Copy report" getText={() => buildIncidentReport(details, exposures, completed, new Date())} />
            <Button
              size="sm"
              onClick={() => downloadText("safeclick-incident-report.txt", buildIncidentReport(details, exposures, completed, new Date()))}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Download .txt
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer aria-hidden="true" className="h-4 w-4" />
              Print or save as PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDetails(EMPTY_DETAILS);
                setExposures([]);
                setDone(new Set());
              }}
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Start over
            </Button>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-subtle">
            Created in your browser and kept only while this tab is open. Reloading clears it.
          </p>
        </section>
      </div>
    </div>
  );
}
