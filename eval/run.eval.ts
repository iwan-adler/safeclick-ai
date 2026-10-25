/**
 * Runs the accuracy evaluation and writes:
 *   eval/RESULTS.md                    human-readable report
 *   eval/results.json                  full numbers
 *   src/lib/data/eval-summary.json     headline numbers shown in the app
 *
 * Usage: npm run eval
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { HELDOUT } from "./heldout";
import { computeMetrics, pct, ruleCounts, runItems, type ItemResult, type Metrics } from "./metrics";
import { loadSmsSpam, SMS_SPAM_URL } from "./sms-spam";

const out = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

function row(name: string, m: Metrics) {
  return `| ${name} | ${m.positives} / ${m.negatives} | **${pct(m.detectionRate)}** (${m.truePositives}/${m.positives}) | **${pct(m.falseAlarmRate)}** (${m.falsePositives}/${m.negatives}) | ${pct(m.precision)} | ${pct(m.highOnPositives)} | ${pct(m.highOnNegatives)} | ${m.msPerMessage.toFixed(2)} ms |`;
}

function byCategory(results: ItemResult[]) {
  const cats = new Map<string, { flagged: number; total: number }>();
  for (const r of results) {
    const c = cats.get(r.category ?? "-") ?? { flagged: 0, total: 0 };
    c.total++;
    if (r.level !== "lower") c.flagged++;
    cats.set(r.category ?? "-", c);
  }
  return [...cats.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

const short = (t: string) => (t.length > 140 ? `${t.slice(0, 137)}...` : t).replace(/\n/g, " / ").replace(/\|/g, "\\|");

test("accuracy evaluation", async () => {
  // Held-out fictional set
  const held = runItems(
    HELDOUT.map((m) => ({ id: m.id, positive: m.label === "scam", category: m.category, mode: m.mode, text: m.text })),
  );
  const heldMetrics = computeMetrics(held.results, held.msPerMessage);
  const textOf = new Map(HELDOUT.map((m) => [m.id, m.text]));

  // UCI SMS Spam Collection
  const sms = await loadSmsSpam();
  const smsRun = runItems(sms.map((m, i) => ({ id: `sms-${i}`, positive: m.label === "spam", text: m.text })));
  const smsMetrics = computeMetrics(smsRun.results, smsRun.msPerMessage);
  const smsFalseAlarms = smsRun.results.filter((r) => !r.positive && r.level !== "lower");
  const smsMissed = smsRun.results.filter((r) => r.positive && r.level === "lower");

  const generatedAt = new Date().toISOString().slice(0, 10);

  const md = [
    "# SafeClick AI: Accuracy Report",
    "",
    `Generated ${generatedAt} by \`npm run eval\`. All numbers below come from running the current analysis engine; nothing is hand-edited.`,
    "",
    "A message counts as **flagged** when SafeClick rates it *Needs caution* or *High concern*.",
    "",
    "| Dataset | Positives / negatives | Detection rate | False alarm rate | Precision | High concern (positives) | High concern (negatives) | Speed |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    row("Held-out fictional set (scam vs. genuine)", heldMetrics),
    row("UCI SMS Spam Collection (spam vs. ham)", smsMetrics),
    "",
    "## How to read this",
    "",
    "- **Detection rate:** share of scam (or spam) messages flagged.",
    "- **False alarm rate:** share of genuine messages flagged. For a tool people may rely on, this matters as much as detection.",
    "- **Speed:** average analysis time per message, in Node.js on the machine that ran the evaluation.",
    "",
    "## Held-out fictional set",
    "",
    `${HELDOUT.length} fictional messages (${heldMetrics.positives} scams, ${heldMetrics.negatives} genuine) in [heldout.ts](heldout.ts), written separately from the in-app examples and unit tests and frozen before the first evaluation run. The rules were not changed in response to these results.`,
    "",
    "**Important caveat:** the same author wrote the rules and this set, so these numbers are likely optimistic. Message `s40` is deliberately included: it is the documented limitation from the demo script (a polite, pressure-free payment request).",
    "",
    "### By category",
    "",
    "| Category | Flagged / total | Label |",
    "| --- | --- | --- |",
    ...byCategory(held.results.filter((r) => r.positive)).map(([c, v]) => `| ${c} | ${v.flagged} / ${v.total} | scam |`),
    ...byCategory(held.results.filter((r) => !r.positive)).map(([c, v]) => `| ${c} | ${v.flagged} / ${v.total} | genuine |`),
    "",
    "### Missed scams",
    "",
    "| Id | Category | Score | Message |",
    "| --- | --- | --- | --- |",
    ...held.results
      .filter((r) => r.positive && r.level === "lower")
      .map((r) => `| ${r.id} | ${r.category} | ${r.score} | ${short(textOf.get(r.id) ?? "")} |`),
    "",
    "### False alarms on genuine messages",
    "",
    "| Id | Category | Level | Signals | Message |",
    "| --- | --- | --- | --- | --- |",
    ...held.results
      .filter((r) => !r.positive && r.level !== "lower")
      .map((r) => `| ${r.id} | ${r.category} | ${r.level} | ${r.signals.join(", ")} | ${short(textOf.get(r.id) ?? "")} |`),
    "",
    "## UCI SMS Spam Collection",
    "",
    `${sms.length.toLocaleString("en-US")} real SMS messages (${smsMetrics.positives} spam, ${smsMetrics.negatives} ham) collected around 2011, mostly from the UK and Singapore. Source: Almeida, T. & Hidalgo, J. (2011), [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/228/sms+spam+collection), CC BY 4.0. Downloaded at evaluation time from ${SMS_SPAM_URL} and not redistributed. Individual messages are not reproduced here.`,
    "",
    "**Caveat:** *spam* is not the same as *scam*. Much of this spam is premium-rate marketing that SafeClick is not designed to flag, so detection is expected to be lower here. The most useful number is the **false alarm rate on ham**: how often SafeClick worries about ordinary personal texts.",
    "",
    "Rules most often involved in false alarms on ham:",
    "",
    ...ruleCounts(smsFalseAlarms)
      .slice(0, 8)
      .map(([id, n]) => `- \`${id}\`: ${n}`),
    "",
    "Rules most often firing on flagged spam:",
    "",
    ...ruleCounts(smsRun.results.filter((r) => r.positive && r.level !== "lower"))
      .slice(0, 8)
      .map(([id, n]) => `- \`${id}\`: ${n}`),
    "",
    `Missed spam with no signals at all: ${smsMissed.filter((r) => r.signals.length === 0).length} of ${smsMissed.length}.`,
    "",
    "## Limitations of this evaluation",
    "",
    "- Neither dataset is a random sample of the scams people receive today.",
    "- The held-out set is small and was written by the rule author.",
    "- The SMS dataset is old, English-only, and labels spam rather than fraud.",
    "- Results describe pattern matching on text only. They say nothing about links' real destinations or senders' identities.",
    "",
  ].join("\n");

  writeFileSync(out("./RESULTS.md"), md);
  writeFileSync(
    out("./results.json"),
    JSON.stringify({ generatedAt, heldout: { metrics: heldMetrics, results: held.results }, sms: { metrics: smsMetrics } }, null, 2) + "\n",
  );
  const summarize = (m: Metrics) => ({
    positives: m.positives,
    negatives: m.negatives,
    detectionRate: Number(m.detectionRate.toFixed(4)),
    falseAlarmRate: Number(m.falseAlarmRate.toFixed(4)),
  });
  writeFileSync(
    out("../src/lib/data/eval-summary.json"),
    JSON.stringify({ generatedAt, heldout: summarize(heldMetrics), sms: summarize(smsMetrics) }, null, 2) + "\n",
  );

  console.log(md.split("## How to read this")[0]);
}, 120_000);
