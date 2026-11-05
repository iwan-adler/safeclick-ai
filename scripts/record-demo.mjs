/**
 * Records a captioned demo walkthrough of the real app (about 2:45) with
 * Playwright's built-in screen recorder.
 *
 *   npm run build && npm run start -- -p 3300   (in another terminal)
 *   node scripts/record-demo.mjs                 -> demo-video/raw/*.webm
 *
 * Everything shown is the live production build driven by a script; captions
 * and the pointer are an overlay added only for the recording. The phone scene
 * frames /simple in a 390px iframe, so this script removes the app's
 * frame-ancestors header for the recording context only.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const BASE = process.env.DEMO_URL ?? "http://localhost:3300";
const OUT = path.resolve("demo-video/raw");
const SIZE = { width: 1280, height: 720 };
const FONT = `'Segoe UI', 'Nirmala UI', system-ui, sans-serif`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let caption = { step: "", text: "" };

const OVERLAY = `(() => {
  if (window.top !== window) return;
  const mount = () => {
    if (document.getElementById("__demo")) return;
    const root = document.createElement("div");
    root.id = "__demo";
    root.innerHTML = \`
      <div id="__cap" style="position:fixed;left:50%;bottom:22px;transform:translateX(-50%);max-width:1060px;width:max-content;
        background:rgba(11,18,40,.92);color:#fff;font:500 23px/1.38 ${FONT};padding:14px 24px;border-radius:14px;
        box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:2147483646;pointer-events:none;text-align:center;transition:opacity .25s"></div>
      <div id="__step" style="position:fixed;right:18px;top:16px;background:#2f54eb;color:#fff;font:600 14px/1 ${FONT};
        padding:9px 13px;border-radius:999px;z-index:2147483646;pointer-events:none;letter-spacing:.02em"></div>
      <div id="__ptr" style="position:fixed;left:-60px;top:-60px;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
        background:rgba(47,84,235,.35);border:3px solid #2f54eb;z-index:2147483647;pointer-events:none;
        transition:left .55s cubic-bezier(.3,.7,.2,1),top .55s cubic-bezier(.3,.7,.2,1),transform .15s"></div>\`;
    document.documentElement.appendChild(root);
    window.__demoSet = (c) => {
      const cap = document.getElementById("__cap");
      const step = document.getElementById("__step");
      cap.textContent = c.text; cap.style.opacity = c.text ? "1" : "0";
      step.textContent = c.step; step.style.opacity = c.step ? "1" : "0";
    };
    window.getCaption?.().then((c) => window.__demoSet(c));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: OUT, size: SIZE },
  serviceWorkers: "block",
  colorScheme: "light",
  reducedMotion: "no-preference",
});
await context.exposeFunction("getCaption", () => caption);
await context.addInitScript(OVERLAY);
// Allow the phone scene's iframe (recording only).
await context.route(`${BASE}/simple**`, async (route) => {
  const response = await route.fetch();
  const headers = { ...response.headers() };
  if (headers["content-security-policy"]) {
    headers["content-security-policy"] = headers["content-security-policy"].replace(/frame-ancestors[^;]*;?/, "");
  }
  delete headers["x-frame-options"];
  await route.fulfill({ response, headers });
});

const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);

async function say(step, text, holdMs = 0) {
  caption = { step, text };
  await page.evaluate((c) => window.__demoSet?.(c), caption).catch(() => {});
  if (holdMs) await wait(holdMs);
}

/** Moves the pointer to an element, pulses it, then clicks. */
async function tap(locator, { click = true, pause = 450 } = {}) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) {
    await page.evaluate(({ x, y }) => {
      const p = document.getElementById("__ptr");
      if (p) { p.style.left = x + "px"; p.style.top = y + "px"; }
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await wait(650);
    await page.evaluate(() => {
      const p = document.getElementById("__ptr");
      if (p) { p.style.transform = "scale(.7)"; setTimeout(() => (p.style.transform = ""), 160); }
    });
  }
  if (click) await locator.click();
  await wait(pause);
}

async function smoothScrollTo(locator, offset = 90) {
  await locator.evaluate((el, off) => {
    const y = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, offset);
  await wait(900);
}

async function card(html, holdMs) {
  caption = { step: "", text: "" };
  await page.goto("about:blank");
  await page.setContent(`<!doctype html><html><body style="margin:0;height:100vh;display:grid;place-items:center;
    background:radial-gradient(120% 90% at 0% 0%,#2a3f9e 0%,#0b1228 60%);color:#fff;font-family:${FONT}">
    <div style="max-width:1000px;padding:0 60px">${html}</div></body></html>`);
  await wait(holdMs);
}

const analyze = () => page.getByRole("button", { name: "Analyze", exact: true });

// --- 0:00 Title ---
await card(`
  <div style="display:flex;align-items:center;gap:22px;margin-bottom:26px">
    <div style="width:78px;height:78px;border-radius:20px;background:#2f54eb;display:grid;place-items:center;font-size:42px">✋</div>
    <div style="font-size:64px;font-weight:700;letter-spacing:-.02em">SafeClick AI</div>
  </div>
  <div style="font-size:34px;font-weight:600;color:#c9d4ff">Pause. Understand. Stay safe.</div>
  <div style="font-size:24px;margin-top:22px;color:#e6eaff;line-height:1.45">A privacy-first scam checker that explains every warning<br>and runs entirely on your device.</div>`, 5000);

// --- Problem ---
await card(`
  <div style="font-size:22px;font-weight:600;color:#9fb0ff;text-transform:uppercase;letter-spacing:.12em;margin-bottom:18px">The problem</div>
  <div style="font-size:40px;font-weight:650;line-height:1.3">Scams don't win because people have never heard of scams.</div>
  <div style="font-size:30px;margin-top:22px;line-height:1.45;color:#e6eaff">They win through <b>pressure</b>: a deadline, a threat, a friendly stranger.<br>
  And they arrive as screenshots and chats, often to people who are least able to check them.</div>`, 7500);

// --- Screenshot check ---
await page.goto(BASE);
await page.waitForLoadState("networkidle");
// A family contact for the phone scene (stored only in this recording browser).
await page.evaluate(() => localStorage.setItem("safeclick-simple", JSON.stringify({ enabled: false, language: "hi", contactName: "Riya", contactPhone: "+91 98765 43210" })));
await say("1 · Check a screenshot", "SafeClick checks a message before you act. Start with a screenshot of a suspicious SMS…", 2500);
await tap(page.getByText("Check a screenshot").first(), { click: false });
await page.locator('input[type="file"]').setInputFiles(path.resolve("demo/sample-sms.png"));
await say("1 · Check a screenshot", "The text is read right here in the browser by a self-hosted OCR engine. The image never leaves the device.");
await page.getByText(/Text added from your screenshot/).waitFor({ timeout: 60_000 });
await wait(1200);
await tap(analyze());
await page.getByRole("heading", { name: "High concern" }).waitFor();
await say("2 · Every warning explained", "High concern, and SafeClick shows exactly why, instead of a black-box verdict.", 3200);

const annotated = page.getByRole("region", { name: "Your message, annotated" });
await smoothScrollTo(annotated);
await say("2 · Every warning explained", "Each risky phrase is highlighted. Tap one to open the warning sign it matches.", 1500);
const highlight = annotated.getByRole("button").first();
await tap(highlight, { pause: 2600 });

const links = page.getByRole("region", { name: /Links in this message/ });
if (await links.count()) {
  await smoothScrollTo(links);
  await say("2 · Every warning explained", "Links are shown as text and taken apart. SafeClick never opens them.", 3800);
}

// --- Conversation mode ---
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await wait(700);
await say("3 · Conversation mode", "Some scams hide across a whole chat. Here is a 'wrong number' that turns into investing.", 1500);
await tap(page.getByRole("button", { name: "Wrong number that turns into investing" }), { pause: 1200 });
await tap(analyze());
await page.getByText("Trust, then a request.").waitFor();
await smoothScrollTo(page.getByRole("heading", { name: /Conversation timeline/ }));
await say("3 · Conversation mode", "Friendly messages first, then a request for a $200 deposit. SafeClick flags the trust-then-request pattern.", 5200);
await tap(page.getByRole("button", { name: /Request.*\$200 deposit/ }), { pause: 2500 });

// --- India pack ---
await page.goto(`${BASE}/examples`);
await say("4 · Built for India", "An India pack understands English, Hinglish and Hindi: UPI PIN and QR tricks, KYC, 'digital arrest', and more.", 2000);
const hinglish = page.getByRole("listitem").filter({ hasText: "Electricity cut-off threat in Hinglish" });
await smoothScrollTo(hinglish, 140);
await wait(800);
await tap(hinglish.getByRole("button", { name: "Analyze this example" }));
await page.getByRole("heading", { name: /concern|caution/i }).first().waitFor();
await say("4 · Built for India", "A Hinglish electricity cut-off threat: the deadline and the fake 'officer' are both caught.", 2000);
await smoothScrollTo(page.getByRole("region", { name: "Your message, annotated" }));
await wait(2200);

// --- Link X-ray ---
await page.goto(`${BASE}/examples`);
const lookalike = page.getByRole("listitem").filter({ hasText: "Look-alike payment page" });
await say("5 · Link X-ray", "Link X-ray splits a link into parts and shows the real domain…", 600);
await smoothScrollTo(lookalike, 140);
await tap(lookalike.getByRole("button", { name: "Analyze this example" }));
const xray = page.getByRole("region", { name: /Links in this message/ });
await xray.waitFor();
await smoothScrollTo(xray);
await say("5 · Link X-ray", "…and names look-alike characters: here a Cyrillic 'о' pretending to be a Latin 'o'.", 5200);

// --- Warn family + emergency ---
await page.goto(BASE);
await tap(page.getByRole("button", { name: "Bank OTP request" }), { pause: 500 });
await tap(analyze());
await page.getByRole("heading", { name: "High concern" }).waitFor();
await say("6 · Protect your family", "One tap turns the result into a warning card for a parent's WhatsApp…", 1200);
await tap(page.getByRole("button", { name: "Warn family" }), { pause: 1500 });
const dialog = page.getByRole("dialog", { name: "Warn a family member" });
await tap(dialog.getByRole("button", { name: "हिन्दी" }));
await say("6 · Protect your family", "…in English or Hindi. The message itself is left out unless you choose a masked excerpt.", 4000);
await page.keyboard.press("Escape");
await wait(600);

await say("7 · Already responded?", "Already clicked, paid or shared? Emergency mode gives a step-by-step plan.", 1000);
await tap(page.getByRole("link", { name: "I already responded" }), { pause: 1200 });
await tap(page.getByRole("button", { name: /I sent money/ }), { pause: 800 });
await smoothScrollTo(page.getByText("Do this now").first(), 120);
await say("7 · Already responded?", "If money was sent, calling India's 1930 cyber-fraud helpline and the bank comes first.", 4200);
const report = page.locator("#incident-report");
await smoothScrollTo(page.getByLabel("Transaction / UTR / reference IDs"), 160);
await page.getByLabel("Transaction / UTR / reference IDs").pressSequentially("UPI Ref 631204557812", { delay: 25 });
await page.getByLabel("Anything else").pressSequentially("He asked for my OTP 551122", { delay: 25 });
await smoothScrollTo(report, 140);
await say("7 · Already responded?", "It also drafts an incident report for the police or bank, masking IDs and codes automatically.", 4000);

// --- Simple mode on a phone ---
caption = { step: "8 · Simple mode", text: "" };
await page.goto("about:blank");
await page.setContent(`<!doctype html><html><body style="margin:0;height:100vh;overflow:hidden;background:linear-gradient(135deg,#eef2ff,#f7f8fc);font-family:${FONT}">
  <div style="position:absolute;left:90px;top:120px;width:560px;color:#0b1228">
    <div style="font-size:18px;font-weight:700;color:#2f54eb;letter-spacing:.1em;text-transform:uppercase">Simple mode</div>
    <div style="font-size:44px;font-weight:700;line-height:1.15;margin-top:12px">Built for my grandparents.</div>
    <div style="font-size:24px;line-height:1.5;margin-top:18px;color:#36405e">Hindi first, with an English switch. Three big buttons. A full-colour answer that says what to do. It never says “safe”.</div>
  </div>
  <div style="position:absolute;right:150px;top:28px;width:330px;height:660px;border-radius:44px;background:#0b1228;padding:12px;box-shadow:0 30px 60px rgba(11,18,40,.35)">
    <iframe id="phone" src="${BASE}/simple" style="width:390px;height:780px;border:0;border-radius:34px;background:#fff;transform:scale(.846);transform-origin:0 0"></iframe>
  </div></body></html>`);
await page.evaluate(OVERLAY);
await wait(400);
await say("8 · Simple mode", "", 0);
const phone = page.frameLocator("#phone");
await phone.getByRole("button", { name: "मैसेज लिखें" }).waitFor();
await wait(2800);
await say("8 · Simple mode", "They paste, pick a screenshot, or type the message.", 800);
await tap(phone.getByRole("button", { name: "मैसेज लिखें" }), { pause: 700 });
await phone.getByLabel("यहाँ मैसेज लिखें या पेस्ट करें").pressSequentially("URGENT: your bank account will be blocked today. Share the OTP now.", { delay: 28 });
await tap(phone.getByRole("button", { name: "जाँचें" }));
await phone.getByRole("alert").filter({ hasText: "रुकिए!" }).waitFor();
await say("8 · Simple mode", "“Stop! This looks like a scam.” Three plain steps, read aloud on request, and one tap to call family.", 6000);
await tap(phone.getByRole("button", { name: "English" }));
await say("8 · Simple mode", "The same answer in English. Messages shared from WhatsApp are checked automatically.", 4500);

// --- Measured ---
await page.goto(`${BASE}/privacy`);
const accuracy = page.getByRole("button", { name: "How accurate is it?" });
await smoothScrollTo(accuracy, 80);
await say("9 · Measured honestly", "Measured with an evaluation plan published before running it, on real public SMS data: 85% of never-seen scams flagged (the first version: 14%), with 0.3% false alarms on 2,393 genuine texts.", 7500);

// --- Honest limitation ---
await page.goto(BASE);
await say("10 · Honest limits", "It's honest about its limits. The opening of a slow romance scam looks innocent…", 1200);
await page.getByLabel("Message to check").pressSequentially("Hi! Is this Rahul? We met at the alumni meetup last month. Are you free to chat this week?", { delay: 18 });
await tap(analyze());
await page.getByRole("heading", { name: "Lower apparent risk" }).waitFor();
await say("10 · Honest limits", "…so it scores low, but SafeClick says low risk is never a guarantee. That's why conversation mode exists.", 5000);

// --- Privacy + build ---
await card(`
  <div style="font-size:22px;font-weight:600;color:#9fb0ff;text-transform:uppercase;letter-spacing:.12em;margin-bottom:18px">How it works</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 40px;font-size:23px;line-height:1.4;color:#e6eaff">
    <div><b style="color:#fff">On-device analysis.</b> Explainable rules plus a 56 KB logistic-regression model, all in the browser.</div>
    <div><b style="color:#fff">Nothing uploaded.</b> No server analysis, no analytics; a Content-Security-Policy blocks outbound requests.</div>
    <div><b style="color:#fff">Screenshots &amp; sharing.</b> Self-hosted Tesseract OCR (WebAssembly) and an Android share target.</div>
    <div><b style="color:#fff">Works offline.</b> Installable PWA; the safety guide is cached for emergencies.</div>
    <div><b style="color:#fff">Tested.</b> 260 unit tests, 42 browser tests on desktop and mobile, and an axe-core WCAG 2.1 AA audit.</div>
    <div><b style="color:#fff">Stack.</b> Next.js, React, TypeScript, Tailwind CSS, tesseract.js, Playwright, Vitest.</div>
  </div>`, 10000);

await card(`
  <div style="font-size:60px;font-weight:700;letter-spacing:-.02em">SafeClick AI</div>
  <div style="font-size:34px;font-weight:600;color:#c9d4ff;margin-top:10px">Pause. Understand. Stay safe.</div>
  <div style="font-size:24px;margin-top:30px;color:#e6eaff">Open source: github.com/iwan-adler/safeclick-ai</div>`, 5000);

const video = page.video();
await context.close();
await browser.close();
console.log(await video.path());
