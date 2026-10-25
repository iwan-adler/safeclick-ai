import { analyzeMessage } from "../src/lib/analysis/analyze";
import type { AnalysisMode, ConcernLevel } from "../src/lib/analysis/types";

export interface EvalItem {
  id: string;
  positive: boolean;
  category?: string;
  mode?: AnalysisMode;
  text: string;
}

export interface ItemResult {
  id: string;
  positive: boolean;
  category?: string;
  level: ConcernLevel;
  score: number;
  signals: string[];
}

export interface Metrics {
  positives: number;
  negatives: number;
  /** Flagged = "needs caution" or "high concern". */
  truePositives: number;
  falseNegatives: number;
  falsePositives: number;
  trueNegatives: number;
  detectionRate: number;
  falseAlarmRate: number;
  precision: number;
  /** Share of positives / negatives that reached "high concern". */
  highOnPositives: number;
  highOnNegatives: number;
  msPerMessage: number;
}

export function runItems(items: EvalItem[]): { results: ItemResult[]; msPerMessage: number } {
  const started = performance.now();
  const results = items.map((item) => {
    const r = analyzeMessage(item.text.slice(0, 5000), { mode: item.mode ?? "message" });
    if (!r.ok) throw new Error(`${item.id}: ${r.message}`);
    return {
      id: item.id,
      positive: item.positive,
      category: item.category,
      level: r.level,
      score: r.score,
      signals: r.signals.map((s) => s.id),
    };
  });
  return { results, msPerMessage: (performance.now() - started) / Math.max(1, items.length) };
}

const ratio = (a: number, b: number) => (b === 0 ? 0 : a / b);

export function computeMetrics(results: ItemResult[], msPerMessage: number): Metrics {
  const flagged = (r: ItemResult) => r.level !== "lower";
  const pos = results.filter((r) => r.positive);
  const neg = results.filter((r) => !r.positive);
  const tp = pos.filter(flagged).length;
  const fp = neg.filter(flagged).length;
  return {
    positives: pos.length,
    negatives: neg.length,
    truePositives: tp,
    falseNegatives: pos.length - tp,
    falsePositives: fp,
    trueNegatives: neg.length - fp,
    detectionRate: ratio(tp, pos.length),
    falseAlarmRate: ratio(fp, neg.length),
    precision: ratio(tp, tp + fp),
    highOnPositives: ratio(pos.filter((r) => r.level === "high").length, pos.length),
    highOnNegatives: ratio(neg.filter((r) => r.level === "high").length, neg.length),
    msPerMessage,
  };
}

/** How often each rule fired on a subset of results. */
export function ruleCounts(results: ItemResult[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const r of results) for (const s of r.signals) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
