import { describe, expect, it } from "vitest";
import { EXAMPLES } from "../data/examples";
import { analyzeMessage } from "./analyze";
import { parseTurns } from "./conversation";
import type { AnalysisResult } from "./types";

function convo(text: string): AnalysisResult {
  const r = analyzeMessage(text, { mode: "conversation" });
  if (!r.ok) throw new Error(r.message);
  return r;
}

const slowBuild = [
  "Sam: Hey, nice to meet you on here!",
  "Me: Hi :)",
  "Sam: How was your day? You seem really kind.",
  "Sam: Good night dear, talk tomorrow.",
  "Sam: I miss you. I'm stuck at customs and need you to send money, just $300 to release my parcel.",
].join("\n");

describe("parseTurns", () => {
  it("splits labelled lines into turns with exact offsets", () => {
    const text = "Alex: hi there\nMe: hello\nAlex: how are you?";
    const { turns, parsed } = parseTurns(text);
    expect(parsed).toBe(true);
    expect(turns.map((t) => t.speaker)).toEqual(["Alex", "Me", "Alex"]);
    expect(turns[1].isUser).toBe(true);
    expect(text.slice(turns[2].start, turns[2].end)).toBe("Alex: how are you?");
  });

  it("supports timestamps and continuation lines", () => {
    const text = "[10:42] Alex: first line\nsecond line\n10:45 PM - Me: ok";
    const { turns } = parseTurns(text);
    expect(turns).toHaveLength(2);
    expect(text.slice(turns[0].start, turns[0].end)).toBe("[10:42] Alex: first line\nsecond line");
    expect(turns[1].speaker).toBe("Me");
  });

  it("never mistakes a link for a speaker", () => {
    const { parsed } = parseTurns("https://a.example/x\nhttps://b.example/y");
    expect(parsed).toBe(false);
  });

  it("falls back to blank-line paragraphs when there are no labels", () => {
    const { turns, parsed } = parseTurns("first message\n\nsecond message\n\nthird");
    expect(parsed).toBe(true);
    expect(turns).toHaveLength(3);
  });

  it("reports unparsed single blocks", () => {
    const { turns, parsed } = parseTurns("just one message");
    expect(parsed).toBe(false);
    expect(turns).toHaveLength(1);
  });
});

describe("trust-then-request escalation", () => {
  it("flags friendly build-up followed by a money request", () => {
    const r = convo(slowBuild);
    const signal = r.signals.find((s) => s.id === "trust-then-request");
    expect(signal).toBeDefined();
    expect(r.conversation?.escalationTurn).toBe(4);
    expect(r.conversation?.turnsBeforeRequest).toBe(3);
    expect(r.conversation?.turns[4].kinds).toContain("escalation");
    expect(r.combinations.map((c) => c.id)).toContain("escalation-to-request");
    expect(r.level).toBe("high");
  });

  it("scores the same thread higher in conversation mode than as a single message", () => {
    const single = analyzeMessage(slowBuild);
    expect(single.ok && convo(slowBuild).score > single.score).toBe(true);
  });

  it("does not flag a request made in the first message", () => {
    const r = convo("Sam: please send money, $300 now\nMe: no\nSam: ok bye");
    expect(r.signals.map((s) => s.id)).not.toContain("trust-then-request");
  });

  it("ignores requests made by the user themself", () => {
    const r = convo("Ana: hi dear!\nAna: how are you?\nAna: nice to meet you\nMe: can you send money $20 for lunch?");
    expect(r.signals.map((s) => s.id)).not.toContain("trust-then-request");
  });

  it("does not flag a friendly chat with no request", () => {
    const r = convo("Ana: hi dear!\nMe: hey\nAna: how was your day?\nAna: miss you\nAna: see you Sunday");
    expect(r.signals).toEqual([]);
    expect(r.level).toBe("lower");
  });

  it("requires rapport or a long build-up", () => {
    const short = convo("Bo: hello\nBo: ok\nBo: right\nBo: send money $50 please");
    expect(short.signals.map((s) => s.id)).not.toContain("trust-then-request");
    const long = convo("Bo: a\nBo: b\nBo: c\nBo: d\nBo: e\nBo: send money $50 please");
    expect(long.signals.map((s) => s.id)).toContain("trust-then-request");
  });

  it("evidence offsets point at the original text", () => {
    const r = convo(slowBuild);
    for (const s of r.signals) for (const e of s.evidence) expect(slowBuild.slice(e.start, e.end)).toBe(e.text);
  });

  it("message mode never includes conversation info", () => {
    const r = analyzeMessage(slowBuild);
    expect(r.ok && r.conversation).toBeUndefined();
  });
});

describe("conversation example", () => {
  it("the investment chat escalates at the deposit request", () => {
    const ex = EXAMPLES.find((e) => e.id === "wrong-number-investment")!;
    const r = convo(ex.message);
    expect(r.level).toBe("high");
    expect(r.conversation?.escalationTurn).toBe(7);
  });
});

describe("new single-message rules", () => {
  const ids = (t: string) => {
    const r = analyzeMessage(t);
    return r.ok ? r.signals.map((s) => s.id) : [];
  };
  it.each(["Let's move to Telegram, it's easier", "Add me on WhatsApp", "Can we continue this on Signal?"])(
    "channel-switch flags %s",
    (t) => expect(ids(t)).toContain("channel-switch"),
  );
  it.each(["Join my trading platform", "Earn 5% daily profit", "My uncle is a trader and has insider tips"])(
    "investment-pitch flags %s",
    (t) => expect(ids(t)).toContain("investment-pitch"),
  );
  it.each(["Start with a $200 deposit", "Just deposit $50 to activate", "invest only ₹5000 today"])(
    "payment-request flags %s",
    (t) => expect(ids(t)).toContain("payment-request"),
  );
  it("does not flag ordinary mentions", () => {
    expect(ids("I'll text you on WhatsApp later about dinner? No wait, see you at 7.")).not.toContain("investment-pitch");
    expect(ids("Your deposit was received. Thank you!")).not.toContain("payment-request");
  });
});
