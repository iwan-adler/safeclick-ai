import { describe, expect, it } from "vitest";
import { analyzeMessage } from "../analyze";
import { createClassifier, type ModelWeights } from "./classifier";
import { describeFeature, extractFeatures, featureSet, tokenize } from "./features";
import { MODEL_INFO, runModel } from "./index";

describe("features", () => {
  it("normalizes phone numbers, money, links and codes", () => {
    const values = tokenize("Call 08712300220 to claim £350 at https://x.example code 4041").map((t) => t.value);
    expect(values).toEqual(["call", "<phone>", "to", "claim", "<money>", "at", "<url>", "code", "<code>"]);
  });

  it("keeps exact spans for highlighting", () => {
    const text = "Pay Rs.500 now";
    for (const hit of extractFeatures(text)) expect(text.slice(hit.start, hit.end).length).toBeGreaterThan(0);
    const money = extractFeatures(text).find((h) => h.feature === "t:<money>")!;
    expect(text.slice(money.start, money.end)).toBe("Rs.500");
  });

  it("produces unigrams and bigrams", () => {
    expect(featureSet("you have won")).toEqual(new Set(["w:you", "b:you have", "w:have", "b:have won", "w:won"]));
  });

  it("handles Devanagari words", () => {
    expect(tokenize("आपका खाता बंद").map((t) => t.value)).toEqual(["आपका", "खाता", "बंद"]);
  });

  it("describes features in plain words", () => {
    expect(describeFeature("b:call t:<phone>".replace("t:", ""))).toBe("call a phone number");
    expect(describeFeature("t:<money>")).toBe("a money amount");
  });
});

describe("classifier", () => {
  const tiny: ModelWeights = {
    version: 1,
    trainedAt: "test",
    trainedOn: "test",
    bias: -2,
    features: ["w:claim", "t:<phone>", "w:lunch"],
    weights: [2, 2, -3],
    thresholds: { moderate: 0.5, strong: 0.8 },
  };
  const predict = createClassifier(tiny);

  it("computes a logistic probability from present features", () => {
    expect(predict("claim now").probability).toBeCloseTo(0.5);
    expect(predict("claim 08712300220").probability).toBeCloseTo(1 / (1 + Math.exp(-2)));
    expect(predict("lunch?").probability).toBeLessThan(0.01);
  });

  it("explains predictions with positive contributions only, strongest first", () => {
    const c = predict("claim 08712300220 lunch").contributions;
    expect(c.map((x) => x.feature)).toEqual(["w:claim", "t:<phone>"]);
  });
});

describe("shipped model", () => {
  it("has sane thresholds and provenance", () => {
    expect(MODEL_INFO.thresholds.moderate).toBeGreaterThanOrEqual(0.5);
    expect(MODEL_INFO.thresholds.strong).toBeGreaterThanOrEqual(MODEL_INFO.thresholds.moderate);
    expect(MODEL_INFO.trainedOn).toMatch(/dev split/);
  });

  it("raises a signal for a classic prize scam with evidence from the text", () => {
    const text = "WINNER!! You have been selected to receive a £900 prize reward! To claim call 09061701462 now.";
    const { insight, signal } = runModel(text);
    expect(insight.band).not.toBe("low");
    expect(signal?.id).toBe("pattern-model");
    for (const e of signal!.evidence) expect(text.slice(e.start, e.end)).toBe(e.text);
  });

  it.each([
    "Rs.250.00 debited from A/c XX1234 to Priya via UPI. Ref 412345678901.",
    "Dear Customer, Rs.1,499 credited to your a/c XX9921 on 12-Nov. Avl bal Rs.12,340.50",
    "Your OTP for login is 482913. Do not share it with anyone.",
    "Are we still meeting for coffee at 5?",
  ])("stays quiet on the genuine message %s", (text) => {
    expect(runModel(text).signal).toBeNull();
  });

  it("can be switched off for rules-only analysis", () => {
    const r = analyzeMessage("WINNER!! claim your £900 prize, call 09061701462", { useModel: false });
    expect(r.ok && r.model).toBeUndefined();
    expect(r.ok && r.signals.some((s) => s.id === "pattern-model")).toBe(false);
  });
});
