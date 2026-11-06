/**
 * Records a captioned, narrated demo walkthrough of the real app (about 3
 * minutes) with Playwright's built-in screen recorder.
 *
 *   npm run build && npm run start -- -p 3300   (in another terminal)
 *   node scripts/record-demo.mjs                 -> demo-video/safeclick-demo.mp4
 *
 * Narration: on Windows every caption (and each title card's VOICE line) is
 * spoken by the system's default text-to-speech voice. Lines are synthesized
 * before recording, and the script waits for each line to finish before the
 * next caption, so speech never overlaps. ffmpeg (FFMPEG env var) then mixes
 * the speech onto the video. DEMO_VOICE=0 records a silent video instead.
 *
 * Everything shown is the live production build driven by a script; captions
 * and the pointer are an overlay added only for the recording. The phone scene
 * frames /simple in a 390px iframe, so this script removes the app's
 * frame-ancestors header for the recording context only.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.DEMO_URL ?? "http://localhost:3300";
const OUT = path.resolve("demo-video/raw");
const SIZE = { width: 1280, height: 720 };
const FONT = `'Segoe UI', 'Nirmala UI', system-ui, sans-serif`;

const VOICE_DIR = path.resolve("demo-video/voice");
const FINAL = path.resolve("demo-video/safeclick-demo.mp4");
const FFMPEG =
  process.env.FFMPEG ??
  ["brag-output/work/tools/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe"].map((f) => path.resolve(f)).find(existsSync);
const VOICE_ON = process.env.DEMO_VOICE !== "0" && process.platform === "win32";

/** Narration for the title cards (they have no caption). */
const VOICE = {
  title: "SafeClick AI. Pause. Understand. Stay safe. A privacy-first scam checker that explains every warning, and runs entirely on your device.",
  problem: "Scams don't win because people have never heard of scams. They win through pressure: a deadline, a threat, a friendly stranger. And they reach the people least able to check them.",
  how: "Under the hood, everything runs in the browser: explainable rules plus a tiny machine-learning model, on-device text recognition, and an offline, installable app. Nothing is uploaded, and it is fully tested.",
  outro: "Try it now, the link is in the description. SafeClick AI is open source on GitHub. Pause. Understand. Stay safe.",
};

/** Small spelling changes so the speech engine pronounces things naturally. */
const speakable = (text) =>
  text
    .replace(/SafeClick/g, "Safe Click")
    .replace(/\b1930\b/g, "1 9 3 0")
    .replace(/\bOCR\b/g, "O C R")
    .replace(/\bUPI\b/g, "U P I")
    .replace(/\bKYC\b/g, "K Y C")
    .replace(/\bOTP\b/g, "O T P")
    .replace(/\$(\d+)/g, "$1 dollar")
    .replace(/о/g, "o")
    .replace(/[“”]/g, "")
    .replace(/…/g, ",");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Every caption in this file, plus the card lines, synthesized up front.
