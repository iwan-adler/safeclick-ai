/**
 * Final evaluation report (step 4 of eval/PROTOCOL.md). Writes:
 *   eval/RESULTS.md                    human-readable report
 *   eval/results.json                  full numbers
 *   src/lib/data/eval-summary.json     headline numbers shown in the app
 *
 * Usage: npm run eval
 *
 * With POSTHOC=1 (after the pre-registered run, see PROTOCOL.md "Post-hoc
 * changes"), writes eval/RESULTS-posthoc.md instead and leaves the official
 * report and the in-app numbers untouched.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { analyzeMessage } from "../src/lib/analysis/analyze";
import { runModel } from "../src/lib/analysis/model";
import { loadCorpus, type CorpusMessage } from "./corpus";
import { HELDOUT } from "./heldout";
import { computeMetrics, pct, rateText, runItems, type Analyzer, type Metrics, type Rate } from "./metrics";

const out = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const POSTHOC = Boolean(process.env.POSTHOC);

type SetName = "dev" | "test" | "testUnique" | "india";

interface Baseline {
  commit: string;
  sets: Record<SetName, Metrics>;
}

const engine =
  (useModel: boolean): Analyzer =>
  (text, mode) => {
    const r = analyzeMessage(text.slice(0, 5000), { mode, useModel });
    return r.ok ? { level: r.level, score: r.score, signals: r.signals.map((s) => s.id) } : { level: "lower", score: 0, signals: [] };
  };

const toItems = (set: CorpusMessage[], name: string) => set.map((m, i) => ({ id: `${name}-${i}`, label: m.label, text: m.text }));
const cell = (r: Rate) => `**${pct(r.value)}**<br><sub>${r.hits}/${r.total} · CI ${pct(r.low)}–${pct(r.high)}</sub>`;

function auc(ps: number[], ys: number[]): number {
  const order = ps.map((p, i) => [p, ys[i]] as const).sort((a, b) => a[0] - b[0]);
  let rankSum = 0;
  let pos = 0;
  order.forEach(([, y], i) => {
    if (y === 1) {
      rankSum += i + 1;
      pos++;
    }
  });
  return (rankSum - (pos * (pos + 1)) / 2) / (pos * (order.length - pos));
}

test("final evaluation", async () => {
  const baseline = JSON.parse(readFileSync(out("./baseline.json"), "utf8")) as Baseline;
  const corpus = await loadCorpus();
  const commit = execSync("git rev-parse --short HEAD").toString().trim();
  const generatedAt = new Date().toISOString().slice(0, 10);

  const names: SetName[] = ["testUnique", "test", "india", "dev"];
  const labels: Record<SetName, string> = {
    testUnique: "**Test-unique** (headline: held out, no near-duplicates of dev)",
    test: "Test (all held-out messages)",
    india: "**India** (independent author, Hinglish/Indian)",
    dev: "Dev (used for tuning and training)",
  };
  const rules: Partial<Record<SetName, Metrics>> = {};
  const hybrid: Partial<Record<SetName, Metrics>> = {};
  for (const name of names) {
    const items = toItems(corpus[name], name);
    const r = runItems(items, engine(false));
    rules[name] = computeMetrics(r.results, r.msPerMessage);
    const h = runItems(items, engine(true));
    hybrid[name] = computeMetrics(h.results, h.msPerMessage);
  }

  // Model quality on test-unique (scam vs. ham).
  const tu = corpus.testUnique.filter((m) => m.label !== "spam");
  const probs = tu.map((m) => runModel(m.text).insight.probability);
  const ys = tu.map((m) => (m.label === "scam" ? 1 : 0));
  const brier = probs.reduce((s, p, i) => s + (p - ys[i]) ** 2, 0) / probs.length;
  const edges = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1];
  const bins = edges.slice(0, -1).map((lo, i) => {
    const hi = edges[i + 1];
    const idx = probs.map((p, j) => (p >= lo && (p < hi || (hi === 1 && p <= 1)) ? j : -1)).filter((j) => j >= 0);
    const meanP = idx.reduce((s, j) => s + probs[j], 0) / Math.max(1, idx.length);
    const observed = idx.reduce((s, j) => s + ys[j], 0) / Math.max(1, idx.length);
    return { range: `${lo.toFixed(1)}–${hi.toFixed(1)}`, n: idx.length, meanP, observed };
  });

  const v1 = runItems(HELDOUT.map((m) => ({ id: m.id, label: m.label === "scam" ? "scam" : "ham", mode: m.mode, text: m.text }) as const));
  const v1Metrics = computeMetrics(v1.results, v1.msPerMessage);

  const row = (name: SetName, pick: (m: Metrics) => Rate) =>
    `| ${labels[name]} | ${cell(pick(baseline.sets[name]))} | ${cell(pick(rules[name]!))} | ${cell(pick(hybrid[name]!))} |`;

  const md = [
    POSTHOC ? "# SafeClick AI: Post-hoc re-measurement (not held out)" : "# SafeClick AI: Accuracy Report (v2, real-world data)",
    "",
    ...(POSTHOC
      ? [
          "> These numbers were computed **after** the pre-registered final run, following the changes listed under *Post-hoc changes* in [PROTOCOL.md](PROTOCOL.md). Because the test and india sets had already been scored once, they are no longer strictly held out. The official result is [RESULTS.md](RESULTS.md).",
          "",
        ]
      : []),
    `Generated ${generatedAt} from commit \`${commit}\` by \`npm run eval\`, following the pre-registered [protocol](PROTOCOL.md) and its amendments. Numbers are computed, not hand-edited. A message is **flagged** when rated *Needs caution* or *High concern*.`,
    "",
    "Columns: the **v1** engine (frozen copy of commit `" + baseline.commit + "`), **v2 rules** alone, and **v2 rules + on-device model** (what the app ships).",
    "",
    "## Scams flagged (detection)",
    "",
    "| Set | v1 | v2 rules | v2 rules + model |",
    "| --- | --- | --- | --- |",
    ...names.map((n) => row(n, (m) => m.detection)),
    "",
    "## Genuine messages wrongly flagged (false alarms)",
    "",
    "| Set | v1 | v2 rules | v2 rules + model |",
    "| --- | --- | --- | --- |",
    ...names.map((n) => row(n, (m) => m.falseAlarm)),
    "",
    `Set sizes (scam / genuine): ${names.map((n) => `${n} ${hybrid[n]!.scams}/${hybrid[n]!.hams}`).join(" · ")}. Speed (rules + model): ${hybrid.test!.msPerMessage.toFixed(2)} ms per message in Node.js.`,
    "",
    "## Model quality on test-unique",
    "",
    `AUC **${auc(probs, ys).toFixed(3)}** · Brier score **${brier.toFixed(4)}** (${tu.length} messages).`,
    "",
    "Calibration: when the model gives a probability in a range, how often the message is actually a scam.",
    "",
    "| Model probability | Messages | Mean predicted | Actually scam |",
    "| --- | --- | --- | --- |",
    ...bins.map((b) => `| ${b.range} | ${b.n} | ${b.n ? pct(b.meanP) : "–"} | ${b.n ? pct(b.observed) : "–"} |`),
    "",
    "## Data",
    "",
    "- **Test and dev:** the [Mishra & Soni (2022) SMS Phishing Dataset](https://data.mendeley.com/datasets/f45bkkt8pr/1) and the [UCI SMS Spam Collection](https://archive.ics.uci.edu/dataset/228/sms+spam+collection), merged, de-duplicated and split 50/50 by a hash of each message. Scam = smishing; genuine = ham. Both CC BY 4.0, downloaded at evaluation time, not redistributed.",
    "- **Test-unique** removes test messages that are near-duplicates of dev messages (same text without digits, or ≥ 70% word overlap). Many scam texts are templates, so this is the fairest estimate of performance on new messages.",
    "- **India:** hand-written Hinglish and Indian-context messages from the [Bolewar (2026) dataset](https://huggingface.co/datasets/bolewara/hinglish-scam-text-dataset) (CC BY 4.0), excluding rows copied from UCI. A different author; never used for tuning or training.",
    "- Dataset artifacts (anonymization placeholders such as `&lt;#&gt;`, mis-decoded characters) are cleaned before analysis; the dev/test assignment is unaffected.",
    "- Individual real-world messages are not reproduced in this report.",
    "",
    "## Marketing spam (not the target)",
    "",
    `SafeClick flags ${rateText(hybrid.test!.spamFlagged)} of test-set marketing spam. This is reported for transparency and is not counted as detection or false alarm.`,
    "",
    "## The original fictional set (v1 held-out)",
    "",
    `The 80 messages in [heldout.ts](heldout.ts) are **no longer held out** (their misses motivated v2 changes, and they are in the model's training data). For history only: scams flagged ${rateText(v1Metrics.detection)}; genuine wrongly flagged ${rateText(v1Metrics.falseAlarm)}.`,
    "",
    "## Honest caveats",
    "",
    "- Dev/test data is dominated by older UK SMS and international smishing. It is not a random sample of the scams people receive in India today.",
    "- The India set is small; read its confidence intervals. Six of its messages were seen while inspecting the dataset's format, before the protocol was written; no rule was written for them.",
    "- Rules were improved using dev data and general knowledge of scam tactics. The model was trained on dev plus fictional messages. Test, test-unique and india results were computed once, after all changes.",
    "- Pattern matching and the model see text only. Neither can check a link's real destination or a sender's identity.",
    "",
  ].join("\n");

  if (POSTHOC) {
    writeFileSync(out("./RESULTS-posthoc.md"), md);
    console.log(md.split("## Data")[0]);
    return;
  }
  writeFileSync(out("./RESULTS.md"), md);
  writeFileSync(
    out("./results.json"),
    JSON.stringify({ generatedAt, commit, baseline: baseline.sets, rules, hybrid, modelTestUnique: { auc: auc(probs, ys), brier, bins }, v1HeldOut: v1Metrics }, null, 2) + "\n",
  );
  const summary = (m: Metrics) => ({
    scams: m.scams,
    hams: m.hams,
    detection: Number(m.detection.value.toFixed(4)),
    detectionLow: Number(m.detection.low.toFixed(4)),
    detectionHigh: Number(m.detection.high.toFixed(4)),
    falseAlarm: Number(m.falseAlarm.value.toFixed(4)),
    falseAlarmLow: Number(m.falseAlarm.low.toFixed(4)),
    falseAlarmHigh: Number(m.falseAlarm.high.toFixed(4)),
  });
  writeFileSync(
    out("../src/lib/data/eval-summary.json"),
    JSON.stringify(
      {
        generatedAt,
        testUnique: summary(hybrid.testUnique!),
        india: summary(hybrid.india!),
        baseline: { testUnique: summary(baseline.sets.testUnique), india: summary(baseline.sets.india) },
        modelAuc: Number(auc(probs, ys).toFixed(3)),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(md.split("## Data")[0]);
}, 600_000);
