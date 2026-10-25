import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };
const mobile = { ...devices["Pixel 7"] };

/**
 * Browser tests run against the production build (`npm run build` first),
 * because the offline service worker is only registered in production.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Each worker runs its own Chromium; a small cap keeps runs reliable on laptops.
  workers: 3,
  reporter: [["list"]],
  // Generous timeouts: service-worker tests wait for precaching, which is slow on busy machines.
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", testIgnore: /screenshots/, use: desktop },
    { name: "mobile", testIgnore: /screenshots/, use: mobile },
    // Only run on demand via `npm run screenshots`.
    { name: "shots-desktop", testMatch: /screenshots/, use: desktop },
    { name: "shots-mobile", testMatch: /screenshots/, use: mobile },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
