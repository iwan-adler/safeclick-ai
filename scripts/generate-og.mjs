/**
 * Renders the social preview image (public/og.png, 1200x630) with Playwright.
 * Run after changing the brand or headline numbers: node scripts/generate-og.mjs
 * Numbers must match eval/RESULTS.md.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const summary = JSON.parse(readFileSync("src/lib/data/eval-summary.json", "utf8"));
const pct = (x) => `${Math.round(x * 100)}%`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; font-family: "Segoe UI", Inter, system-ui, sans-serif; background: #0a1029; color: #fff; overflow: hidden; }
  .glow { position: absolute; inset: 0; background: radial-gradient(60% 80% at 0% 0%, rgba(74,107,255,.35), transparent 70%), radial-gradient(50% 70% at 100% 100%, rgba(124,108,242,.25), transparent 70%); }
  .wrap { position: relative; padding: 72px 80px; height: 100%; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 18px; font-size: 34px; font-weight: 600; }
  .brand b { color: #c5d0ff; font-weight: 600; }
  h1 { margin-top: 56px; font-size: 76px; line-height: 1.05; letter-spacing: -0.03em; font-weight: 700; }
  p { margin-top: 22px; font-size: 30px; color: #c3cbe0; max-width: 900px; line-height: 1.35; }
  .stats { margin-top: auto; display: flex; gap: 18px; }
  .stat { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 18px; padding: 16px 24px; font-size: 22px; color: #c3cbe0; }
  .stat strong { display: block; font-size: 38px; color: #fff; }
</style></head><body><div class="glow"></div><div class="wrap">
  <div class="brand">
    <svg width="64" height="64" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#2f54eb"/><path d="M9 0h14a9 9 0 0 1 9 9v7H0V9a9 9 0 0 1 9-9z" fill="#4a6bff" opacity=".55"/><path d="M10 8.5 L10 22 L13.4 18.8 L15.9 24 L18.2 23 L15.7 17.9 L20.4 17.6 Z" fill="#fff"/><rect x="21.2" y="8.5" width="1.9" height="6" rx=".95" fill="#c5d0ff"/><rect x="24.4" y="8.5" width="1.9" height="6" rx=".95" fill="#c5d0ff"/></svg>
    <span>SafeClick <b>AI</b></span>
  </div>
  <h1>Think before you click.</h1>
  <p>Check suspicious messages, screenshots and chats on your device. Explainable warnings in English, Hinglish and Hindi.</p>
  <div class="stats">
    <div class="stat"><strong>${pct(summary.testUnique.detection)}</strong>of new real scams flagged</div>
    <div class="stat"><strong>${(summary.testUnique.falseAlarm * 100).toFixed(1)}%</strong>false alarms</div>
    <div class="stat"><strong>0 bytes</strong>of your messages uploaded</div>
  </div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: "public/og.png" });
await browser.close();
console.log("Wrote public/og.png");
