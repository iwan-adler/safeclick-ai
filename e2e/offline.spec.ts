import { expect, test } from "@playwright/test";

test("safety guide opens and works offline after a first visit", async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  // Wait until the service worker has installed, precached, and taken control.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    }
  });
  expect(await page.evaluate(async () => Boolean(await caches.match("/guide")))).toBe(true);

  await context.setOffline(true);
  await page.goto("/guide");
  await expect(page.getByRole("heading", { name: "Know what to do next." })).toBeVisible();
  await expect(page.getByText("Saved for offline use")).toBeVisible();

  // Interactions still work because scripts were cached too.
  await page.getByRole("tab").nth(2).click();
  await expect(page.getByRole("tabpanel").getByRole("heading", { name: /OTP & password protection/ })).toBeVisible();
  await page.getByText("My email and banking passwords are unique").click();
  await expect(page.getByText("1 / 4")).toBeVisible();

  // The analyzer itself also loads and runs offline.
  await page.goto("/");
  await page.getByRole("button", { name: "Parcel redelivery fee" }).click();
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible();
  await context.setOffline(false);
});
