import { describe, expect, it } from "vitest";
import { analyzeMessage } from "./analyze";
import { inspectUrl } from "./urls";

function ids(text: string): string[] {
  const r = analyzeMessage(text);
  if (!r.ok) throw new Error(r.message);
  return r.signals.map((s) => s.id);
}

function level(text: string) {
  const r = analyzeMessage(text);
  return r.ok ? r.level : null;
}

describe("prize-claim", () => {
  it.each([
    "You have won £500 cash! Call now to claim.",
    "Your mobile number has won Rs. 25,00,000 in the KBC lottery",
    "You have been specially selected 2 receive £1000",
    "Congratulations, you have won an iPhone 15",
    "Your Mobile Won 500,000.00euro in our promo",
  ])("flags %s", (t) => expect(ids(t)).toContain("prize-claim"));

  it("does not flag talking about a match", () => {
    expect(ids("We won the match 3-1 last night!")).not.toContain("prize-claim");
  });
});

describe("call-to-action-number", () => {
  it.each(["Call 08712300220 now", "Please call customer care on 9876543210", "Reply to +44 7700 900123 today"])(
    "flags %s",
    (t) => expect(ids(t)).toContain("call-to-action-number"),
  );
  it("does not flag times or prices", () => {
    expect(ids("See you at 9.30 pm, it costs 1500 rupees")).not.toContain("call-to-action-number");
  });
  it("is not enough on its own to raise concern", () => {
    expect(level("Call me on 07700 900123 when you land")).toBe("lower");
  });
});

describe("premium-rate", () => {
  it.each(["Call 09061701462 to claim", "Just 150p/min from landlines", "Txt MUSIC to 87066 now", "Reply STOP. POBox334"])(
    "flags %s",
    (t) => expect(ids(t)).toContain("premium-rate"),
  );
  it("ignores lowercase words before 'to' and a number", () => {
    expect(ids("i'll text you to 9 tonight")).not.toContain("premium-rate");
  });
});

describe("link-cta", () => {
  it.each(["Click here to verify your account", "Is link par click karein", "लिंक पर क्लिक करें"])("flags %s", (t) =>
    expect(ids(t)).toContain("link-cta"),
  );
});

describe("India pack", () => {
  it.each([
    "Dear customer, your SBI KYC has expired. Update now.",
    "Please complete your KYC to avoid account block",
    "Link your PAN with Aadhaar before 31 March",
    "Aapka KYC pending hai, turant update karein",
  ])("kyc-update flags %s", (t) => expect(ids(t)).toContain("kyc-update"));

  it.each([
    "Enter your UPI PIN to receive Rs 5000 cashback",
    "Scan this QR code to receive your refund",
    "Please approve the collect request to get your prize",
  ])("upi-request flags %s", (t) => expect(ids(t)).toContain("upi-request"));

  it.each(["To track your parcel dial *401*9876543210", "Please dial **21*9123456789# to activate"])(
    "dial-code flags %s",
    (t) => expect(ids(t)).toContain("dial-code"),
  );

  it.each([
    "This is CBI. You are under digital arrest for money laundering.",
    "Your FedEx parcel contains illegal drugs and passports",
    "Your electricity will be disconnected tonight at 9.30 pm",
    "Your SIM will be blocked in 2 hours",
  ])("authority-threat-india flags %s", (t) => expect(ids(t)).toContain("authority-threat-india"));

  it("a full KYC scam reaches high concern", () => {
    expect(level("SBI: Your account will be blocked today. Update KYC immediately at http://sbi-kyc-update.example")).toBe("high");
  });

  it("an ordinary UPI receipt is lower risk", () => {
    expect(level("Rs.250.00 debited from A/c XX1234 to Priya via UPI. Ref 412345678901.")).toBe("lower");
  });
});

describe("Hinglish and Hindi", () => {
  it("detects threats, urgency and code requests in Hinglish", () => {
    const found = ids("Aapka account block ho jayega. Turant OTP batayein.");
    expect(found).toEqual(expect.arrayContaining(["account-threat", "urgency", "credential-request"]));
  });

  it("detects Devanagari threats and code requests", () => {
    expect(ids("आपका खाता ब्लॉक हो जाएगा")).toContain("account-threat");
    expect(ids("कृपया ओटीपी शेयर करें")).toContain("credential-request");
  });

  it("respects protective wording", () => {
    expect(ids("Aapka OTP 482913 hai. OTP kisi ke saath share na karein.")).not.toContain("credential-request");
    expect(ids("अपना ओटीपी किसी के साथ शेयर न करें")).not.toContain("credential-request");
  });

  it("detects prizes in Hinglish", () => {
    expect(ids("Badhai ho! Aapko 10 lakh ki lottery lagi hai")).toContain("unexpected-benefit");
  });
});

describe("v2 fixes", () => {
  it("a bare 'arrested' is not a threat to the reader", () => {
    expect(ids("guess who just got arrested the other day")).not.toContain("account-threat");
    expect(ids("A warrant has been issued for your arrest")).toContain("account-threat");
  });

  it("matches 'suspension' and hyphenated de-activation", () => {
    expect(ids("Log in to avoid account suspension")).toContain("account-threat");
    expect(ids("Your ATM card has been De-Activated")).toContain("account-threat");
  });

  it("flags digit-for-letter swaps in words", () => {
    expect(ids("Dear V0DAF0NE customer, you are a W1NNER")).toContain("hidden-characters");
    expect(ids("c u 2day b4 9")).not.toContain("hidden-characters");
  });
});

describe("URL v2", () => {
  const f = (raw: string) => inspectUrl(raw).findings.map((x) => x.id);

  it("reads broken-scheme links and flags them", () => {
    const r = inspectUrl("http:/bit.do/claim-tax");
    expect(r.host).toBe("bit.do");
    expect(r.findings.map((x) => x.id)).toEqual(expect.arrayContaining(["malformed", "shortener"]));
  });

  it("extracts broken-scheme links from text", () => {
    const res = analyzeMessage("Follow our secure link http:Ow.ly/ozvo308t for info");
    expect(res.ok && res.urls[0]?.host).toBe("ow.ly");
  });

  it("flags free hosting and redirect services", () => {
    expect(f("https://secure-banking.web.app/login")).toContain("free-hosting");
    expect(f("https://uk-covid-19.webredirect.org/apply")).toContain("free-hosting");
  });

  it("flags Indian brand lookalikes but not official domains", () => {
    expect(f("http://sbi-kyc-update.example")).toContain("lookalike-brand");
    expect(f("https://www.onlinesbi.sbi/")).not.toContain("lookalike-brand");
    expect(f("https://www.hdfcbank.com/")).not.toContain("lookalike-brand");
    expect(f("https://city-taxis.example")).not.toContain("lookalike-brand");
  });
});
