import { expect, test, type Page } from "@playwright/test";

async function openNav(page: Page, label: string) {
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: new RegExp(label) }).click();
}

test("analyze journey: load example, analyze, expand, complete step, clear", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Think before you click." })).toBeVisible();

  const analyzeButton = page.getByRole("button", { name: "Analyze", exact: true });
  await expect(analyzeButton).toBeDisabled();

  await page.getByRole("button", { name: "Bank OTP request" }).click();
  await expect(page.getByLabel("Message to check")).toHaveValue(/Northwind Bank ALERT/);
  await analyzeButton.click();

  await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible();
  await expect(page.getByText("This is a rule-based estimate, not a probability of fraud.")).toBeVisible();

  // Expand a collapsed warning and use its evidence chip.
  const threat = page.getByRole("button", { name: /^Threatens account loss/ });
  await expect(threat).toHaveAttribute("aria-expanded", "false");
  await threat.click();
  await expect(threat).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Threats of suspension, fines or arrest")).toBeVisible();

  // Clicking a highlight in the annotated message opens its explanation.
  await page.getByRole("button", { name: /^within 10 minutes\. Warning/ }).click();
  await expect(page.getByRole("button", { name: /^Creates time pressure/ })).toHaveAttribute("aria-expanded", "true");

  // Mark a recommended action complete.
  await page.getByText("Do not reply, click links, scan codes").click();
  await expect(page.getByText(/1 of \d+ done/)).toBeVisible();

  // Score explanation disclosure.
  await page.getByRole("button", { name: "What does this score mean?" }).click();
  await expect(page.getByText(/adds up the warning patterns/)).toBeVisible();

  // Clear resets input and results.
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByLabel("Message to check")).toHaveValue("");
  await expect(page.getByText("Your analysis will appear here")).toBeVisible();
});

test("benign message shows lower apparent risk without alarm", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Appointment reminder" }).click();
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Lower apparent risk" })).toBeVisible();
  await expect(page.getByText("No common warning patterns found.")).toBeVisible();
});

test("validates oversized input and renders pasted HTML as inert text", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("Message to check");
  await input.fill("x".repeat(5001));
  await expect(page.getByText("Messages can be up to 5,000 characters.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze", exact: true })).toBeDisabled();

  await input.fill('<img src=x onerror="window.__pwned=1"> Urgent: act now');
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  const annotated = page.getByRole("region", { name: "Your message, annotated" });
  await expect(annotated.getByText('<img src=x onerror="window.__pwned=1">', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  expect(await page.locator("main img").count()).toBe(0);
});

test("examples: filter, search empty state, and load into analyzer", async ({ page }) => {
  await page.goto("/");
  await openNav(page, "Examples");
  await expect(page).toHaveURL(/\/examples$/);

  await page.getByRole("button", { name: "Jobs", exact: true }).click();
  await expect(page.getByText("Showing 1 of")).toBeVisible();

  await page.getByLabel("Search examples").fill("no-such-thing-zzz");
  await expect(page.getByText("No examples match")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByText(/Showing (\d+) of \1 examples/)).toBeVisible();

  await page
    .getByRole("listitem")
    .filter({ hasText: "Colleague asks for gift cards" })
    .getByRole("button", { name: "Analyze this example" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Asks you to keep it secret/ })).toBeVisible();
});

