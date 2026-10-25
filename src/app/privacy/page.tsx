import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, DatabaseZap, EyeOff, Link2Off } from "lucide-react";
import { Disclosure } from "@/components/ui/Disclosure";
import { PageHeader } from "@/components/ui/primitives";
import { MAX_MESSAGE_LENGTH } from "@/lib/analysis";
import { RULES } from "@/lib/analysis/rules";
import { COMBINATION_RULES, FAMILY_SECONDARY_FACTOR, LEVEL_THRESHOLDS } from "@/lib/analysis/scoring";
import evalSummary from "@/lib/data/eval-summary.json";

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export const metadata: Metadata = { title: "Privacy & Limitations" };

const AT_A_GLANCE = [
  { icon: Cpu, title: "Analyzed on your device", body: "Rules and screenshot reading run in your browser. Text and images are never sent to a server or an AI service." },
  { icon: DatabaseZap, title: "Nothing saved", body: "Messages live only in page memory and disappear when you reload or close the tab." },
  { icon: EyeOff, title: "No tracking", body: "No analytics, advertising, cookies, or accounts." },
  { icon: Link2Off, title: "Links never opened", body: "Links are inspected as text. SafeClick never visits them." },
];

export default function PrivacyPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Privacy & limitations"
        title="Honest about what we do, and don't."
        subtitle="SafeClick AI is an educational tool. Here is exactly how it handles your messages and where its judgment ends."
      />

      <ul className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {AT_A_GLANCE.map(({ icon: Icon, title, body }) => (
          <li key={title} className="card p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-50 text-mint-700 ring-1 ring-inset ring-mint-100">
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
            </span>
            <h2 className="mt-3 text-[14.5px] font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{body}</p>
          </li>
        ))}
      </ul>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section aria-labelledby="data-title">
            <h2 id="data-title" className="mb-3 text-lg font-semibold tracking-tight text-ink">
              Your data
            </h2>
            <div className="card overflow-hidden">
              <Disclosure title="How does the analysis work?" defaultOpen>
                <p>
                  When you press Analyze, a set of transparent pattern rules written in TypeScript checks the text inside your
                  browser tab. There is no machine-learning model and no external AI service: the same message always gets the
                  same result, and every warning points to the exact words that triggered it.
                </p>
                <p>
                  The name &ldquo;SafeClick AI&rdquo; refers to the product, not to a hidden model. We chose explainable rules
                  so that results can be checked and understood.
                </p>
              </Disclosure>
              <Disclosure title="How do screenshots and sharing work?">
                <p>
                  <strong className="text-ink">Screenshots</strong> are read by an open-source text-recognition engine
                  (Tesseract) running in your browser. The image goes from your device&apos;s memory to a background worker in
                  the same tab and is never uploaded. The engine and its English language file (about 7&nbsp;MB) are served by
                  SafeClick itself, not a third-party CDN, and are cached on your device after first use. Recognition can make
                  mistakes, so the text is placed in the box for you to check before analyzing.
                </p>
                <p>
                  <strong className="text-ink">Sharing from another app</strong> (after installing SafeClick on Android): the
                  shared text or image is received by SafeClick&apos;s service worker on your device, held in memory for at
                  most a minute, handed to the page once, and never written to storage. If the service worker isn&apos;t
                  active yet, the share is sent to SafeClick&apos;s server, which redirects without reading it, and you are
                  asked to paste instead.
                </p>
                <p>
                  <strong className="text-ink">Conversation mode</strong> uses the same local rules, plus a check across
                  messages for friendly build-up followed by a request.
                </p>
              </Disclosure>
              <Disclosure title="Do my messages leave my device?">
                <p>
                  No. The analysis code makes no network requests. In production the site also sends a Content-Security-Policy
                  with <code className="rounded bg-sunken px-1 font-mono text-[12.5px]">connect-src &apos;self&apos;</code>,
                  which tells your browser to block page scripts from contacting any other website.
                </p>
                <p>
                  Like any website, the server hosting SafeClick receives ordinary requests when you load its pages (for
                  example, your IP address and the page requested). Message text is never part of those requests.
                </p>
              </Disclosure>
              <Disclosure title="What is stored, and where?">
                <p>
                  <strong className="text-ink">Not stored:</strong> pasted messages, analysis results, checklist ticks and
                  learning answers. These are kept in memory only while the tab is open. SafeClick does not use
                  localStorage, cookies or any database for them.
                </p>
                <p>
                  <strong className="text-ink">Stored for offline use:</strong> after your first visit, a service worker saves
                  copies of SafeClick&apos;s own pages, scripts, styles and fonts (and, once used, the screenshot reader) in
                  your browser&apos;s cache so the app can open without a connection. This cache contains no messages or
                  images. You can remove it by clearing site
                  data for this website in your browser settings.
                </p>
                <p>
                  <strong className="text-ink">Copy and download:</strong> the &ldquo;Copy summary&rdquo; and checklist buttons
                  only act when you press them. The copied summary lists the warning types and next steps, not your message.
                </p>
              </Disclosure>
              <Disclosure title="Is user content handled safely?">
                <p>
                  Messages are displayed as plain text, never interpreted as HTML, so pasted code cannot run. Links are shown as
                  text, not as clickable links. Input is limited to {MAX_MESSAGE_LENGTH.toLocaleString("en-US")} characters.
                </p>
              </Disclosure>
            </div>
          </section>

          <section aria-labelledby="limits-title">
            <h2 id="limits-title" className="mb-3 text-lg font-semibold tracking-tight text-ink">
              Limitations
            </h2>
            <div className="card overflow-hidden">
              <Disclosure title="How is the score calculated?" defaultOpen>
                <p>Each rule has a fixed weight. To avoid counting the same tactic twice, related rules are grouped into families:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>The strongest rule in a family counts in full; others add {FAMILY_SECONDARY_FACTOR * 100}% of their weight.</li>
                  <li>
                    Families combine with diminishing returns, so the score rises with each extra tactic but never exceeds 100.
                  </li>
                  <li>A few combinations that are typical of scams add a small, fixed bonus.</li>
                  <li>
                    Under {LEVEL_THRESHOLDS.caution} is lower apparent risk, {LEVEL_THRESHOLDS.caution}–{LEVEL_THRESHOLDS.high - 1}{" "}
                    needs caution, and {LEVEL_THRESHOLDS.high}+ is high concern.
                  </li>
                </ul>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-left text-[13px]">
                    <caption className="sr-only">Rule weights</caption>
                    <thead className="bg-sunken text-xs text-ink-subtle">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">Rule</th>
                        <th scope="col" className="px-3 py-2 font-medium">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {RULES.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2 text-ink">{r.title}</td>
                          <td className="px-3 py-2 tabular-nums">{r.weight}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="px-3 py-2 text-ink">Link has unusual characteristics</td>
                        <td className="px-3 py-2 tabular-nums">up to 30</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-ink">Builds trust first, then asks (conversation mode)</td>
                        <td className="px-3 py-2 tabular-nums">22</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-ink">Uses hidden or look-alike characters</td>
                        <td className="px-3 py-2 tabular-nums">14</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[13px]">
                  Combination bonuses:{" "}
                  {COMBINATION_RULES.map((c) => `${c.label.toLowerCase()} (+${c.bonus})`).join("; ")}.
                </p>
                <p>
                  <strong className="text-ink">The score is not a probability.</strong> It was not calibrated against a dataset
                  of real scams, so &ldquo;70&rdquo; does not mean a 70% chance of fraud.
                </p>
              </Disclosure>
              <Disclosure title="How accurate is it?" defaultOpen>
                <p>We measured SafeClick on two labelled datasets. These are the results of the most recent run:</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  <li className="rounded-xl border border-line p-4">
                    <p className="text-[13px] font-medium text-ink">Fictional held-out set</p>
                    <p className="text-xs text-ink-subtle">
                      {evalSummary.heldout.positives} scams, {evalSummary.heldout.negatives} genuine messages
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-ink tabular-nums">
                      {pct(evalSummary.heldout.detectionRate)}
                    </p>
                    <p className="text-xs">of scams flagged</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">
                      {pct(evalSummary.heldout.falseAlarmRate)}
                    </p>
                    <p className="text-xs">of genuine messages wrongly flagged</p>
                  </li>
                  <li className="rounded-xl border border-line p-4">
                    <p className="text-[13px] font-medium text-ink">UCI SMS Spam Collection</p>
                    <p className="text-xs text-ink-subtle">
                      {evalSummary.sms.negatives.toLocaleString("en-US")} real personal texts, {evalSummary.sms.positives} spam
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-ink tabular-nums">
                      {pct(evalSummary.sms.falseAlarmRate)}
                    </p>
                    <p className="text-xs">of ordinary texts wrongly flagged</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">
                      {pct(evalSummary.sms.detectionRate)}
                    </p>
                    <p className="text-xs">of spam flagged (most is marketing, not scams)</p>
                  </li>
                </ul>
                <p>
                  Caveats: the held-out set is small and was written by the same author as the rules, so it is likely
                  optimistic. The SMS dataset is from around 2011 and labels spam rather than fraud. Neither is a random sample
                  of today&apos;s scams. The full report, including every missed scam, is in{" "}
                  <span className="font-mono text-[12.5px]">eval/RESULTS.md</span> in the source code (measured{" "}
                  {evalSummary.generatedAt}).
                </p>
              </Disclosure>
              <Disclosure title="False positives and false negatives">
                <p>
                  <strong className="text-ink">False positives:</strong> genuine messages sometimes use urgent wording, mention
                  payments, or include unusual links. A real bank alert can score as &ldquo;needs caution&rdquo;.
                </p>
                <p>
                  <strong className="text-ink">False negatives:</strong> a careful scammer can write a message that avoids every
                  pattern here, especially a conversation that builds trust slowly. A low score is never a guarantee of safety.
                </p>
                <p>The rules currently focus on English-language messages.</p>
              </Disclosure>
              <Disclosure title="Why can't text alone prove a message is real?">
                <p>
                  Sender names, phone numbers and email addresses can be faked, and logos or wording can be copied exactly.
                  SafeClick only sees the words you paste. It cannot check who sent a message, whether a link is currently
                  harmful, or whether an account problem is real.
                </p>
                <p>
                  The reliable test is independent verification: contacting the organization through details you already have,
                  such as its official app or the number on your card.
                </p>
              </Disclosure>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-[var(--radius-card)] border border-lavender-100 bg-lavender-50 p-5">
            <h2 className="text-[14.5px] font-semibold text-lavender-700">Educational purpose</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink">
              SafeClick AI helps people notice warning signs and build safer habits. It is not a security product, does not
              replace your bank, employer or local authorities, and does not provide legal or financial advice.
            </p>
          </div>
          <div className="card p-5">
            <h2 className="text-[14.5px] font-semibold text-ink">If you have already acted</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
              Contact your bank or the affected service straight away using official contact details. The Safety Guide has
              step-by-step checklists.
            </p>
            <Link href="/guide" className="mt-3 inline-flex items-center gap-1 rounded text-[13px] font-medium text-brand-700 hover:text-brand-600">
              Open the Safety Guide <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
