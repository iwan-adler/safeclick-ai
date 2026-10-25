# SafeClick AI

**Pause. Understand. Stay Safe.**

SafeClick AI is a privacy-first scam-awareness companion. Paste a suspicious message, drop in a screenshot, paste a whole chat thread, or share straight from another app on Android, and SafeClick explains, in plain language, which warning signs it contains, why they matter, and what a safer next step looks like. Everything runs in your browser, including a small machine-learning model and screenshot reading: no account, no backend, no AI API, no tracking. It understands Indian scams (UPI, KYC, "digital arrest") in English, Hinglish and Hindi, and its accuracy is [measured on real SMS data with a pre-registered protocol](eval/RESULTS.md): **85% of new real-world scams flagged with 0.3% false alarms**, up from 14% for the first version.

Built for **SafeSpace Hacks**.

---

## Problem

Scam messages work by creating pressure: a deadline, a threat, a prize, or a familiar name. Most people are not short of warnings that scams exist. What they lack is a quick way to work out, in the moment, whether *this* message is one, and what to do instead of clicking. Existing tools either give a bare "safe/unsafe" verdict with no explanation, or require uploading private messages to a third-party service.

## Target audience

- College students (frequent targets of fake internships, rental and payment scams)
- Indian smartphone users and their families, who face UPI, KYC, "digital arrest" and task-job scams in English, Hinglish and Hindi
- Everyday smartphone and internet users
- Anyone unsure whether an SMS, email, job offer, payment request or social media message is trustworthy
- People who want to build safer habits without technical knowledge

## Solution

1. **Analyze**: paste a message, **check a screenshot** (text is read on-device), or switch to **conversation mode** for a whole chat thread. Explainable rules and a small on-device model check it locally and return a heuristic concern level (*Lower apparent risk*, *Needs caution*, *High concern*), the exact words that triggered each warning, a plain-language explanation, and a checklist of next steps.
2. **Examples**: fifteen fictional messages, including four India-specific scams (UPI QR "payment", KYC in Hindi, electricity cut-off in Hinglish, "digital arrest") and two genuine or mixed messages, that can be filtered, searched and loaded into the analyzer.
3. **Learn**: eight interactive scenarios (including a UPI QR buyer and a "CBI" video call) where you choose how to respond and get immediate feedback on why the safest option works.
4. **Safety Guide**: step-by-step guidance and checklists for suspicious messages, account compromise, OTP/password protection, financial fraud, lost devices and personal safety, with India's verified reporting channels (1930, cybercrime.gov.in, Chakshu). Available offline after the first visit.
5. **Privacy & Limitations**: an honest explanation of how analysis works, what is (not) stored, measured accuracy, and where the tool's judgment ends.
6. **Install and share** (Android): SafeClick installs as an app and appears in the system share sheet, so a suspicious text or screenshot can be sent to it in two taps. Shared content is handled on the device by the service worker.

## Features

| Area | What it does |
| --- | --- |
| Screenshot checking | Upload, paste (Ctrl+V) or drag-and-drop an image; text is read in the browser with Tesseract (self-hosted, about 7 MB, cached for offline use); progress and cancel; text is placed in the box for review, never auto-analyzed |
| Conversation mode | Parses chat threads ("Name: message", timestamps, or blank-line paragraphs), shows a chat-style timeline, and flags **trust-then-request** escalation: several request-free messages, often with rapport, followed by a request for money, codes, details or device access |
| Install & share | Web app manifest, maskable icons, an install button that appears only when the browser supports it, and an Android share target (text, links and screenshots) |
| On-device model | Logistic regression over readable features (words, word pairs, phone/money/link tokens), 56 KB, trained on real SMS data; adds a "Resembles known scam messages" signal and shows the words that pushed its score up |
| India pack | UPI PIN/QR/collect requests, KYC/PAN/Aadhaar updates, USSD call-forwarding codes, digital arrest, courier-drug, SIM and electricity threats, Indian bank lookalike domains, Hinglish and Devanagari phrasing |
| Accuracy report | Pre-registered evaluation on public SMS datasets with a held-out test set, near-duplicate removal, an independent India set, confidence intervals, an ablation (rules vs. rules + model) and model calibration; headline numbers are shown in the app |
| Message analyzer | Character counter, 5,000-character limit with validation, Ctrl/Cmd+Enter shortcut, quick example chips, brief scan animation, Clear and "Check another message" |
| Results | Animated gauge and scale, concern category, "What does this score mean?" explainer, limitation notice, annotated message with clickable highlights, expandable warning cards with clickable evidence, link report (links shown as text, never opened), completable next-step checklist, copy summary (excludes the message itself), stale-result notice when the text is edited |
| Examples | Category filters, keyword search, empty state with reset, expected warning chips, expandable safe next step, "Analyze this example" |
| Learning mode | Eight scenarios, three options each, immediate feedback, progress bar and step navigation, previous/next/skip, final summary with review links, restart |
| Safety guide | Keyboard-accessible tabs, expandable steps, checklists with progress, copy and `.txt` download, India's verified reporting channels and no invented numbers, verified offline indicator |
| Privacy page | Expandable explanations; the scoring table is generated from the live rule definitions |
| Accessibility | Semantic landmarks, skip link, labelled controls, `aria-expanded`/`aria-pressed`/`aria-current`, focus-visible styles, focus-trapped mobile menu with Escape support, live regions for results and progress, `prefers-reduced-motion` support |

