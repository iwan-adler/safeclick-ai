import { describe, expect, it } from "vitest";
import { buildPlan } from "./plan";
import { buildIncidentReport, EMPTY_DETAILS, maskSensitive } from "./report";

const ids = (steps: ReturnType<typeof buildPlan>) => steps.map((s) => s.id);

describe("buildPlan", () => {
  it("puts calling 1930 and the bank first when money was sent in India", () => {
    const plan = buildPlan(["paid"], "india");
    expect(ids(plan).slice(0, 2).sort()).toEqual(["call-bank", "report-1930"]);
    expect(plan[0].urgency).toBe("now");
    expect(plan.find((s) => s.id === "report-1930")?.title).toMatch(/1930/);
  });

  it("does not show India numbers outside India", () => {
    const plan = buildPlan(["paid"], "elsewhere");
    expect(JSON.stringify(plan)).not.toMatch(/1930|cybercrime\.gov\.in/);
    expect(ids(plan)).toContain("report-fraud-line");
  });

  it("starts with disconnecting and uninstalling after a remote-access app", () => {
    const plan = buildPlan(["remote-app"], "india");
    expect(ids(plan).slice(0, 2)).toEqual(["disconnect", "uninstall"]);
    expect(ids(plan)).toContain("change-passwords");
  });

  it("tells you to cancel call forwarding after dialling a code", () => {
    const plan = buildPlan(["dial-code"], "india");
    expect(plan[0].id).toBe("cancel-forwarding");
    expect(plan[0].title).toMatch(/##002#/);
  });

  it("keeps a link-only click calm and short", () => {
    const plan = buildPlan(["clicked"], "india");
    expect(plan.some((s) => s.urgency === "now")).toBe(false);
    expect(ids(plan)).toEqual(expect.arrayContaining(["close-page", "save-evidence", "talk"]));
    expect(ids(plan)).not.toContain("call-bank");
  });

  it("never duplicates steps and orders by urgency", () => {
    const plan = buildPlan(["paid", "card", "otp", "password", "remote-app", "dial-code", "id-documents", "clicked", "replied"], "india");
    expect(new Set(ids(plan)).size).toBe(plan.length);
    const order = { now: 0, today: 1, soon: 2 };
    for (let i = 1; i < plan.length; i++) expect(order[plan[i].urgency]).toBeGreaterThanOrEqual(order[plan[i - 1].urgency]);
  });

  it("suggests reporting to the portal even without money loss", () => {
    expect(ids(buildPlan(["otp"], "india"))).toContain("report-portal");
  });
});

describe("maskSensitive", () => {
  it("masks card and account numbers but keeps the last 4 digits", () => {
    expect(maskSensitive("Card 4111 1111 1111 1234 was charged")).toBe("Card ••••••••••••1234 was charged");
    expect(maskSensitive("A/c 123456789012")).toBe("A/c ••••••••9012");
  });

  it("removes OTPs, PINs and passwords", () => {
    expect(maskSensitive("I told him the OTP 482913")).toBe("I told him the OTP [removed]");
    expect(maskSensitive("my PIN is 4321")).toBe("my PIN is [removed]");
  });

  it("leaves dates, amounts and short references alone", () => {
    expect(maskSensitive("On 12-11-2026 I paid Rs.5,000, UTR 412345")).toBe("On 12-11-2026 I paid Rs.5,000, UTR 412345");
  });
});

describe("buildIncidentReport", () => {
  it("includes the details, actions and masked sensitive data", () => {
    const plan = buildPlan(["paid"], "india");
    const report = buildIncidentReport(
      {
        ...EMPTY_DETAILS,
        happenedAt: "12 Nov 2026, 9:40 PM",
        sender: "+91 98XXX XXX12",
        amount: "Rs.8,500",
        transactionIds: "UPI Ref 631204557812",
        message: "Scan QR to receive money. OTP 551122",
      },
      ["paid"],
      plan.slice(0, 1),
      new Date("2026-11-12T16:30:00Z"),
    );
    expect(report).toMatch(/INCIDENT REPORT/);
    expect(report).toMatch(/Amount: Rs\.8,500/);
    expect(report).toMatch(/- I sent money/);
    expect(report).toMatch(/OTP \[removed\]/);
    expect(report).toMatch(/••••••••7812/);
    expect(report).not.toMatch(/631204557812/);
    expect(report).toMatch(new RegExp(`- ${plan[0].title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  });

  it("omits empty fields and says when nothing is recorded", () => {
    const report = buildIncidentReport(EMPTY_DETAILS, [], [], new Date("2026-11-12T00:00:00Z"));
    expect(report).not.toMatch(/Amount:/);
    expect(report).toMatch(/None recorded yet/);
    expect(report).toMatch(/Not provided/);
  });
});
