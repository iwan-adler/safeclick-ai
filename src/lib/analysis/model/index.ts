/**
 * Turns the classifier's prediction into an explainable warning signal.
 */
import type { Evidence, ModelInsight, Signal } from "../types";
import { createClassifier, type ModelWeights } from "./classifier";
import { describeFeature } from "./features";
import weightsJson from "./weights.json";

const weights = weightsJson as ModelWeights;
const predict = createClassifier(weights);

export const MODEL_INFO = { trainedOn: weights.trainedOn, trainedAt: weights.trainedAt, thresholds: weights.thresholds };

const MAX_EVIDENCE = 5;

export function runModel(text: string): { insight: ModelInsight; signal: Signal | null } {
  const { probability, contributions } = predict(text);
  const band = probability >= weights.thresholds.strong ? "strong" : probability >= weights.thresholds.moderate ? "moderate" : "low";
  const top = contributions.slice(0, 6).map((c) => ({ label: describeFeature(c.feature), weight: c.weight }));
  const insight: ModelInsight = { probability, band, topFeatures: top };
  if (band === "low") return { insight, signal: null };

  // Evidence: first occurrence of each top feature, without overlaps.
  const evidence: Evidence[] = [];
  for (const c of contributions) {
    const hit = c.hits[0];
    if (evidence.some((e) => hit.start < e.end && e.start < hit.end)) continue;
    evidence.push({ text: text.slice(hit.start, hit.end), start: hit.start, end: hit.end });
    if (evidence.length >= MAX_EVIDENCE) break;
  }
  evidence.sort((a, b) => a.start - b.start);

  const pct = Math.round(probability * 100);
  const words = top
    .slice(0, 4)
    .map((t) => `“${t.label}”`)
    .join(", ");
  return {
    insight,
    signal: {
      id: "pattern-model",
      title: "Resembles known scam messages",
      kind: "model",
      family: "model",
      severity: band === "strong" ? "high" : "medium",
      weight: band === "strong" ? 22 : 14,
      explanation: `A small model trained on real SMS scams and genuine texts rates this message ${pct}% similar to the scams it learned from. The features that pushed its score up most were ${words}. It runs on your device, and like the rules it can be wrong: it measures resemblance, not proof.`,
      evidence,
      recommendation: "Treat the message as unverified. Check it with the organization through a contact you already trust.",
    },
  };
}
