/**
 * Heuristic scoring.
 *
 * The score (0-100) summarizes how many warning patterns appear and how
 * strong they are. It is NOT a calibrated probability that a message is a
 * scam. The steps are:
 *
 * 1. Family grouping: signals that describe the same tactic share a family.
 *    The strongest signal in a family counts in full; each additional one
 *    adds 40% of its weight. This prevents double-counting (for example,
 *    "urgent" and "account suspended" are both pressure tactics).
 *
 * 2. Diminishing combination: family scores are combined as
 *    100 * (1 - (1 - a/100) * (1 - b/100) * ...). Each extra family raises
 *    the score, but by less each time, and the result never exceeds 100.
 *
 * 3. Combination bonuses: a few pairings are characteristic of scams
 *    (for example, asking for a code under time pressure). Each matching
 *    pairing adds a fixed, documented bonus.
 *
 * 4. Categories: below 20 = lower apparent risk, 20-49 = needs caution,
 *    50 and above = high concern.
 */
import type { CombinationNote, ConcernLevel, Signal, SignalFamily } from "./types";

export const FAMILY_SECONDARY_FACTOR = 0.4;

export const LEVEL_THRESHOLDS = { caution: 20, high: 50 } as const;

interface CombinationRule {
  id: string;
  label: string;
  bonus: number;
  /** Every group must have at least one family present. */
  requires: SignalFamily[][];
}

export const COMBINATION_RULES: CombinationRule[] = [
  {
    id: "sensitive-under-pressure",
    label: "Asks for sensitive details while applying pressure",
    bonus: 10,
    requires: [["sensitive-data", "device"], ["pressure"]],
  },
  {
    id: "money-and-isolation",
    label: "Asks for money while discouraging checks or demanding secrecy",
    bonus: 10,
    requires: [["money"], ["isolation"]],
  },
  {
    id: "pay-to-receive",
    label: "Asks you to pay in order to receive a benefit",
    bonus: 8,
    requires: [["money"], ["lure"]],
  },
  {
    id: "link-under-pressure",
    label: "Pushes you to open a link quickly",
    bonus: 6,
    requires: [["links"], ["pressure"]],
  },
  {
    id: "link-and-sensitive",
    label: "Asks for sensitive details alongside a link",
    bonus: 8,
    requires: [["links"], ["sensitive-data"]],
  },
  {
    id: "escalation-to-request",
    label: "Friendly build-up followed by a request",
    bonus: 8,
    requires: [["escalation"], ["sensitive-data", "money", "device"]],
  },
  {
    id: "authority-and-request",
    label: "Claims authority while asking for data or money",
    bonus: 6,
    requires: [["authority"], ["sensitive-data", "money", "device"]],
  },
];

export function familyScores(signals: Signal[]): Map<SignalFamily, number> {
  const byFamily = new Map<SignalFamily, number[]>();
  for (const s of signals) {
    const list = byFamily.get(s.family) ?? [];
    list.push(s.weight);
    byFamily.set(s.family, list);
  }
  const scores = new Map<SignalFamily, number>();
  for (const [family, weights] of byFamily) {
    const [top, ...rest] = [...weights].sort((a, b) => b - a);
    scores.set(family, top + rest.reduce((sum, w) => sum + w * FAMILY_SECONDARY_FACTOR, 0));
  }
  return scores;
}

export function combineFamilies(scores: Iterable<number>): number {
  let remaining = 1;
  for (const s of scores) {
    remaining *= 1 - Math.min(100, Math.max(0, s)) / 100;
  }
  return 100 * (1 - remaining);
}

export function findCombinations(signals: Signal[]): CombinationNote[] {
  const present = new Set(signals.map((s) => s.family));
  return COMBINATION_RULES.filter((rule) =>
    rule.requires.every((group) => group.some((f) => present.has(f))),
  ).map(({ id, label, bonus }) => ({ id, label, bonus }));
}

export function levelFor(score: number): ConcernLevel {
  if (score >= LEVEL_THRESHOLDS.high) return "high";
  if (score >= LEVEL_THRESHOLDS.caution) return "caution";
  return "lower";
}

export function scoreSignals(signals: Signal[]): {
  score: number;
  level: ConcernLevel;
  combinations: CombinationNote[];
} {
  if (signals.length === 0) return { score: 0, level: "lower", combinations: [] };
  const base = combineFamilies(familyScores(signals).values());
  const combinations = findCombinations(signals);
  const bonus = combinations.reduce((sum, c) => sum + c.bonus, 0);
  const score = Math.min(100, Math.round(base + bonus));
  return { score, level: levelFor(score), combinations };
}

export const LEVEL_COPY: Record<ConcernLevel, { label: string; summary: string }> = {
  lower: {
    label: "Lower apparent risk",
    summary:
      "We did not find strong warning patterns. That does not mean the message is safe: only act on requests you were expecting.",
  },
  caution: {
    label: "Needs caution",
    summary:
      "Some warning patterns appear. Verify the request through a channel you trust before you click, reply or pay.",
  },
  high: {
    label: "High concern",
    summary:
      "Several strong warning patterns appear together, a combination common in scams. Do not act on this message until you have verified it independently.",
  },
};
