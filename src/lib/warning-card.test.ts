import { describe, expect, it } from "vitest";
import { analyzeMessage } from "./analysis/analyze";
import { RULES } from "./analysis/rules";
import type { AnalysisResult } from "./analysis/types";
import { buildCardContent, buildCardText, HINDI_SIGNAL_TITLES } from "./warning-card";

function result(text: string): AnalysisResult {
  const r = analyzeMessage(text);
  if (!r.ok) throw new Error("bad input");
  return r;
}

const scam = "URGENT: your SBI account will be blocked. Share the OTP 482913 now at http://192.0.2.7/kyc";

describe("buildCardContent", () => {
  it("summarizes level, top signs and steps in English", () => {
    const c = buildCardContent(result(scam), "en");
    expect(c.levelLabel).toBe("High concern");
    expect(c.signs.length).toBeGreaterThan(0);
    expect(c.signs.length).toBeLessThanOrEqual(4);
    expect(c.steps.join(" ")).toMatch(/OTP/);
    expect(c.steps.join(" ")).toMatch(/1930/);
  });

  it("translates every rule and signal title into Hindi", () => {
    const ids = [...RULES.map((r) => r.id), "suspicious-link", "hidden-characters", "trust-then-request", "pattern-model"];
    for (const id of ids) expect(HINDI_SIGNAL_TITLES[id], id).toBeTruthy();
    const c = buildCardContent(result(scam), "hi");
    expect(c.levelLabel).toBe("बहुत ज़्यादा ख़तरा");
    expect(c.signs.every((s) => /[ऀ-ॿ]/.test(s))).toBe(true);
  });

  it("excludes the message unless asked, and masks it when included", () => {
    expect(buildCardContent(result(scam), "en").excerpt).toBeNull();
    const c = buildCardContent(result(scam), "en", { message: scam, includeExcerpt: true });
    expect(c.excerpt).toMatch(/OTP \[removed\]/);
    expect(c.excerpt).not.toMatch(/482913/);
  });

  it("truncates long excerpts", () => {
    const long = `${"word ".repeat(80)}`;
    const c = buildCardContent(result(`${long} act now`), "en", { message: long, includeExcerpt: true });
    expect(c.excerpt!.length).toBeLessThanOrEqual(140);
  });

  it("keeps a calm tone for lower-risk messages and omits 1930", () => {
    const c = buildCardContent(result("See you at lunch tomorrow!"), "en");
    expect(c.levelLabel).toBe("Lower apparent risk");
    expect(c.steps.join(" ")).not.toMatch(/1930/);
  });

  it("can drop the India helpline outside India", () => {
    expect(buildCardContent(result(scam), "en", { india: false }).steps.join(" ")).not.toMatch(/1930/);
  });
});

describe("buildCardText", () => {
  it("produces a WhatsApp-friendly summary", () => {
    const text = buildCardText(buildCardContent(result(scam), "hi"));
    expect(text).toMatch(/^🚨 /);
    expect(text).toMatch(/\*बहुत ज़्यादा ख़तरा\*/);
    expect(text).toMatch(/✅ /);
  });
});
