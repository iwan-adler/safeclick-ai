import { expect, test, type Page } from "@playwright/test";

const SCAM = "URGENT: your bank account will be blocked today. Share the OTP now.";

async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    }
  });
}

test("simple mode: Hindi verdict for a typed scam, English switch, 1930", async ({ page }) => {
  await page.goto("/simple");
  await expect(page.getByRole("heading", { name: "कोई मैसेज शक वाला लगे? यहाँ जाँचें।" })).toBeVisible();

  await page.getByRole("button", { name: "मैसेज लिखें" }).click();
  await page.getByLabel("यहाँ मैसेज लिखें या पेस्ट करें").fill(SCAM);
  await page.getByRole("button", { name: "जाँचें" }).click();

  const verdict = page.getByRole("alert").filter({ hasText: "रुकिए! यह धोखा (स्कैम) लगता है" });
  await expect(verdict).toBeVisible();
  await expect(verdict).toContainText("OTP");
  await expect(page.getByRole("link", { name: "पैसे चले गए? 1930 पर कॉल करें" })).toHaveAttribute("href", "tel:1930");
  await expect(page.getByRole("button", { name: "परिवार को भेजें" })).toBeVisible();

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Stop! This looks like a scam" })).toBeVisible();

  await page.getByRole("button", { name: "Check another message" }).click();
  await expect(page.getByRole("button", { name: "Paste a message" })).toBeVisible();
});

test("simple mode: an ordinary message is never called safe", async ({ page }) => {
  await page.goto("/simple");
  await page.getByRole("button", { name: "मैसेज लिखें" }).click();
  await page.getByLabel("यहाँ मैसेज लिखें या पेस्ट करें").fill("Beta, dinner at 8 tonight. Bring sweets!");
  await page.getByRole("button", { name: "जाँचें" }).click();
  const verdict = page.getByRole("alert").filter({ hasText: "कोई आम खतरा नहीं दिखा" });
  await expect(verdict).toBeVisible();
  await expect(verdict).toContainText("OTP");
  await expect(page.getByRole("link", { name: /1930/ })).toHaveCount(0);
});

test("simple mode: family contact and opening the app in simple mode", async ({ page }) => {
  await page.goto("/simple");
  await page.getByRole("button", { name: "परिवार का नंबर सेट करें" }).click();
  await page.getByLabel("नाम (जैसे: बेटा, पोती, राहुल)").fill("Riya");
  await page.getByLabel("फ़ोन नंबर").fill("+91 98765 43210");
  await page.getByLabel("ऐप खुलते ही यह आसान स्क्रीन दिखाएँ").check();
  await page.getByRole("button", { name: "सेव करें" }).click();

  await expect(page.getByRole("link", { name: "Riya को कॉल करें" })).toHaveAttribute("href", "tel:+919876543210");

  await page.goto("/");
  await expect(page).toHaveURL(/\/simple$/);
  await expect(page.getByRole("link", { name: "Riya को कॉल करें" })).toBeVisible();
});

test("simple mode: paste from the clipboard checks immediately", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-specific");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/simple");
  await page.evaluate((text) => navigator.clipboard.writeText(text), SCAM);
  await page.getByRole("button", { name: "मैसेज पेस्ट करें" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "रुकिए!" })).toBeVisible();
});

test("simple mode: a message shared from another app is checked automatically", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/simple");
  await page.evaluate(() => localStorage.setItem("safeclick-simple", JSON.stringify({ enabled: true, language: "hi" })));
  await waitForServiceWorker(page);
  await page.evaluate((text) => {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/share";
    form.enctype = "multipart/form-data";
    const input = document.createElement("input");
    input.name = "text";
    input.value = text;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }, SCAM);
  await expect(page).toHaveURL(/\/simple$/);
  await expect(page.getByRole("alert").filter({ hasText: "रुकिए! यह धोखा (स्कैम) लगता है" })).toBeVisible();
});
