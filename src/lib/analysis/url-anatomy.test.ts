import { describe, expect, it } from "vitest";
import { decodePunycode, toUnicodeHost, urlAnatomy } from "./url-anatomy";

describe("decodePunycode", () => {
  it("decodes RFC 3492 examples and common lookalikes", () => {
    expect(decodePunycode("mnchen-3ya")).toBe("münchen");
    expect(decodePunycode("80ak6aa92e")).toBe("аррӏе"); // Cyrillic "apple"
    expect(toUnicodeHost("xn--80ak6aa92e.com")).toBe("аррӏе.com");
  });

  it("leaves ordinary and invalid labels unchanged", () => {
    expect(toUnicodeHost("www.example.com")).toBe("www.example.com");
    expect(toUnicodeHost("xn--!!!.com")).toBe("xn--!!!.com");
  });
});

describe("urlAnatomy", () => {
  it("splits a link into labelled parts and names the owner", () => {
    const a = urlAnatomy("https://secure-login.paypal.account-verify.example/signin?id=7")!;
    expect(a.owner).toBe("account-verify.example");
    expect(a.parts.map((p) => p.kind)).toEqual(["scheme", "subdomain", "domain", "path"]);
    expect(a.parts.find((p) => p.kind === "subdomain")?.text).toBe("secure-login.paypal.");
    expect(a.parts.find((p) => p.kind === "path")?.text).toBe("/signin?id=7");
  });

  it("shows text before @ as ignored user info", () => {
    const a = urlAnatomy("https://bank.example@192.0.2.9/login")!;
    expect(a.parts[1]).toEqual({ kind: "userinfo", text: "bank.example@" });
    expect(a.owner).toBe("192.0.2.9");
  });

  it("handles multi-part country domains", () => {
    expect(urlAnatomy("https://www.sbi.co.in")!.owner).toBe("sbi.co.in");
  });

  it("decodes punycode and identifies look-alike characters", () => {
    const a = urlAnatomy("https://xn--80ak6aa92e.com/")!;
    expect(a.displayHost).toBe("аррӏе.com");
    expect(a.lookalikes.map((l) => [l.char, l.script, l.looksLike])).toEqual([
      ["а", "Cyrillic", "a"],
      ["р", "Cyrillic", "p"],
      ["ӏ", "Cyrillic", "l"],
      ["е", "Cyrillic", "e"],
    ]);
  });

  it("does not invent a scheme the message did not contain", () => {
    expect(urlAnatomy("bit.do/claim")!.parts[0].kind).toBe("domain");
  });

  it("returns null for unparseable input", () => {
    expect(urlAnatomy("https://[::1")).toBeNull();
  });
});
