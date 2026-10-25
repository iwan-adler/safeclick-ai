import { describe, expect, it } from "vitest";
import { EXAMPLES } from "../data/examples";
import { analyzeMessage, MAX_MESSAGE_LENGTH } from "./analyze";
import { segmentMessage } from "./highlight";
import { buildRecommendations } from "./recommendations";
import { buildSummaryText } from "./summary";
import type { AnalysisMode, AnalysisResult } from "./types";

function ok(text: string, mode: AnalysisMode = "message"): AnalysisResult {
  const r = analyzeMessage(text, { mode });
  if (!r.ok) throw new Error(r.message);
  return r;
}

describe("input validation", () => {
  it("rejects empty and whitespace-only input", () => {
    expect(analyzeMessage("")).toMatchObject({ ok: false, code: "empty" });
    expect(analyzeMessage("   \n\t ")).toMatchObject({ ok: false, code: "empty" });
  });

  it("rejects oversized input with a helpful message", () => {
    const r = analyzeMessage("a".repeat(MAX_MESSAGE_LENGTH + 1));
    expect(r).toMatchObject({ ok: false, code: "too-long" });
    expect(!r.ok && r.message).toMatch(/5,000/);
  });

  it("accepts input at exactly the limit", () => {
    expect(analyzeMessage("a ".repeat(MAX_MESSAGE_LENGTH / 2)).ok).toBe(true);
  });

  it("handles non-string input defensively", () => {
    expect(analyzeMessage(undefined as unknown as string)).toMatchObject({ ok: false, code: "empty" });
  });
});

describe("benign messages", () => {
  it.each([
    "Hey! Are we still on for coffee at 4?",
    "Your library book is due back on Monday. Thanks for visiting!",
    "Team standup moved to 10:30 tomorrow, same room.",
    "Happy birthday! Hope you have a wonderful day 🎉",
    "Your OTP is 482913. Do not share this code with anyone.",
  ])("scores %s as lower apparent risk", (text) => {
    const r = ok(text);
    expect(r.level).toBe("lower");
    expect(r.score).toBeLessThan(20);
  });

  it("a plain link alone is not a warning sign", () => {
    const r = ok("Slides from today: https://docs.university.example/lecture-5");
    expect(r.signals).toEqual([]);
    expect(r.urls).toHaveLength(1);
    expect(r.score).toBe(0);
  });
});

describe("overlapping signals", () => {
  it("combines many signals into high concern", () => {
    const r = ok(
      "URGENT: your bank account has been suspended. Share the OTP within 10 minutes at http://192.0.2.7/verify or legal action will follow. Don't tell anyone.",
    );
    expect(r.level).toBe("high");
    expect(r.signals.map((s) => s.id)).toEqual(
      expect.arrayContaining(["credential-request", "urgency", "account-threat", "suspicious-link", "secrecy"]),
    );
    expect(r.combinations.length).toBeGreaterThan(0);
  });

  it("orders signals by weight, strongest first", () => {
    const r = ok("Act now! Share your PIN.");
    const weights = r.signals.map((s) => s.weight);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
  });

  it("is deterministic", () => {
    const text = EXAMPLES[0].message;
    expect(analyzeMessage(text)).toEqual(analyzeMessage(text));
  });
});

describe("unicode and unusual characters", () => {
  it.each([
    "😀😀😀 !!! ??? ...",
    "\u0000\u0001 control characters",
    `${String.fromCharCode(0x202e)}reversed text marker`,
    "日本語のメッセージです。明日会いましょう。",
    "मिलते हैं कल",
    "<script>alert(1)</script>",
    "%%%%%%%%%%%%%%%%%%%% ////////// ::::: ;;;;",
    "http://",
    "https://...",
  ])("does not throw for %s", (text) => {
    expect(() => analyzeMessage(text)).not.toThrow();
  });

  it("preserves offsets with emoji and CRLF line endings", () => {
    const text = "🎉🎉 Congratulations!\r\nYou won!";
    const r = ok(text);
    const lure = r.signals.find((s) => s.id === "unexpected-benefit");
    const normalized = text.replace(/\r\n?/g, "\n");
    for (const e of lure?.evidence ?? []) expect(normalized.slice(e.start, e.end)).toBe(e.text);
  });

  it("is case-insensitive", () => {
    expect(ok("SHARE YOUR OTP NOW").signals.map((s) => s.id)).toContain("credential-request");
  });
});

