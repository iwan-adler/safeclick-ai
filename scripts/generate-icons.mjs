/**
 * Renders the SafeClick mark to PNG app icons with Playwright's Chromium.
 * Run once after changing the logo: node scripts/generate-icons.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const mark = (bleed) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <rect width="32" height="32" rx="${bleed ? 0 : 7}" fill="#2f54eb"/>
  <g transform="${bleed ? "translate(4.8 4.8) scale(0.7)" : ""}">
    <path d="M10 8.5 L10 22 L13.4 18.8 L15.9 24 L18.2 23 L15.7 17.9 L20.4 17.6 Z" fill="#fff"/>
    <rect x="21.2" y="8.5" width="1.9" height="6" rx="0.95" fill="#c5d0ff"/>
    <rect x="24.4" y="8.5" width="1.9" height="6" rx="0.95" fill="#c5d0ff"/>
  </g>
</svg>`;

const icons = [
  { file: "icon-192.png", size: 192, bleed: false },
  { file: "icon-512.png", size: 512, bleed: false },
  { file: "icon-maskable-512.png", size: 512, bleed: true },
  { file: "apple-touch-icon.png", size: 180, bleed: true },
];

mkdirSync("public/icons", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, bleed } of icons) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:transparent">${mark(bleed)}</body>`);
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log(`Generated ${icons.length} icons in public/icons`);
