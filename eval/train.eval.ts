/**
 * Trains the on-device classifier (protocol amendment 2) and writes:
 *   src/lib/analysis/model/weights.json   shipped with the app
 *   eval/MODEL.md                          model card
 *
 * Training data: dev split (scam vs. ham) + fictional examples + v1 fictional
 * set. Never touches test or india. Deterministic: same data, same weights.
 * Usage: npm run train
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { describeFeature, featureSet } from "../src/lib/analysis/model/features";
import { EXAMPLES } from "../src/lib/data/examples";
import { loadCorpus } from "./corpus";
import { INDIA_AUGMENT } from "./augment-india";
import { HELDOUT } from "./heldout";

const out = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

interface Doc {
  text: string;
  y: 0 | 1;
  fold: number;
}

interface Encoded {
  idx: Int32Array;
  y: number;
}

const MIN_DOC_FREQ = 3;
const MAX_FEATURES = 6000;
const ITERATIONS = 400;
const LEARNING_RATE = 0.05;
const LAMBDAS = [1e-4, 3e-4, 1e-3, 3e-3, 1e-2];

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const foldOf = (text: string) => createHash("sha256").update(text).digest()[1] % 5;

function buildVocab(docs: Doc[]): string[] {
  const df = new Map<string, number>();
  for (const d of docs) for (const f of featureSet(d.text)) df.set(f, (df.get(f) ?? 0) + 1);
  return [...df.entries()]
    .filter(([, n]) => n >= MIN_DOC_FREQ)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FEATURES)
    .map(([f]) => f);
}

function encode(docs: Doc[], vocab: string[]): Encoded[] {
  const index = new Map(vocab.map((f, i) => [f, i]));
  return docs.map((d) => ({
    idx: Int32Array.from([...featureSet(d.text)].map((f) => index.get(f)).filter((i): i is number => i !== undefined)),
    y: d.y,
  }));
}

/** L2-regularized logistic regression, full-batch Adam. */
function train(data: Encoded[], dims: number, lambda: number): { w: Float64Array; b: number } {
  const w = new Float64Array(dims);
  let b = 0;
  const m = new Float64Array(dims + 1);
  const v = new Float64Array(dims + 1);
  const grad = new Float64Array(dims + 1);
  for (let t = 1; t <= ITERATIONS; t++) {
    grad.fill(0);
    for (const d of data) {
      let z = b;
      for (const i of d.idx) z += w[i];
      const g = sigmoid(z) - d.y;
      for (const i of d.idx) grad[i] += g;
      grad[dims] += g;
    }
    for (let i = 0; i <= dims; i++) {
      const param = i < dims ? w[i] : b;
      const gi = grad[i] / data.length + (i < dims ? lambda * param : 0);
      m[i] = 0.9 * m[i] + 0.1 * gi;
      v[i] = 0.999 * v[i] + 0.001 * gi * gi;
      const step = (LEARNING_RATE * (m[i] / (1 - 0.9 ** t))) / (Math.sqrt(v[i] / (1 - 0.999 ** t)) + 1e-8);
      if (i < dims) w[i] -= step;
      else b -= step;
    }
  }
  return { w, b };
}

const predict = (d: Encoded, model: { w: Float64Array; b: number }) => {
  let z = model.b;
  for (const i of d.idx) z += model.w[i];
  return sigmoid(z);
};

function logLoss(ps: number[], ys: number[]): number {
  let s = 0;
  for (let i = 0; i < ps.length; i++) {
    const p = Math.min(1 - 1e-12, Math.max(1e-12, ps[i]));
    s -= ys[i] * Math.log(p) + (1 - ys[i]) * Math.log(1 - p);
  }
  return s / ps.length;
}

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
  const neg = order.length - pos;
  return (rankSum - (pos * (pos + 1)) / 2) / (pos * neg);
}

