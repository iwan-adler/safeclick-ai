/**
 * Development loop (allowed by eval/PROTOCOL.md): metrics on the dev split,
 * plus samples of dev misses and false alarms to guide rule changes.
 * Never touches the test or india sets. Usage: npm run eval:dev
 */
import { test } from "vitest";
import { loadCorpus } from "./corpus";
import { computeMetrics, defaultAnalyzer, rateText, ruleCounts, runItems } from "./metrics";

test("dev metrics", async () => {
  const { dev } = await loadCorpus();
  const run = runItems(dev.map((m, i) => ({ id: `dev-${i}`, label: m.label, text: m.text })));
  const m = computeMetrics(run.results, run.msPerMessage);
  console.log(`DEV detection   ${rateText(m.detection)}`);
  console.log(`DEV false alarm ${rateText(m.falseAlarm)}`);
  console.log(`DEV spam flagged ${rateText(m.spamFlagged)}`);
  const fa = dev.filter((x) => x.label === "ham" && defaultAnalyzer(x.text, "message").level !== "lower");
  for (const x of fa) {
    const r = defaultAnalyzer(x.text, "message");
    console.log(`FA| ${r.score} ${r.signals.join(",")} | ${x.text.replace(/\s+/g, " ").slice(0, 130)}`);
  }
  const limit = Number(process.env.MISSES ?? 40);
  const misses = dev.filter((x) => x.label === "scam" && defaultAnalyzer(x.text, "message").level === "lower");
  for (const x of misses.slice(0, limit)) {
    const r = defaultAnalyzer(x.text, "message");
    console.log(`MISS| ${r.score} ${r.signals.join(",")} | ${x.text.replace(/\s+/g, " ").slice(0, 150)}`);
  }
  console.log("RULES on flagged scams:", JSON.stringify(ruleCounts(run.results.filter((r) => r.label === "scam" && r.level !== "lower")).slice(0, 12)));
}, 120_000);
