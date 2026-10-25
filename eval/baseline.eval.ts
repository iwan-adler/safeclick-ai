/**
 * Step 1 of eval/PROTOCOL.md: records the v1 engine's aggregate numbers on
 * dev, test and india before any rule changes. Writes eval/baseline.json.
 * Prints aggregates only. Run once: npm run eval:baseline
 */
import { existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { loadCorpus } from "./corpus";
import { computeMetrics, rateText, runItems } from "./metrics";

const OUT = fileURLToPath(new URL("./baseline.json", import.meta.url));

test("record baseline", async () => {
  if (existsSync(OUT) && !process.env.FORCE_BASELINE) {
    console.log("baseline.json already exists; not overwriting (set FORCE_BASELINE=1 to redo).");
    return;
  }
  const corpus = await loadCorpus();
  const sets = Object.fromEntries(
    (["dev", "test", "india"] as const).map((name) => {
      const items = corpus[name].map((m, i) => ({ id: `${name}-${i}`, label: m.label, text: m.text }));
      const run = runItems(items);
      return [name, computeMetrics(run.results, run.msPerMessage)];
    }),
  );
  const commit = execSync("git rev-parse --short HEAD").toString().trim();
  writeFileSync(OUT, JSON.stringify({ engine: "v1", commit, recordedAt: new Date().toISOString().slice(0, 10), sets }, null, 2) + "\n");
  for (const [name, m] of Object.entries(sets)) {
    console.log(`${name}: scams ${m.scams}, ham ${m.hams}, spam ${m.spams}`);
    console.log(`  detection   ${rateText(m.detection)}`);
    console.log(`  false alarm ${rateText(m.falseAlarm)}`);
  }
}, 120_000);