## How the analysis works

The engine lives in [`src/lib/analysis`](src/lib/analysis) and is pure TypeScript with no DOM, network or storage access.

**Signals detected** (stable ids in brackets):

| Signal | Example trigger | Weight |
| --- | --- | --- |
| Asks for a code, PIN or password `credential-request` | "share the OTP" | 30 |
| Requests money or an unusual payment `payment-request` | gift cards, crypto, "processing fee" | 26 |
| Asks you to install an app or share your screen `remote-access` | AnyDesk, "share your screen" | 26 |
| Requests sensitive personal details `personal-info` | "confirm your date of birth" | 24 |
| Asks you to keep it secret `secrecy` | "keep this between us" | 22 |
| Threatens account loss or legal trouble `account-threat` | "will be blocked", "legal action" | 20 |
| Discourages normal checks `bypass-verification` | "new number", "don't call the bank" | 18 |
| Offers an unexpected prize, refund or job `unexpected-benefit` | "you have won", "earn $500 per week" | 16 |
| Builds trust first, then asks `trust-then-request` (conversation mode) | several friendly messages, then "deposit $200" | 22 |
| Pitches an investment or trading opportunity `investment-pitch` | "30% weekly returns", "my uncle is a trader" | 18 |
| Moves the conversation to another app `channel-switch` | "let's move to Telegram" | 14 |
| Creates time pressure `urgency` | "within 10 minutes", "act now" | 14 |
| Uses hidden or look-alike characters `hidden-characters` | Cyrillic letters in Latin words, zero-width characters | 14 |
| Claims to be from an organization `impersonation` | "your bank", "IT help desk" | 10 |
| Uses a generic greeting `generic-greeting` | "Dear customer" | 6 |
| Link has unusual characteristics `suspicious-link` | see below | up to 30 |
| Says you won money or a prize `prize-claim` | "you have won £500", "Rs.25,00,000 lottery" | 20 |
| Uses a premium-rate number or per-message charge `premium-rate` | 09xx numbers, "150p/min", "Txt WIN to 80086" | 14 |
| Asks you to call or text a number `call-to-action-number` | "call customer care on 98…" | 12 |
| Pushes you to open a link `link-cta` | "click here", "link par click karein" | 8 |
| **India:** Asks for your UPI PIN or to scan/approve a request `upi-request` | "enter UPI PIN to receive" | 26 |
| **India:** Asks you to update KYC or link PAN/Aadhaar `kyc-update` | "your KYC has expired" | 24 |
| **India:** Threatens arrest, disconnection or a police case `authority-threat-india` | "digital arrest", "bijli kat jayegi" | 24 |
| **India:** Asks you to dial a code starting with * `dial-code` | "dial *401*…" | 22 |
| Resembles known scam messages `pattern-model` (on-device model) | model probability ≥ 0.5 / ≥ 0.875 | 14 / 22 |

Rules for codes and personal details only fire when the same sentence contains a request verb, and are suppressed by protective wording ("**never** share this code"), so a genuine OTP delivery message scores 0. Request verbs, protective wording, threats and urgency are also recognized in Hinglish ("OTP batayein", "block ho jayega", "turant") and Hindi ("ओटीपी शेयर करें").

