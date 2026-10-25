import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Runs axe-core with WCAG 2.1 A/AA rules and fails on any violation. */
async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(summary, summary.join("\n")).toEqual([]);
}

for (const path of ["/", "/help", "/examples", "/learn", "/guide", "/privacy"]) {
  test(`no WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await audit(page);
  });
}

test("no WCAG A/AA violations on an analysis result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bank OTP request" }).click();
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await page.getByRole("heading", { name: "High concern" }).waitFor();
  await page.waitForTimeout(1000);
  await audit(page);
});

test.describe("dark theme", () => {
  test.use({ colorScheme: "dark" });
  for (const path of ["/", "/help", "/examples", "/learn", "/guide", "/privacy"]) {
    test(`no WCAG A/AA violations on ${path} in dark mode`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await audit(page);
    });
  }

  test("no WCAG A/AA violations on a dark analysis result", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Bank OTP request" }).click();
    await page.getByRole("button", { name: "Analyze", exact: true }).click();
    await page.getByRole("heading", { name: "High concern" }).waitFor();
    await page.waitForTimeout(1000);
    await audit(page);
  });
});
