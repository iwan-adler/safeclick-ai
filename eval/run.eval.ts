/**
 * Final evaluation report (step 4 of eval/PROTOCOL.md). Writes:
 *   eval/RESULTS.md                    human-readable report
 *   eval/results.json                  full numbers
 *   src/lib/data/eval-summary.json     headline numbers shown in the app
 *
 * Usage: npm run eval
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { loadCorpus, type CorpusMessage } from "./corpus";
import { HELDOUT } from "./heldout";
import { computeMetrics, pct, rateText, runItems, type Metrics, type Rate } from "./metrics";

const out = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

interface Baseline {
  commit: string;
  recordedAt: string;
  sets: Record<"dev" | "test" | "india", Metrics>;
}

const toItems = (set: CorpusMessage[], name: string) => set.map((m, i) => ({ id: `${name}-${i}`, label: m.label, text: m.text }));
const rate = (r: Rate) => `**${pct(r.value)}** (${r.hits}/${r.total})<br><sub>95% CI ${pct(r.low)}–${pct(r.high)}</sub>`;

function compareRow(name: string, before: Metrics, after: Metrics) {
  return `| ${name} | ${before.scams} / ${before.hams} | ${pct(before.detection.value)} → ${rate(after.detection)} | ${pct(before.falseAlarm.value)} → ${rate(after.falseAlarm)} | ${pct(after.highOnScams.value)} | ${after.msPerMessage.toFixed(2)} ms |`;
}

test("final evaluation", async () => {
  const baseline = JSON.parse(readFileSync(out("./baseline.json"), "utf8")) as Baseline;
  const corpus = await loadCorpus();
  const commit = execSync("git rev-parse --short HEAD").toString().trim();
  const generatedAt = new Date().toISOString().slice(0, 10);

  const evalSet = (name: "dev" | "test" | "india") => {
    const run = runItems(toItems(corpus[name], name));
    return computeMetrics(run.results, run.msPerMessage);
  };
  const sets = { dev: evalSet("dev"), test: evalSet("test"), india: evalSet("india") };

  const v1 = runItems(HELDOUT.map((m) => ({ id: m.id, label: m.label === "scam" ? "scam" : "ham", mode: m.mode, text: m.text }) as const));
  const v1Metrics = computeMetrics(v1.results, v1.msPerMessage);

  const md = [
    "# SafeClick AI: Accuracy Report (v2, real-world data)",
    "",
    `Generated ${generatedAt} from commit \`${commit}\` by \`npm run eval\`, following the pre-registered [protocol](PROTOCOL.md). Numbers are computed, not hand-edited.`,
    "",
    "A message is **flagged** when SafeClick rates it *Needs caution* or *High concern*. Arrows show the change from the v1 engine (baseline recorded at commit `" +
      baseline.commit +
      "` before any v2 changes).",
    "",
    "| Set | Scams / genuine | Scams flagged | Genuine wrongly flagged | Scams at high concern | Speed |",
    "| --- | --- | --- | --- | --- | --- |",
    compareRow("**Test** (held out, real SMS)", baseline.sets.test, sets.test),
    compareRow("**India** (independent, Hinglish/Indian)", baseline.sets.india, sets.india),
    compareRow("Dev (used for tuning)", baseline.sets.dev, sets.dev),
    "",
    "## Data",
    "",
    "- **Test and dev:** the [Mishra & Soni (2022) SMS Phishing Dataset](https://data.mendeley.com/datasets/f45bkkt8pr/1) and the [UCI SMS Spam Collection](https://archive.ics.uci.edu/dataset/228/sms+spam+collection), merged and de-duplicated, then split 50/50 by a hash of each message. Scam = smishing; genuine = ham. Both datasets are CC BY 4.0, downloaded at evaluation time, and not redistributed.",
    "- **India:** hand-written Hinglish and Indian-context messages from the [Bolewar (2026) dataset](https://huggingface.co/datasets/bolewara/hinglish-scam-text-dataset) (CC BY 4.0), excluding rows copied from UCI. Written by a different author; never used for tuning.",
    "- Individual real-world messages are not reproduced in this report.",
    "",
    "## Marketing spam (not the target)",
    "",
    `Unsolicited marketing is labelled *spam* in these datasets. SafeClick flags ${rateText(sets.test.spamFlagged)} of test-set spam; this is reported for transparency and is not counted as detection or false alarm.`,
    "",
    "## The original fictional set (v1 held-out)",
    "",
    `The 80 fictional messages in [heldout.ts](heldout.ts) are **no longer held out**: their misses directly motivated v2 rule changes. For history: scams flagged ${rateText(v1Metrics.detection)}; genuine wrongly flagged ${rateText(v1Metrics.falseAlarm)}.`,
    "",
    "## Honest caveats",
    "",
    "- The dev/test data is dominated by older UK SMS (2000s–2010s) and international smishing; it is not a random sample of the scams people receive in India today.",
    "- The India set is small (see the confidence interval). Six of its messages were seen while inspecting the dataset's format, before the protocol was written; no rule was written for them.",
    "- Rules were improved using dev data and general knowledge of scam tactics; test and india results were computed once, after all changes.",
    "- Pattern matching sees text only. It cannot check a link's real destination or a sender's identity.",
    "",
  ].join("\n");

  writeFileSync(out("./RESULTS.md"), md);
  writeFileSync(out("./results.json"), JSON.stringify({ generatedAt, commit, baseline: baseline.sets, sets, v1HeldOut: v1Metrics }, null, 2) + "\n");
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
        test: summary(sets.test),
        india: summary(sets.india),
        baseline: { test: summary(baseline.sets.test), india: summary(baseline.sets.india) },
      },
      null,
      2,
    ) + "\n",
  );
  console.log(md.split("## Data")[0]);
}, 300_000);
