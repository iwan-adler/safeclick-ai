import { expect, test } from "@playwright/test";

test("emergency help: plan, region, and a masked incident report", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "Already clicked, paid or shared?" })).toBeVisible();
  await expect(page.getByText("Choose what happened above")).toBeVisible();

  await page.getByRole("button", { name: /I sent money/ }).click();
  await expect(page.getByRole("link", { name: /Call 1930 now/ })).toHaveAttribute("href", "tel:1930");
  await expect(page.getByText("Do this now")).toBeVisible();

  await page.getByText("Call your bank or payment app").click();
  await expect(page.getByText(/1 of \d+ done/)).toBeVisible();

  await page.getByLabel("Amount lost (if any)").fill("Rs.8,500");
  await page.getByLabel("Transaction / UTR / reference IDs").fill("UPI Ref 631204557812");
  await page.getByLabel("Anything else").fill("He asked for my OTP 551122");
  const preview = page.locator("#incident-report");
  await expect(preview).toContainText("Amount: Rs.8,500");
  await expect(preview).toContainText("••••••••7812");
  await expect(preview).not.toContainText("631204557812");
  await expect(preview).toContainText("OTP [removed]");
  await expect(preview).toContainText("- Call your bank or payment app");

  await page.getByRole("button", { name: "Elsewhere" }).click();
  await expect(page.getByRole("link", { name: /Call 1930 now/ })).toHaveCount(0);
  await expect(page.getByText("Report to your national fraud or cybercrime service")).toBeVisible();

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByText("Choose what happened above")).toBeVisible();
});

test("from an analysis result to the incident report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Parcel redelivery fee" }).click();
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible();

  await page.getByRole("link", { name: "I already responded" }).click();
  await expect(page).toHaveURL(/\/help$/);
  await page.getByRole("button", { name: "Use the message you analyzed" }).click();
  await expect(page.locator("#incident-report")).toContainText("QuickParcel");
});
