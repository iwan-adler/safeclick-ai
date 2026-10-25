import { expect, test, type Page } from "@playwright/test";

// These tests wait for the service worker to install and precache the app.
test.describe.configure({ timeout: 60_000 });

async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    }
  });
}

/** Submits a form the way Android's share sheet does: multipart POST to /share. */
async function shareViaForm(page: Page, fields: Record<string, string>) {
  await page.evaluate((f) => {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/share";
    form.enctype = "multipart/form-data";
    for (const [name, value] of Object.entries(f)) {
      const input = document.createElement("input");
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }, fields);
}

test("manifest makes the app installable and registers a share target", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.share_target).toMatchObject({ action: "/share", method: "POST", enctype: "multipart/form-data" });
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
});

test("shared text is received on-device and fills the input without auto-analyzing", async ({ page }) => {
  await page.goto("/");
  await waitForServiceWorker(page);

  const serverPosts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") serverPosts.push(r.url());
  });
  page.on("response", (r) => {
    // A response from the network (not the service worker) would mean the share reached the server.
    if (r.request().method() === "POST" && !r.fromServiceWorker()) serverPosts.push(`network:${r.url()}`);
  });

  await shareViaForm(page, { title: "", text: "URGENT: share the OTP now", url: "http://192.0.2.9/verify" });
  await expect(page.getByText("Shared message received.")).toBeVisible();
  await expect(page.getByLabel("Message to check")).toHaveValue("URGENT: share the OTP now\nhttp://192.0.2.9/verify");
  await expect(page).toHaveURL(/\/$/);
  // Not analyzed until the person presses Analyze.
  await expect(page.getByText("Your analysis will appear here")).toBeVisible();
  expect(serverPosts.filter((u) => u.startsWith("network:"))).toEqual([]);

  // The share is handed over once; reloading does not bring it back.
  await page.reload();
  await expect(page.getByLabel("Message to check")).toHaveValue("");
});

test("share fallback without the service worker shows a helpful notice", async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto("/");
  await shareViaForm(page, { text: "hello" });
  await expect(page.getByText("The shared content didn't come through.")).toBeVisible();
  await context.close();
});
