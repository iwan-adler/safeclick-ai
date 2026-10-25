/**
 * Step 1 of eval/PROTOCOL.md: the v1 engine's aggregate numbers on dev,
 * test, test-unique and india. Uses the frozen copy of the v1 engine in
 * eval/baseline-engine, so the "before" numbers are computed on exactly the
 * same (cleaned) data as the final report. Writes eval/baseline.json and
 * prints aggregates only. Usage: FORCE_BASELINE=1 npm run eval:baseline
 */
import { existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { loadCorpus } from "./corpus";
import { analyzeMessage as analyzeV1 } from "./baseline-engine/analyze";
import { computeMetrics, rateText, runItems, type Analyzer } from "./metrics";

const v1: Analyzer = (text, mode) => {
  const r = analyzeV1(text.slice(0, 5000), { mode });
  return r.ok ? { level: r.level, score: r.score, signals: r.signals.map((s) => s.id) } : { level: "lower", score: 0, signals: [] };
};

const OUT = fileURLToPath(new URL("./baseline.json", import.meta.url));

test("record baseline", async () => {
  if (existsSync(OUT) && !process.env.FORCE_BASELINE) {
    console.log("baseline.json already exists; not overwriting (set FORCE_BASELINE=1 to redo).");
    return;
  }
  const corpus = await loadCorpus();
  const sets = Object.fromEntries(
    (["dev", "test", "testUnique", "india"] as const).map((name) => {
      const items = corpus[name].map((m, i) => ({ id: `${name}-${i}`, label: m.label, text: m.text }));
      const run = runItems(items, v1);
      return [name, computeMetrics(run.results, run.msPerMessage)];
    }),
  );
  const commit = execSync("git rev-parse --short HEAD").toString().trim();
  writeFileSync(OUT, JSON.stringify({ engine: "v1 (frozen copy of 631ba39)", computedAtCommit: commit, commit: "631ba39", recordedAt: new Date().toISOString().slice(0, 10), sets }, null, 2) + "\n");
  for (const [name, m] of Object.entries(sets)) {
    console.log(`${name}: scams ${m.scams}, ham ${m.hams}, spam ${m.spams}`);
    console.log(`  detection   ${rateText(m.detection)}`);
    console.log(`  false alarm ${rateText(m.falseAlarm)}`);
  }
}, 120_000);