**URL heuristics** ([`urls.ts`](src/lib/analysis/urls.ts)) parse links as strings only: numeric IP hosts, punycode or non-ASCII hosts, link shorteners, `@` in the address, plain `http://`, many sub-domains, brand names on unrelated domains (including digit swaps like `paypa1`), reassuring keywords (`secure-login`), less common TLDs, very long links, malformed addresses, broken schemes used to dodge filters (`http:/bit.do/x`), free hosting and redirect services, and Indian bank and wallet lookalikes (`sbi-kyc-update…`), with official domains allow-listed. A plain HTTPS link with none of these is listed but not flagged.

**Scoring** ([`scoring.ts`](src/lib/analysis/scoring.ts)):

1. Rules are grouped into *families* (e.g. urgency and threats are both "pressure"). The strongest rule in a family counts in full, others add 40%, so overlapping rules are not double-counted.
2. Families combine with diminishing returns: `100 × (1 − Π(1 − familyScore/100))`, which never exceeds 100.
3. Seven documented combination bonuses (+6 to +10) apply to pairings typical of scams, such as a code request under time pressure.
4. Categories: `< 20` lower apparent risk, `20–49` needs caution, `≥ 50` high concern.

The score is **not a probability** and was not calibrated against a dataset. The UI says so next to every result.

## Measured accuracy

`npm run eval` scores the engine on public, CC BY 4.0 SMS datasets following a protocol committed **before** any results existed ([eval/PROTOCOL.md](eval/PROTOCOL.md)). Official results ([eval/RESULTS.md](eval/RESULTS.md)):

| Set | v1 engine | v2 rules | v2 rules + model | False alarms (v2) |
| --- | --- | --- | --- | --- |
| **Test-unique**: 107 real scams, 2,393 genuine, held out, no near-duplicates of training data | 14.0% | 58.9% | **85.0%** (95% CI 77–91%) | 0.3% |
| **India**: 47 scams, 40 genuine, independent author, Hinglish and Indian English | 66.0% | 80.9% | **85.1%** (95% CI 72–93%) | 2.5% (1 of 40) |

- Rules were tuned and the model trained on a separate dev half; test messages were never inspected individually.
- Scam texts are often templates, so the headline set removes test messages that are near-copies of dev messages.
- The model alone has AUC 0.996 on test-unique; its calibration table is in the report.
- Caveats: the data is mostly older UK and international SMS, and the India set is small. See [eval/README.md](eval/README.md).

## Architecture

```
src/
  app/                    Next.js App Router pages (all statically prerendered)
    page.tsx              Analyze
    manifest.ts           Installable app + Android share target
    share/route.ts        Fallback for shares when the service worker is not active
    examples/ learn/ guide/ privacy/
    layout.tsx            Shell, fonts, analyzer state provider, SW registration
    globals.css           Design tokens (Tailwind v4 @theme) and keyframes
  components/
    analyze/              Input, results, gauge, annotated message, cards, checklist
    examples/ learn/ guide/
    shell/                Sidebar, mobile drawer, brand, local-analysis badge
    ui/                   Button, Badge, Progress, Disclosure, CopyButton
  lib/
    analysis/             Engine: rules, rules-india, urls, scoring, conversation, recommendations, highlight, summary
      model/              On-device classifier: features, logistic regression, weights.json, explanations
    ocr.ts                On-device screenshot reading (tesseract.js, self-hosted)
    share.ts              Combines fields received from the share sheet
    data/                 Fictional examples, scenarios, guide content, tips
    learning/quiz.ts      Pure learning-mode state and scoring
public/sw.js              Offline service worker; receives shares on-device
public/icons/             App icons (generated by scripts/generate-icons.mjs)
scripts/                  Copies OCR assets into public/ocr at build time; icon generator
eval/                     Pre-registered evaluation: datasets, dev/test corpus, training, frozen v1 engine, reports
e2e/                      Playwright browser tests
demo/sample-sms.png       Fictional screenshot for the demo
```

