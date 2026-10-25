/**
 * On-device logistic-regression classifier.
 *
 * The weights are trained offline on the development split of the
 * evaluation corpus (see eval/train.eval.ts and eval/MODEL.md) and shipped as
 * a small JSON file. Prediction is a sum of weights for the features present
 * in the message, so every score can be explained feature by feature. No
 * text leaves the device.
 */
import { extractFeatures, type FeatureHit } from "./features";

export interface ModelWeights {
  version: number;
  trainedAt: string;
  trainedOn: string;
  bias: number;
  features: string[];
  weights: number[];
  /** Probability thresholds chosen on dev to keep false alarms low. */
  thresholds: { moderate: number; strong: number };
}

export interface Contribution {
  feature: string;
  weight: number;
  hits: FeatureHit[];
}

export interface Prediction {
  probability: number;
  /** Features that pushed the score towards "scam", strongest first. */
  contributions: Contribution[];
}

export function createClassifier(model: ModelWeights) {
  const index = new Map(model.features.map((f, i) => [f, i]));

  return function predict(text: string): Prediction {
    const byFeature = new Map<string, FeatureHit[]>();
    for (const hit of extractFeatures(text)) {
      if (!index.has(hit.feature)) continue;
      const list = byFeature.get(hit.feature) ?? [];
      list.push(hit);
      byFeature.set(hit.feature, list);
    }
    let z = model.bias;
    const contributions: Contribution[] = [];
    for (const [feature, hits] of byFeature) {
      const weight = model.weights[index.get(feature)!];
      z += weight;
      if (weight > 0) contributions.push({ feature, weight, hits });
    }
    contributions.sort((a, b) => b.weight - a.weight);
    return { probability: 1 / (1 + Math.exp(-z)), contributions };
  };
}
