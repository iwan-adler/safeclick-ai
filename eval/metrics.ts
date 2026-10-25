import { analyzeMessage } from "../src/lib/analysis/analyze";
import type { AnalysisMode, ConcernLevel } from "../src/lib/analysis/types";

export type EvalLabel = "scam" | "ham" | "spam";

export interface EvalItem {
  id: string;
  label: EvalLabel;
  category?: string;
  mode?: AnalysisMode;
  text: string;
}

export interface ItemResult {
  id: string;
  label: EvalLabel;
  category?: string;
  level: ConcernLevel;
  score: number;
  signals: string[];
}

export interface Rate {
  value: number;
  hits: number;
  total: number;
  /** 95% Wilson score interval. */
  low: number;
  high: number;
}

export interface Metrics {
  scams: number;
  hams: number;
  spams: number;
  detection: Rate;
  falseAlarm: Rate;
  spamFlagged: Rate;
  precision: number;
  highOnScams: Rate;
  highOnHams: Rate;
  msPerMessage: number;
}

/** 95% Wilson score interval for a binomial proportion. */
export function wilson(hits: number, total: number, z = 1.96): Rate {
  if (total === 0) return { value: 0, hits, total, low: 0, high: 0 };
  const p = hits / total;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;
  return { value: p, hits, total, low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}

export type Analyzer = (text: string, mode: AnalysisMode) => { level: ConcernLevel; score: number; signals: string[] };

export const defaultAnalyzer: Analyzer = (text, mode) => {
  const r = analyzeMessage(text.slice(0, 5000), { mode });
  if (!r.ok) return { level: "lower", score: 0, signals: [] };
  return { level: r.level, score: r.score, signals: r.signals.map((s) => s.id) };
};

export function runItems(items: EvalItem[], analyzer: Analyzer = defaultAnalyzer): { results: ItemResult[]; msPerMessage: number } {
  const started = performance.now();
  const results = items.map((item) => ({ id: item.id, label: item.label, category: item.category, ...analyzer(item.text, item.mode ?? "message") }));
  return { results, msPerMessage: (performance.now() - started) / Math.max(1, items.length) };
}

const flagged = (r: ItemResult) => r.level !== "lower";

export function computeMetrics(results: ItemResult[], msPerMessage: number): Metrics {
  const scams = results.filter((r) => r.label === "scam");
  const hams = results.filter((r) => r.label === "ham");
  const spams = results.filter((r) => r.label === "spam");
  const tp = scams.filter(flagged).length;
  const fp = hams.filter(flagged).length;
  return {
    scams: scams.length,
    hams: hams.length,
    spams: spams.length,
    detection: wilson(tp, scams.length),
    falseAlarm: wilson(fp, hams.length),
    spamFlagged: wilson(spams.filter(flagged).length, spams.length),
    precision: tp + fp === 0 ? 0 : tp / (tp + fp),
    highOnScams: wilson(scams.filter((r) => r.level === "high").length, scams.length),
    highOnHams: wilson(hams.filter((r) => r.level === "high").length, hams.length),
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
export const rateText = (r: Rate) => `${pct(r.value)} (${r.hits}/${r.total}; 95% CI ${pct(r.low)}–${pct(r.high)})`;