test("train classifier", async () => {
  const corpus = await loadCorpus();
  const docs: Doc[] = [
    ...corpus.dev.filter((m) => m.label !== "spam").map((m) => ({ text: m.text, y: (m.label === "scam" ? 1 : 0) as 0 | 1 })),
    ...HELDOUT.map((m) => ({ text: m.text, y: (m.label === "scam" ? 1 : 0) as 0 | 1 })),
    ...EXAMPLES.map((e) => ({ text: e.message, y: (e.expectedSignals.length > 0 ? 1 : 0) as 0 | 1 })),
    ...INDIA_AUGMENT.map((m) => ({ text: m.text, y: (m.label === "scam" ? 1 : 0) as 0 | 1 })),
  ].map((d) => ({ ...d, fold: foldOf(d.text) }));

  // Cross-validation: vocabulary is rebuilt inside each fold to avoid leakage.
  const cv: { lambda: number; logLoss: number; auc: number }[] = [];
  const oofByLambda = new Map<number, number[]>();
  for (const lambda of LAMBDAS) {
    const oof = new Array<number>(docs.length).fill(0);
    for (let k = 0; k < 5; k++) {
      const trainDocs = docs.filter((d) => d.fold !== k);
      const vocab = buildVocab(trainDocs);
      const model = train(encode(trainDocs, vocab), vocab.length, lambda);
      docs.forEach((d, i) => {
        if (d.fold === k) oof[i] = predict(encode([d], vocab)[0], model);
      });
    }
    const ys = docs.map((d) => d.y);
    cv.push({ lambda, logLoss: logLoss(oof, ys), auc: auc(oof, ys) });
    oofByLambda.set(lambda, oof);
  }
  const best = cv.reduce((a, b) => (b.logLoss < a.logLoss ? b : a));
  const oof = oofByLambda.get(best.lambda)!;

  // Thresholds: at most 1% / 0.2% of genuine training messages flagged out-of-fold.
  const hamScores = docs.map((d, i) => (d.y === 0 ? oof[i] : -1)).filter((p) => p >= 0).sort((a, b) => b - a);
  const quantile = (share: number) => hamScores[Math.floor(share * hamScores.length)] + 1e-6;
  const moderate = Math.max(0.5, quantile(0.01));
  const strong = Math.max(0.8, moderate, quantile(0.002));
  const scamScores = docs.map((d, i) => (d.y === 1 ? oof[i] : -1)).filter((p) => p >= 0);
  const oofRate = (scores: number[], t: number) => scores.filter((p) => p >= t).length / scores.length;

  // Final model on all training data.
  const vocab = buildVocab(docs);
  const model = train(encode(docs, vocab), vocab.length, best.lambda);
  const kept = vocab.map((f, i) => [f, model.w[i]] as const).filter(([, w]) => Math.abs(w) >= 0.02);
  const weights = {
    version: 2,
    trainedAt: new Date().toISOString().slice(0, 10),
    trainedOn: `dev split of Mishra & Soni (2022) + UCI SMS Spam Collection (scam vs. genuine), plus SafeClick's fictional examples and India augmentation set: ${docs.length} messages`,
    bias: Number(model.b.toFixed(4)),
    features: kept.map(([f]) => f),
    weights: kept.map(([, w]) => Number(w.toFixed(4))),
    thresholds: { moderate: Number(moderate.toFixed(4)), strong: Number(strong.toFixed(4)) },
  };
  writeFileSync(out("../src/lib/analysis/model/weights.json"), JSON.stringify(weights) + "\n");

  const top = (sign: 1 | -1) =>
    [...kept]
      .sort((a, b) => sign * (b[1] - a[1]))
      .slice(0, 20)
      .map(([f, w]) => `\`${describeFeature(f)}\` (${w.toFixed(2)})`)
      .join(", ");
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const card = [
    "# Model card: SafeClick on-device classifier",
    "",
    `Trained ${weights.trainedAt} by \`npm run train\` (deterministic).`,
    "",
    "## What it is",
    "",
    "A logistic-regression model over readable features: lowercase words, adjacent word pairs, and normalized tokens (a phone number, a money amount, a link, a 4–6 digit number). A prediction is the sum of the weights of the features present, passed through a sigmoid. It runs in the browser; no text leaves the device.",
    "",
    "## Training data",
    "",
    `- ${weights.trainedOn}.`,
    `- ${docs.filter((d) => d.y === 1).length} scam and ${docs.filter((d) => d.y === 0).length} genuine messages. Marketing spam is excluded.`,
    `- Includes ${INDIA_AUGMENT.length} hand-written, fictional India-context messages ([augment-india.ts](augment-india.ts)) because the public data contains no Indian bank, UPI or delivery alerts; without them the first model flagged genuine Indian transaction SMS.`,
    "- The **test** and **india** evaluation sets were not used in any way.",
    "",
    "## Model selection (5-fold cross-validation inside the training data)",
    "",
    "| L2 strength | Log loss | AUC |",
    "| --- | --- | --- |",
    ...cv.map((c) => `| ${c.lambda} | ${c.logLoss.toFixed(4)} | ${c.auc.toFixed(4)} |`),
    "",
    `Chosen: L2 = ${best.lambda} (lowest log loss). Vocabulary: features appearing in at least ${MIN_DOC_FREQ} messages, at most ${MAX_FEATURES}; ${kept.length} kept after pruning tiny weights.`,
    "",
    "## Decision thresholds (from out-of-fold predictions)",
    "",
    `| Band | Probability ≥ | Genuine flagged (OOF) | Scams flagged (OOF) |`,
    "| --- | --- | --- | --- |",
    `| Moderate | ${moderate.toFixed(3)} | ${pct(oofRate(hamScores, moderate))} | ${pct(oofRate(scamScores, moderate))} |`,
    `| Strong | ${strong.toFixed(3)} | ${pct(oofRate(hamScores, strong))} | ${pct(oofRate(scamScores, strong))} |`,
    "",
    "## Most influential features",
    "",
    `**Towards scam:** ${top(1)}.`,
    "",
    `**Towards genuine:** ${top(-1)}.`,
    "",
    "## Limitations",
    "",
    "- The training data is mostly older UK and international SMS; the model knows little about modern Indian scams. The rules carry most of the India coverage.",
    "- It learns surface patterns. A scammer who writes like a friend can score low.",
    "- Its probability describes similarity to the training data, not the chance that a particular message is a scam.",
    "",
  ].join("\n");
  writeFileSync(out("./MODEL.md"), card);
  console.log(card.split("## Most influential")[0]);
}, 600_000);
