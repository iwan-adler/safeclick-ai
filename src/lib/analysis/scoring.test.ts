import { describe, expect, it } from "vitest";
import {
  combineFamilies,
  familyScores,
  FAMILY_SECONDARY_FACTOR,
  findCombinations,
  levelFor,
  scoreSignals,
} from "./scoring";
import type { Signal, SignalFamily } from "./types";

function sig(id: string, family: SignalFamily, weight: number): Signal {
  return {
    id,
    title: id,
    kind: "generic",
    family,
    severity: "medium",
    weight,
    explanation: "",
    evidence: [],
    recommendation: "",
  };
}

describe("levelFor", () => {
  it("maps scores to categories at documented thresholds", () => {
    expect(levelFor(0)).toBe("lower");
    expect(levelFor(19)).toBe("lower");
    expect(levelFor(20)).toBe("caution");
    expect(levelFor(49)).toBe("caution");
    expect(levelFor(50)).toBe("high");
    expect(levelFor(100)).toBe("high");
  });
});

describe("familyScores", () => {
  it("counts the strongest signal in a family fully and others partially", () => {
    const scores = familyScores([sig("a", "pressure", 20), sig("b", "pressure", 10)]);
    expect(scores.get("pressure")).toBeCloseTo(20 + 10 * FAMILY_SECONDARY_FACTOR);
  });
});

describe("combineFamilies", () => {
  it("never exceeds 100 and grows with diminishing returns", () => {
    expect(combineFamilies([30])).toBeCloseTo(30);
    expect(combineFamilies([30, 30])).toBeCloseTo(51);
    expect(combineFamilies([100, 100, 100])).toBe(100);
    expect(combineFamilies([])).toBe(0);
  });
});

describe("scoreSignals", () => {
  it("returns zero and lower for no signals", () => {
    expect(scoreSignals([])).toEqual({ score: 0, level: "lower", combinations: [] });
  });

  it("does not double count overlapping signals in one family", () => {
    const one = scoreSignals([sig("a", "pressure", 20)]).score;
    const two = scoreSignals([sig("a", "pressure", 20), sig("b", "pressure", 14)]).score;
    const separate = scoreSignals([sig("a", "pressure", 20), sig("c", "lure", 14)]).score;
    expect(two).toBeGreaterThan(one);
    expect(two).toBeLessThan(separate);
  });

  it("adds documented combination bonuses", () => {
    const signals = [sig("cred", "sensitive-data", 30), sig("urg", "pressure", 14)];
    const combos = findCombinations(signals).map((c) => c.id);
    expect(combos).toContain("sensitive-under-pressure");
    const base = Math.round(combineFamilies([30, 14]));
    expect(scoreSignals(signals).score).toBe(base + 10);
  });

  it("caps the score at 100", () => {
    const signals: Signal[] = [
      sig("a", "sensitive-data", 90),
      sig("b", "pressure", 90),
      sig("c", "money", 90),
      sig("d", "isolation", 90),
      sig("e", "lure", 90),
      sig("f", "links", 90),
      sig("g", "authority", 90),
    ];
    expect(scoreSignals(signals).score).toBe(100);
  });
});