- **Business logic is separate from UI.** Everything under `src/lib` is framework-free and unit tested.
- **State** for the current message lives in a React context ([`AnalyzerProvider`](src/components/analyze/AnalyzerProvider.tsx)) in memory only, so it survives navigation between pages but not a reload.
- **Safe rendering.** Messages are split into text segments and rendered as React text nodes; `dangerouslySetInnerHTML` is not used anywhere. Links are displayed as text.
- **Offline.** In production, [`public/sw.js`](public/sw.js) precaches the five pages and their hashed assets on install, serves pages network-first with cache fallback, and serves `/_next/static` and the screenshot reader (`/ocr`) cache-first. It is versioned (`CACHE_VERSION`) and cleans up old caches on activation.
- **Screenshots.** [`scripts/copy-ocr-assets.mjs`](scripts/copy-ocr-assets.mjs) copies the tesseract.js worker, the LSTM WebAssembly engine builds and the English model into `public/ocr` before every dev/build, so nothing is fetched from a CDN. Tesseract's IndexedDB cache is disabled; an automated test checks that no external request is made and no IndexedDB database is created.
- **Sharing.** The manifest registers a `POST /share` share target. The service worker intercepts it, keeps the shared text/image in memory for at most a minute, and hands it to the page once via `postMessage`. If the service worker is not active, the server route redirects without reading the body.
- **Security headers** ([`next.config.ts`](next.config.ts)): Content-Security-Policy with `connect-src 'self'` (the browser blocks scripts from sending data elsewhere), `'wasm-unsafe-eval'` (needed only to compile the OCR engine; JavaScript `eval` stays blocked), `frame-ancestors 'none'`, `object-src 'none'`, `nosniff`, `no-referrer`, and a restrictive Permissions-Policy.

## Technology stack

- Next.js 16.4 (App Router, Turbopack, Cache Components), React 19.3, TypeScript (strict)
- Tailwind CSS v4 with custom design tokens
- Lucide React icons; Geist font self-hosted via `next/font`
- tesseract.js 7 (on-device OCR, self-hosted engine and English model)
- On-device logistic regression, trained in plain TypeScript (no ML libraries)
- Vitest (unit), Playwright (browser)

No analytics, UI kit, animation library or state library is used.

## Setup

Requires Node.js 20.9+ (developed on Node 26) and npm.

