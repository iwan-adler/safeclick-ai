import { describe, expect, it } from "vitest";
import { analyzeUrls, extractUrlCandidates, inspectUrl, urlRiskWeight } from "./urls";

function findingIds(raw: string): string[] {
  return inspectUrl(raw).findings.map((f) => f.id);
}

describe("extractUrlCandidates", () => {
  it("finds scheme, www, IP and bare-domain links", () => {
    const text = "See https://a.example/x, www.b.example and 192.0.2.10/login or c.example/path.";
    expect(extractUrlCandidates(text).map((c) => c.raw)).toEqual([
      "https://a.example/x",
      "www.b.example",
      "192.0.2.10/login",
      "c.example/path",
    ]);
  });

  it("trims trailing punctuation and keeps exact offsets", () => {
    const text = "Visit (https://shop.example/deal).";
    const [c] = extractUrlCandidates(text);
    expect(c.raw).toBe("https://shop.example/deal");
    expect(text.slice(c.start, c.end)).toBe(c.raw);
  });

  it("ignores email addresses and plain words", () => {
    expect(extractUrlCandidates("Email help@bank.example, e.g. tomorrow at 3 p.m.")).toEqual([]);
  });

  it("returns nothing for text without links", () => {
    expect(analyzeUrls("Just a normal sentence.")).toEqual([]);
  });
});

describe("inspectUrl", () => {
  it("does not flag a plain https link", () => {
    expect(findingIds("https://www.clinic.example/appointments")).toEqual([]);
  });

  it("flags numeric IP hosts", () => {
    expect(findingIds("http://192.0.2.44/pay")).toContain("ip-host");
  });

  it("flags plain http", () => {
    expect(findingIds("http://store.example")).toContain("insecure-http");
    // A bare domain was never typed with a scheme, so it is not flagged as http.
    expect(findingIds("store.example")).not.toContain("insecure-http");
  });

  it("flags known link shorteners", () => {
    expect(findingIds("https://bit.ly/abc123")).toContain("shortener");
  });

  it("flags an @ that hides the real host", () => {
    const report = inspectUrl("https://bank.example@192.0.2.9/login");
    expect(report.host).toBe("192.0.2.9");
    expect(report.findings.map((f) => f.id)).toEqual(expect.arrayContaining(["at-symbol", "ip-host"]));
  });

  it("flags punycode and non-ASCII hosts once each", () => {
    expect(findingIds("https://xn--pypal-4ve.example")).toContain("punycode");
    const cyrillic = `https://p${String.fromCharCode(0x0430)}ypal.example`;
    const f = findingIds(cyrillic);
    expect(f).toContain("non-ascii-host");
    expect(f).not.toContain("punycode");
  });

  it("flags brand names on unrelated domains, including digit swaps", () => {
    expect(findingIds("https://paypal-billing.example")).toContain("lookalike-brand");
    expect(findingIds("https://paypa1-help.example")).toContain("lookalike-brand");
    expect(findingIds("https://paypal.com/signin")).not.toContain("lookalike-brand");
  });

  it("flags reassuring keywords and many subdomains", () => {
    expect(findingIds("https://secure-login.example")).toContain("deceptive-keywords");
    expect(findingIds("https://a.b.c.d.example")).toContain("many-subdomains");
  });

  it("flags less common TLDs at a low weight", () => {
    const f = inspectUrl("https://deal.top").findings.find((x) => x.id === "uncommon-tld");
    expect(f?.weight).toBeLessThanOrEqual(10);
  });

  it("flags very long links", () => {
    expect(findingIds(`https://site.example/${"a".repeat(120)}`)).toContain("very-long");
  });

  it("handles malformed links without throwing", () => {
    const r = inspectUrl("http://exa mple");
    expect(r.findings.length).toBeGreaterThanOrEqual(0);
    expect(() => inspectUrl("https://[::1")).not.toThrow();
    expect(findingIds("https://[::1")).toContain("malformed");
  });
});

describe("urlRiskWeight", () => {
  it("is zero without findings and capped at 30", () => {
    expect(urlRiskWeight(analyzeUrls("https://ok.example"))).toBe(0);
    const many = analyzeUrls(
      "http://user@192.0.2.1/a http://bit.ly/x https://paypal-secure-login.a.b.c.top/" + "x".repeat(120),
    );
    expect(urlRiskWeight(many)).toBe(30);
  });
});
