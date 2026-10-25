import { test } from "@playwright/test";

/**
 * Captures screenshots for visual review and the submission gallery.
 * Run with: npm run screenshots  (after npm run build)
 * Output: screenshots/<project>-<name>.png
 */

test("capture key screens", async ({ page }, info) => {
  test.setTimeout(120_000);
  const shot = (name: string) => page.screenshot({ path: `screenshots/${info.project.name}-${name}.png`, fullPage: true });

  await page.setContent(
    '<div style="width:640px;padding:28px;background:#f2f2f7;font:28px/1.4 Arial"><div style="background:#e5e5ea;border-radius:22px;padding:20px 24px">QuickParcel: your parcel is on hold. Pay the redelivery fee at http://192.0.2.44/release within 24 hours.</div></div>',
  );
  const sms = await page.locator("div").first().screenshot();

  await page.goto("/");
  await shot("01-analyze-empty");
  await page.locator('input[type="file"]').setInputFiles({ name: "sms.png", mimeType: "image/png", buffer: sms });
  await page.getByText(/Text added from your screenshot/).waitFor({ timeout: 60_000 });
  await shot("01b-screenshot-read");
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("button", { name: "Bank OTP request" }).click();
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await page.getByRole("heading", { name: "High concern" }).waitFor();
  await page.waitForTimeout(1000);
  await shot("02-analyze-result");

  await page.getByRole("button", { name: "Warn family" }).click();
  await page.getByRole("button", { name: "हिन्दी" }).click();
  await page.waitForTimeout(400);
  await page.locator("dialog canvas").screenshot({ path: `screenshots/${info.project.name}-02c-warning-card-hi.png` });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Wrong number that turns into investing" }).click();
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await page.getByText("Trust, then a request.").waitFor();
  await page.waitForTimeout(1000);
  await shot("02b-conversation");

  await page.goto("/examples");
  await shot("03-examples");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Look-alike payment page" })
    .getByRole("button", { name: "Analyze this example" })
    .click();
  await page.getByText("Link X-ray").first().waitFor();
  await page.waitForTimeout(800);
  await shot("03b-link-xray");

  await page.goto("/help");
  await page.getByRole("button", { name: /I sent money/ }).click();
  await page.getByRole("button", { name: /I shared an OTP/ }).click();
  await page.getByLabel("Amount lost (if any)").fill("Rs.8,500");
  await page.getByLabel("Transaction / UTR / reference IDs").fill("UPI Ref 631204557812");
  await page.waitForTimeout(500);
  await shot("03c-help");

  await page.goto("/learn");
  await page.getByRole("button", { name: /Hang up and call/ }).click();
  await page.waitForTimeout(500);
  await shot("04-learn");

  await page.goto("/guide");
  await shot("05-guide");

  await page.goto("/privacy");
  await shot("06-privacy");
});