const voiceFiles = new Map();
if (VOICE_ON) {
  const source = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const lines = [...source.matchAll(/say\("[^"]*",\s*"((?:[^"\\]|\\.)+)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
  const all = [...new Set([...lines, ...Object.values(VOICE)])];
  rmSync(VOICE_DIR, { recursive: true, force: true });
  mkdirSync(VOICE_DIR, { recursive: true });
  const jobs = all.map((text, i) => ({ text: speakable(text), file: path.join(VOICE_DIR, `line${String(i).padStart(2, "0")}.wav`) }));
  writeFileSync(path.join(VOICE_DIR, "jobs.json"), JSON.stringify(jobs), "utf8");
  const ps = [
    "Add-Type -AssemblyName System.Speech",
    `$jobs = Get-Content -Raw -Encoding UTF8 '${path.join(VOICE_DIR, "jobs.json")}' | ConvertFrom-Json`,
    "$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)",
    "foreach ($j in $jobs) { $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = 1; $s.SetOutputToWaveFile($j.file, $fmt); $s.Speak($j.text); $s.Dispose() }",
  ].join("\n");
  const psFile = path.join(VOICE_DIR, "synth.ps1");
  writeFileSync(psFile, "﻿" + ps, "utf8");
  execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psFile], { stdio: "inherit" });
  all.forEach((text, i) => {
    const { file } = jobs[i];
    voiceFiles.set(text, { file, ms: ((statSync(file).size - 44) / (22050 * 2)) * 1000 });
  });
  console.log(`Synthesized ${all.length} narration lines`);
}

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
const t0 = Date.now();
const wait = (ms) => page.waitForTimeout(ms);

// Narration timeline: each spoken line's start in the video, in ms.
const spoken = [];
let speechEnd = 0;
async function untilSilent() {
  const left = speechEnd - Date.now();
  if (left > 0) await wait(left);
}
function speak(text) {
  const voice = voiceFiles.get(text);
  if (!voice) return 0;
  spoken.push({ at: Date.now() - t0, file: voice.file });
  speechEnd = Date.now() + voice.ms + 350;
  return voice.ms;
}

async function say(step, text, holdMs = 0) {
  if (text) await untilSilent();
  caption = { step, text };
  await page.evaluate((c) => window.__demoSet?.(c), caption).catch(() => {});
  if (text) speak(text);
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

async function card(html, holdMs, voice) {
  await untilSilent();
  caption = { step: "", text: "" };
  await page.goto("about:blank");
  await page.setContent(`<!doctype html><html><body style="margin:0;height:100vh;display:grid;place-items:center;
    background:radial-gradient(120% 90% at 0% 0%,#2a3f9e 0%,#0b1228 60%);color:#fff;font-family:${FONT}">
    <div style="max-width:1000px;padding:0 60px">${html}</div></body></html>`);
  const ms = voice ? speak(voice) : 0;
  await wait(Math.max(holdMs, ms + 500));
}

const analyze = () => page.getByRole("button", { name: "Analyze", exact: true });

// --- 0:00 Title ---
await card(`
  <div style="display:flex;align-items:center;gap:22px;margin-bottom:26px">
    <div style="width:78px;height:78px;border-radius:20px;background:#2f54eb;display:grid;place-items:center;font-size:42px">✋</div>
    <div style="font-size:64px;font-weight:700;letter-spacing:-.02em">SafeClick AI</div>
  </div>
  <div style="font-size:34px;font-weight:600;color:#c9d4ff">Pause. Understand. Stay safe.</div>
  <div style="font-size:24px;margin-top:22px;color:#e6eaff;line-height:1.45">A privacy-first scam checker that explains every warning<br>and runs entirely on your device.</div>`, 5000, VOICE.title);

// --- Problem ---
await card(`
  <div style="font-size:22px;font-weight:600;color:#9fb0ff;text-transform:uppercase;letter-spacing:.12em;margin-bottom:18px">The problem</div>
  <div style="font-size:40px;font-weight:650;line-height:1.3">Scams don't win because people have never heard of scams.</div>
  <div style="font-size:30px;margin-top:22px;line-height:1.45;color:#e6eaff">They win through <b>pressure</b>: a deadline, a threat, a friendly stranger.<br>
  And they arrive as screenshots and chats, often to people who are least able to check them.</div>`, 7500, VOICE.problem);

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
  </div>`, 10000, VOICE.how);

await card(`
  <div style="font-size:60px;font-weight:700;letter-spacing:-.02em">SafeClick AI</div>
  <div style="font-size:34px;font-weight:600;color:#c9d4ff;margin-top:10px">Pause. Understand. Stay safe.</div>
  <div style="font-size:30px;margin-top:30px;color:#fff;font-weight:600">Try it: safeclick-ai-mu.vercel.app</div>
  <div style="font-size:24px;margin-top:12px;color:#e6eaff">Open source: github.com/iwan-adler/safeclick-ai</div>`, 6000, VOICE.outro);
await untilSilent();

const video = page.video();
await context.close();
await browser.close();
const raw = await video.path();
console.log(raw);

writeFileSync(path.join(OUT, "narration.json"), JSON.stringify(spoken));

if (!FFMPEG) {
  console.log("ffmpeg not found (set FFMPEG); the silent recording is above.");
} else {
  // Lay every spoken line onto one 22.05 kHz mono track at its start time.
  const RATE = 22050;
  const clips = spoken.map((s) => {
    const wav = readFileSync(s.file);
    const data = wav.indexOf("data", 12);
    return { offset: Math.round((s.at / 1000) * RATE) * 2, pcm: wav.subarray(data + 8) };
  });
  const track = Buffer.alloc(Math.max(0, ...clips.map((c) => c.offset + c.pcm.length)));
  for (const c of clips) c.pcm.copy(track, c.offset);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + track.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(track.length, 40);
  const narration = path.join(OUT, "narration.wav");
  writeFileSync(narration, Buffer.concat([header, track]));

  execFileSync(
    FFMPEG,
    [
      "-hide_banner", "-loglevel", "error", "-y", "-i", raw,
      ...(spoken.length ? ["-i", narration, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100"] : []),
      "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", FINAL,
    ],
    { stdio: "inherit" },
  );
  console.log(`${FINAL} (${spoken.length} narrated lines)`);
}