```bash
cd safeclick-ai
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

## Testing

```bash
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # ESLint (next/core-web-vitals + typescript)
npm test             # Vitest unit tests
npm run build        # production build
npx playwright install chromium   # first time only
npm run test:e2e     # Playwright, desktop + mobile, against the production build
npm run screenshots  # optional: saves screens to ./screenshots
npm run eval         # official accuracy report (downloads public datasets on first run)
npm run eval:dev     # metrics on the dev split while improving rules
npm run train        # retrain the on-device model (deterministic)
```

`npm run check` runs typecheck, lint, unit tests and the build in sequence.

**Unit tests** (`src/**/*.test.ts`) cover every detection rule (positive and negative cases), URL extraction and each URL heuristic, family overlap and combination scoring, category thresholds, benign messages, empty/oversized/non-string input, Unicode (emoji, CJK, Devanagari, control and bidi characters, mixed scripts, zero-width characters), offset preservation, every fictional example's expected signals, recommendations, highlighting, the copied summary, learning-mode scoring, conversation parsing (labels, timestamps, continuation lines, paragraphs) and escalation detection, the share-field combiner, the India pack and Hinglish/Hindi phrasing (including protective wording that must not trigger), the model's features, classifier maths and shipped-model behaviour on genuine Indian bank/UPI alerts, and every claim made in the demo script.

**Browser tests** (`e2e/`) cover the full journey (load example → analyze → expand a warning → click a highlight → complete a step → clear), benign results, oversized input, inert rendering of pasted HTML, examples filtering/search/load, completing and restarting the learning mode, keyboard tab navigation and checklists in the guide, the privacy page, absence of external requests / storage / cookies during analysis, no horizontal scroll on any page, loading and using the guide and analyzer **offline** after a first visit, conversation mode, **reading a rendered screenshot on-device** with no external requests and no IndexedDB, the web app manifest and icons, **receiving a share through the service worker** without it reaching the server, the share fallback, and reduced motion. Each test runs at 1440×900 and on a Pixel 7 profile.

## Deployment

The app is fully static and has no server-side secrets or environment variables.

- **Vercel**: import the repository and keep the default build settings (framework preset: Next.js). The `prebuild` script copies the screenshot-reader files automatically.
- **Any Node host**: `npm ci && npm run build && npm run start` (set `PORT` as needed).

Notes: the service worker requires HTTPS (or localhost). The headers in `next.config.ts` are applied by the Next.js server; if you export to a static host instead, configure equivalent headers there.

## Privacy design

- Messages are analyzed in browser memory. No message text is sent anywhere, written to localStorage/sessionStorage/IndexedDB/cookies, or logged.
- Screenshots are read in the browser; the image is never uploaded, and the OCR engine and model are served by SafeClick itself.
- Shared content is received by the service worker on the device and held in memory only, for at most a minute.
- No analytics, ads, trackers, accounts or third-party requests at runtime (fonts are self-hosted at build time).
- Links in messages are never visited or rendered as clickable links.
- The service worker caches only the app's own pages and assets (including the OCR engine after first use), never messages or images.
- Each claim on the Privacy page was checked against the code, and the "no network / no storage / no cookies" claims are verified by an automated browser test.

## Limitations

- **Heuristic, not a verdict.** The score is not a calibrated probability. A low score never means "safe"; a high score is not proof of fraud.
- **False negatives.** A carefully written scam, or a slow trust-building conversation, can avoid every rule.
- **False positives.** Genuine alerts can be urgent or contain unusual links.
- **Text only.** SafeClick cannot verify a sender, check a link's live reputation, or inspect images, attachments or voice calls.
- **Languages.** Rules cover English, Hinglish and common Hindi (Devanagari) phrasing; other languages will mostly score low.
- **The model learns surface patterns** from mostly older UK and international SMS; a scammer who writes like a friend can score low, and its probability means resemblance to training data, not the chance of fraud.
- **The opening message of a slow scam** ("Hi, we met at the alumni meetup…") looks innocent to both rules and model.
- **Offline scope.** Pages work offline only after one online visit in that browser, and only in production builds. Screenshot reading works offline once it has been used online.
- **Screenshot reading** can misread small, stylized or low-contrast text; the text is shown for review before analysis.
- **Conversation mode** relies on recognizable message boundaries ("Name: message" lines or blank lines between messages).
- **Share target** works on Android (Chromium browsers) after installing the app; iOS does not support web share targets.
- **Measured limits.** See [eval/RESULTS.md](eval/RESULTS.md) and [eval/README.md](eval/README.md) for detection rates, confidence intervals and caveats.

## Credits

- [Next.js](https://nextjs.org), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com), [Lucide](https://lucide.dev) icons, [Geist](https://vercel.com/font) typeface, [Vitest](https://vitest.dev), [Playwright](https://playwright.dev).
- [tesseract.js](https://github.com/naptha/tesseract.js) and the Tesseract OCR engine (Apache 2.0), with English model data from `@tesseract.js-data/eng`.
- Evaluation and training data (all CC BY 4.0, downloaded at evaluation time, not redistributed): Almeida, T. A. & Hidalgo, J. M. G. (2011), *SMS Spam Collection*, UCI Machine Learning Repository; Mishra, S. & Soni, D. (2022), *SMS Phishing Dataset for Machine Learning and Pattern Recognition*, Mendeley Data, doi:10.17632/f45bkkt8pr.1; Bolewar, A. (2026), *Hinglish & English Financial Scam/Fraud Text Dataset*, Hugging Face.
- All example messages, organizations (Northwind Bank, QuickParcel, Contoso, Fabrikam Labs, Riverside Dental Clinic) and people are fictional. Example links use the reserved `.example` domain (RFC 2606) or the 192.0.2.0/24 documentation range (RFC 5737).

## AI-assisted development disclosure

This project was built with substantial assistance from **Claude Code** (Anthropic, model Claude Opus 5.5), working from a detailed product brief written by the team. The AI assistant scaffolded the project, wrote the analysis engine, UI components, tests and documentation, ran the test suites, and fixed the issues they surfaced. The team defined the product vision, requirements, design direction and safety constraints, and is responsible for reviewing, understanding and presenting the code.

## What existed before the challenge vs. what was built

- **Pre-existing:** the open-source frameworks and libraries listed above, and the default `create-next-app` scaffold the project was generated from (on 2026-10-20).
- **Built during the challenge:** everything else: the analysis engine and its rules (including the India pack), URL heuristics, conversation analysis and scoring model; the on-device classifier and its training code; the pre-registered evaluation; the on-device screenshot integration, share target and install flow; all UI components, pages and design tokens; example, scenario, guide and evaluation content; the service worker; the evaluation harness; the unit and browser test suites; and all documentation.

See also [SECURITY.md](SECURITY.md), [DEMO_SCRIPT.md](DEMO_SCRIPT.md) and [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md).
