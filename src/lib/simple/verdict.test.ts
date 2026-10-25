import { describe, expect, it } from "vitest";
import { analyzeMessage } from "../analysis/analyze";
import type { AnalysisResult } from "../analysis/types";
import { SIMPLE_STRINGS, simpleVerdict, telHref } from "./verdict";

function result(text: string): AnalysisResult {
  const r = analyzeMessage(text);
  if (!r.ok) throw new Error("bad input");
  return r;
}

const scam = "URGENT: your bank account will be blocked today. Share the OTP now.";
const ordinary = "Beta, dinner at 8 tonight. Bring sweets!";

describe("simpleVerdict", () => {
  it("gives a clear stop instruction in Hindi for a scam", () => {
    const v = simpleVerdict(result(scam), "hi");
    expect(v.tone).toBe("danger");
    expect(v.title).toMatch(/रुकिए/);
    expect(v.steps.join(" ")).toMatch(/OTP/);
    expect(v.reasons.length).toBeGreaterThan(0);
    expect(v.reasons.length).toBeLessThanOrEqual(2);
  });

  it("never calls a message safe, even at the lowest level", () => {
    for (const lang of ["hi", "en"] as const) {
      const v = simpleVerdict(result(ordinary), lang);
      expect(v.tone).toBe("calm");
      expect(`${v.title} ${v.steps.join(" ")}`.toLowerCase()).not.toMatch(/\bsafe\b|सुरक्षित/);
      expect(v.steps.join(" ")).toMatch(/OTP/);
      expect(v.reasons).toEqual([]);
    }
  });

  it("speaks only fixed phrases, never the message text", () => {
    const v = simpleVerdict(result(scam), "en");
    expect(v.speech).toContain(v.title);
    expect(v.speech).not.toMatch(/blocked today/);
  });

  it("uses plain reasons and skips the model and generic-greeting signals", () => {
    const v = simpleVerdict(result(`Dear customer, ${scam}`), "en");
    expect(v.reasons.join(" ")).not.toMatch(/Resembles known scam|generic greeting/i);
  });

  it("has every UI string in both languages", () => {
    const keys = (o: object) => Object.keys(o).sort();
    expect(keys(SIMPLE_STRINGS.hi)).toEqual(keys(SIMPLE_STRINGS.en));
  });
});

describe("telHref", () => {
  it("builds tel links from common formats", () => {
    expect(telHref("+91 98765 43210")).toBe("tel:+919876543210");
    expect(telHref("098765-43210")).toBe("tel:09876543210");
  });

  it("rejects junk", () => {
    expect(telHref("abc")).toBeNull();
    expect(telHref("12")).toBeNull();
  });
});
