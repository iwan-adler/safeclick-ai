import { describe, expect, it } from "vitest";
import { analyzeMessage } from "./analyze";
import { RULES, runRule, sentenceBounds } from "./rules";

function ids(text: string): string[] {
  const r = analyzeMessage(text);
  if (!r.ok) throw new Error(r.message);
  return r.signals.map((s) => s.id);
}

function rule(id: string) {
  const found = RULES.find((r) => r.id === id);
  if (!found) throw new Error(`no rule ${id}`);
  return found;
}

describe("rule metadata", () => {
  it("has unique, stable ids and complete copy", () => {
    const seen = new Set<string>();
    for (const r of RULES) {
      expect(seen.has(r.id)).toBe(false);
      seen.add(r.id);
      expect(r.title.length).toBeGreaterThan(5);
      expect(r.explanation.length).toBeGreaterThan(30);
      expect(r.recommendation.length).toBeGreaterThan(15);
      expect(r.weight).toBeGreaterThan(0);
    }
  });
});

describe("urgency", () => {
  it.each([
    "Act now or lose your reward",
    "Respond within 24 hours",
    "This offer expires tonight",
    "Please reply immediately",
    "FINAL NOTICE: payment overdue",
  ])("flags %s", (text) => expect(ids(text)).toContain("urgency"));

  it("does not flag a calm message", () => {
    expect(ids("See you at lunch on Friday, no rush.")).not.toContain("urgency");
  });
});

describe("credential-request", () => {
  it.each([
    "Please share the OTP you received to cancel the order.",
    "Reply with your PIN to verify your identity.",
    "Enter your password at the link below.",
    "What is the verification code we just sent?",
  ])("flags %s", (text) => expect(ids(text)).toContain("credential-request"));

  it("ignores protective wording from a legitimate sender", () => {
    expect(ids("Your OTP is 482913. Do not share this code with anyone.")).not.toContain("credential-request");
    expect(ids("We will never ask for your PIN or password.")).not.toContain("credential-request");
  });

  it("ignores a mention without a request", () => {
    expect(ids("Your password was changed successfully yesterday.")).not.toContain("credential-request");
  });
});

describe("payment-request", () => {
  it.each([
    "Buy two Google Play gift cards and send photos.",
    "Pay a small processing fee to release your parcel.",
    "Transfer $250 to the account below.",
    "Send payment in bitcoin to this wallet.",
    "A customs duty must be paid before delivery.",
  ])("flags %s", (text) => expect(ids(text)).toContain("payment-request"));

  it("does not flag a receipt", () => {
    expect(ids("Thanks for your order. Your receipt is attached.")).not.toContain("payment-request");
  });
});

describe("account-threat", () => {
  it.each([
    "Your account has been suspended.",
    "Your card will be blocked today.",
    "Legal action will be taken against you.",
    "A warrant has been issued in your name.",
  ])("flags %s", (text) => expect(ids(text)).toContain("account-threat"));
});

describe("impersonation", () => {
  it.each([
    "This is your bank calling about your card.",
    "Message from the IT helpdesk.",
    "The tax department has a notice for you.",
  ])("flags %s", (text) => expect(ids(text)).toContain("impersonation"));

  it("is a low-severity signal on its own", () => {
    const r = analyzeMessage("Message from customer support: your ticket was closed.");
    expect(r.ok && r.level).toBe("lower");
  });
});

describe("bypass-verification", () => {
  it.each([
    "Don't call the bank, just reply here.",
    "Hi mum, this is my new number.",
    "I'm in a meeting and can't talk.",
    "Reply only to this number.",
  ])("flags %s", (text) => expect(ids(text)).toContain("bypass-verification"));
});

describe("unexpected-benefit", () => {
  it.each([
    "Congratulations! You have won a prize.",
    "You are eligible for a refund of $82.",
    "Work from home and earn $300 per day.",
    "Guaranteed returns on your investment.",
  ])("flags %s", (text) => expect(ids(text)).toContain("unexpected-benefit"));
});

describe("secrecy", () => {
  it.each([
    "Keep this between us for now.",
    "Don't tell anyone about this transfer.",
    "This matter is strictly confidential.",
  ])("flags %s", (text) => expect(ids(text)).toContain("secrecy"));

  it("does not treat 'do not share this code' as secrecy", () => {
    expect(ids("Do not share this code with anyone.")).not.toContain("secrecy");
  });
});

describe("personal-info", () => {
  it.each([
    "Please confirm your date of birth and home address.",
    "Upload a photo of your passport to continue.",
    "Reply with your card number and expiry date.",
  ])("flags %s", (text) => expect(ids(text)).toContain("personal-info"));

  it("ignores statements and protective wording", () => {
    expect(ids("Your credit card statement is ready.")).not.toContain("personal-info");
    expect(ids("We will never ask you to send your card number.")).not.toContain("personal-info");
  });
});

describe("remote-access", () => {
  it.each([
    "Install AnyDesk so we can help.",
    "Please share your screen with our agent.",
    "Download the app from support-tool.apk",
  ])("flags %s", (text) => expect(ids(text)).toContain("remote-access"));
});

describe("generic-greeting", () => {
  it("flags generic greetings at low severity", () => {
    const r = analyzeMessage("Dear valued customer, your statement is ready.");
    expect(r.ok && r.signals.find((s) => s.id === "generic-greeting")?.severity).toBe("low");
  });
});

describe("hidden-characters", () => {
  it("flags words mixing Latin and Cyrillic letters", () => {
    // "pаypal" with a Cyrillic "а" (U+0430).
    const text = `Log in to p${String.fromCharCode(0x0430)}ypal now`;
    expect(ids(text)).toContain("hidden-characters");
  });

  it("flags zero-width characters", () => {
    const text = `Your acc${String.fromCharCode(0x200b)}ount needs review`;
    expect(ids(text)).toContain("hidden-characters");
  });

  it("does not flag ordinary non-English text", () => {
    expect(ids("Привет! Увидимся завтра.")).not.toContain("hidden-characters");
    expect(ids("Café crème brûlée à 15h")).not.toContain("hidden-characters");
  });
});

describe("runRule", () => {
  it("returns exact offsets into the original text", () => {
    const text = "Hello. Please act now!";
    const ev = runRule(rule("urgency"), text);
    expect(ev).toHaveLength(1);
    expect(text.slice(ev[0].start, ev[0].end)).toBe("act now");
  });

  it("caps evidence at four spans and never overlaps", () => {
    const text = "urgent urgent urgent urgent urgent urgent";
    const ev = runRule(rule("urgency"), text);
    expect(ev.length).toBeLessThanOrEqual(4);
    for (let i = 1; i < ev.length; i++) expect(ev[i].start).toBeGreaterThanOrEqual(ev[i - 1].end);
  });

  it("splits sentences without breaking on dots inside links", () => {
    const bounds = sentenceBounds("Go to a.example/x now. Then rest.");
    expect(bounds).toHaveLength(2);
  });
});
