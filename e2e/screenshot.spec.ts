import { expect, test } from "@playwright/test";

/** Renders a fictional SMS as an image, so the test needs no binary fixtures. */
async function makeScreenshot(page: import("@playwright/test").Page): Promise<Buffer> {
  await page.setContent(`
    <body style="margin:0;background:#f2f2f7;font-family:Arial,sans-serif">
      <div style="width:720px;padding:40px">
        <div style="background:#e5e5ea;border-radius:24px;padding:24px 28px;font-size:30px;line-height:1.4;color:#111">
          Northwind Bank ALERT: Unusual login detected. Share the OTP sent to your phone within 10 minutes or your account will be blocked.
        </div>
      </div>
    </body>`);
  return page.locator("div").first().screenshot();
}

test("reads a screenshot on-device and analyzes the extracted text", async ({ page }) => {
  test.setTimeout(90_000);
  const image = await makeScreenshot(page);

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const external: string[] = [];
  page.on("request", (r) => {
    // blob: URLs are the in-memory image preview, not network requests.
    if (/^(https?|wss?):/.test(r.url()) && !r.url().startsWith("http://localhost")) external.push(r.url());
  });

  await page.locator('input[type="file"]').setInputFiles({ name: "sms.png", mimeType: "image/png", buffer: image });
  await expect(page.getByText(/Text added from your screenshot/)).toBeVisible({ timeout: 60_000 });

  const text = await page.getByLabel("Message to check").inputValue();
  expect(text).toMatch(/OTP/);
  expect(text).toMatch(/blocked/i);

  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible();

  // The engine and model are served by SafeClick itself; nothing goes to a CDN.
  expect(external).toEqual([]);
  // tesseract.js's own IndexedDB cache is disabled.
  const dbs = await page.evaluate(async () => {
    const out: { name?: string; stores: string[]; keys: number }[] = [];
    for (const d of await indexedDB.databases()) {
      const db: IDBDatabase = await new Promise((res, rej) => {
        const r = indexedDB.open(d.name!);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      let keys = 0;
      for (const s of db.objectStoreNames) {
        keys += await new Promise<number>((res) => {
          const r = db.transaction(s).objectStore(s).count();
          r.onsuccess = () => res(r.result);
        });
      }
      out.push({ name: d.name, stores: [...db.objectStoreNames], keys });
      db.close();
    }
    return out;
  });
  expect(dbs).toEqual([]);
});

test("rejects non-image files with a helpful message", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
  // The picker filters to images; a non-image is simply ignored.
  await expect(page.getByText(/Text added from your screenshot/)).toHaveCount(0);
});