test("learning mode: answer, get feedback, finish, restart", async ({ page }) => {
  await page.goto("/learn");
  const total = await page.getByRole("navigation", { name: "Scenarios" }).getByRole("button").count();
  expect(total).toBeGreaterThanOrEqual(5);

  // First scenario: pick a risky answer to see corrective feedback.
  await page.getByRole("button", { name: /Read the code back/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Risky choice" })).toBeVisible();
  await expect(page.getByText("Why the safest choice works:")).toBeVisible();

  // Remaining scenarios: choose the option marked safest by its feedback text.
  const safest = [
    /Contact Alex on their old number/,
    /Find the company's official careers page/,
    /Check the tracking number/,
    /Check with your manager in person/,
    /Open the portal by typing its address/,
  ];
  for (const name of safest) {
    await page.getByRole("button", { name: /Next scenario/ }).click();
    await page.getByRole("button", { name }).click();
    await expect(page.getByRole("status").filter({ hasText: "Safest choice" })).toBeVisible();
  }
  await page.getByRole("button", { name: "See summary" }).click();
  await expect(page.getByText(/safest option in 5 of 6/)).toBeVisible();
  await expect(page.getByText(/not a measure of how secure you/)).toBeVisible();

  await page.getByRole("button", { name: "Restart training" }).click();
  await expect(page.getByText("0 of 6 answered")).toBeVisible();
});

test("safety guide: keyboard tabs, steps and checklist", async ({ page }) => {
  await page.goto("/");
  await openNav(page, "Safety Guide");
  await expect(page.getByRole("heading", { name: "Know what to do next." })).toBeVisible();
  await expect(page.getByText("Contact your local emergency number now")).toBeVisible();

  const firstTab = page.getByRole("tab").first();
  await firstTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").getByRole("heading", { name: "Account compromise" })).toBeVisible();

  await page.getByRole("button", { name: /Sign out other sessions/ }).click();
  await expect(page.getByText(/Most services have a security page/)).toBeVisible();

  await page.getByText("Enabled two-step verification").click();
  await expect(page.getByText("1 / 6")).toBeVisible();
});

test("privacy page explains local processing and limits", async ({ page }) => {
  await page.goto("/");
  await openNav(page, "Privacy");
  await expect(page.getByRole("heading", { name: /Honest about what we do/ })).toBeVisible();
  await page.getByRole("button", { name: "Do my messages leave my device?" }).click();
  await expect(page.getByText(/makes no network requests/)).toBeVisible();
  await page.getByRole("button", { name: "False positives and false negatives" }).click();
  await expect(page.getByText(/A low score is never a guarantee of safety/)).toBeVisible();
});

test("analysis sends nothing over the network and stores nothing", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));

  const secret = "UNIQUE-MARKER-48151623 share your OTP now at http://192.0.2.1/x";
  await page.getByLabel("Message to check").fill(secret);
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(page.getByRole("heading", { name: /concern|caution/i }).first()).toBeVisible();

  expect(requests.filter((u) => u.includes("48151623") || u.includes("192.0.2.1"))).toEqual([]);
  expect(requests.filter((u) => !u.startsWith("http://localhost"))).toEqual([]);

  const stored = await page.evaluate(() => ({
    local: JSON.stringify({ ...localStorage }),
    session: JSON.stringify({ ...sessionStorage }),
  }));
  expect(stored.local).not.toContain("48151623");
  expect(stored.session).not.toContain("48151623");
  expect(await context.cookies()).toEqual([]);
});

test("no horizontal scrolling on any page", async ({ page }) => {
  for (const path of ["/", "/examples", "/learn", "/guide", "/privacy"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("reduced motion: results appear without the scan animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Parcel redelivery fee" }).click();
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  // No scanning state is shown; the result renders straight away.
  await expect(page.getByText("Checking warning patterns…")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible({ timeout: 300 });
});

test("conversation mode: timeline shows trust-then-request escalation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Wrong number that turns into investing" }).click();
  await expect(page.getByRole("button", { name: "Conversation" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Analyze", exact: true }).click();

  await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Conversation timeline/ })).toBeVisible();
  await expect(page.getByText("Trust, then a request.")).toBeVisible();

  // The request bubble links to the explanation.
  await page.getByRole("button", { name: /Request.*\$200 deposit/ }).click();
  await expect(page.getByRole("button", { name: /^Requests money/ })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: /^Builds trust first, then asks/ })).toBeVisible();

  // Switching mode marks the result as stale.
  await page.getByRole("button", { name: "Single message" }).click();
  await expect(page.getByText("You switched mode since this analysis.")).toBeVisible();
});