describe("fictional examples library", () => {
  it.each(EXAMPLES.map((e) => [e.id, e] as const))("%s triggers its expected signals", (_id, example) => {
    const r = ok(example.message, example.mode);
    const found = r.signals.map((s) => s.id);
    for (const expected of example.expectedSignals) expect(found).toContain(expected);
  });

  it("the benign reminder has no signals", () => {
    const reminder = EXAMPLES.find((e) => e.id === "dentist-reminder");
    expect(ok(reminder!.message).signals).toEqual([]);
  });

  it("every scam example scores at least 'needs caution'", () => {
    for (const e of EXAMPLES.filter((x) => !["dentist-reminder", "new-device-alert"].includes(x.id))) {
      expect(ok(e.message, e.mode).level, e.id).not.toBe("lower");
    }
  });

  it("uses only reserved example domains or documentation IPs", () => {
    for (const e of EXAMPLES) {
      for (const u of ok(e.message, e.mode).urls) {
        expect(u.host === null || u.host.endsWith(".example") || u.host.startsWith("192.0.2."), u.raw).toBe(true);
      }
    }
  });
});

describe("recommendations", () => {
  it("leads with 'do not engage' for high concern", () => {
    const r = ok(EXAMPLES[0].message);
    expect(r.recommendations[0].id).toBe("no-engage");
  });

  it("gives a gentle reminder, not alarm, for lower risk", () => {
    const actions = buildRecommendations("lower", []);
    expect(actions.map((a) => a.id)).toContain("expected-only");
    expect(actions.map((a) => a.id)).not.toContain("no-engage");
  });

  it("includes a signal-specific action and never duplicates", () => {
    const r = ok("Install AnyDesk now. Install AnyDesk now.");
    expect(r.recommendations.map((a) => a.id)).toContain("signal-remote-access");
    const texts = r.recommendations.map((a) => a.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("is sorted by priority", () => {
    const p = ok(EXAMPLES[1].message).recommendations.map((a) => a.priority);
    expect([...p].sort((a, b) => b - a)).toEqual(p);
  });
});

describe("segmentMessage", () => {
  it("reconstructs the original text exactly", () => {
    const text = EXAMPLES[3].message;
    const r = ok(text);
    expect(segmentMessage(text, r.signals).map((s) => s.text).join("")).toBe(text);
  });

  it("marks evidence segments with their signal ids", () => {
    const text = "Please act now.";
    const r = ok(text);
    const marked = segmentMessage(text, r.signals).filter((s) => s.signalIds.length > 0);
    expect(marked.map((s) => s.text)).toEqual(["act now"]);
    expect(marked[0].signalIds).toEqual(["urgency"]);
  });

  it("returns one segment for text without signals", () => {
    expect(segmentMessage("hello", [])).toEqual([{ text: "hello", start: 0, signalIds: [] }]);
  });
});

describe("summary text", () => {
  it("includes the level and the limitation, but not the message itself", () => {
    const message = EXAMPLES[0].message;
    const text = buildSummaryText(ok(message));
    expect(text).toMatch(/High concern/);
    expect(text).toMatch(/not a probability/);
    expect(text).not.toContain("Northwind");
  });
});

describe("demo script claims (DEMO_SCRIPT.md)", () => {
  it("internship example: high concern with clickable fee and bypass evidence", () => {
    const r = ok(EXAMPLES.find((e) => e.id === "internship-fee")!.message);
    expect(r.level).toBe("high");
    const evidence = r.signals.flatMap((s) => s.evidence.map((e) => e.text.toLowerCase()));
    expect(evidence).toContain("registration fee");
    expect(evidence).toContain("reply only to this number");
  });

  it("documented limitation: the innocent opening message of a slow scam scores low", () => {
    const r = ok("Hi! Is this Rahul? We met at the alumni meetup last month. Hope you're doing well, are you free to chat this week?");
    expect(r.level).toBe("lower");
    expect(r.signals).toEqual([]);
  });

  it("the polite deposit request that v1 rules missed is now caught by the pattern model", () => {
    const r = ok(
      "Hi, it's Jordan from the housing office. Could you confirm your new move-in date and send the deposit to the account below when you get a moment? Thanks!",
    );
    expect(r.signals.map((s) => s.id)).toContain("pattern-model");
    expect(r.level).not.toBe("lower");
    const rulesOnly = analyzeMessage(
      "Hi, it's Jordan from the housing office. Could you confirm your new move-in date and send the deposit to the account below when you get a moment? Thanks!",
      { useModel: false },
    );
    expect(rulesOnly.ok && rulesOnly.level).toBe("lower");
  });
});

describe("demo script claims: new features", () => {
  it("the sample screenshot's text is high concern", () => {
    const r = ok(
      "QuickParcel: your parcel is on hold. Pay the redelivery fee at http://192.0.2.44/release within 24 hours or it will be returned.",
    );
    expect(r.level).toBe("high");
  });

  it("the wrong-number chat: single-message mode under-rates it, conversation mode explains why", () => {
    const ex = EXAMPLES.find((e) => e.id === "wrong-number-investment")!;
    const single = ok(ex.message, "message");
    const convo = ok(ex.message, "conversation");
    expect(convo.score).toBeGreaterThan(single.score);
    expect(convo.signals.map((s) => s.id)).toContain("trust-then-request");
    expect(single.signals.map((s) => s.id)).not.toContain("trust-then-request");
  });
});
