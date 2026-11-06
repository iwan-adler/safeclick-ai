# Devpost page draft: SafeClick AI

Copy each section into the matching Devpost field. Replace everything in [brackets]. Edit it into your own words: judges notice personal voice.

**Tagline:** Pause. Understand. Stay safe. A privacy-first scam checker that explains every warning and runs entirely on your device.

**Links:** Try it: https://safeclick-ai-mu.vercel.app · Code: https://github.com/iwan-adler/safeclick-ai · Video: [YouTube link]

## Inspiration

[One or two sentences of your own, for example: my grandparents get several suspicious messages a week on WhatsApp and SMS, such as fake KYC updates, "electricity cut tonight" and "your parcel is on hold", and they can't easily ask someone every time.]

Scams don't win because people have never heard of scams. They win through pressure: a deadline, a threat, a friendly stranger. Most scam checkers either upload your private messages to a server or give a black-box "safe / unsafe" verdict. We wanted something that teaches you why a message is risky, works for people who read Hindi better than English, and never sends a message anywhere.

## What it does

- **Checks a message, screenshot or whole chat.** You can paste text, drop in a screenshot (read on-device with OCR), or paste a conversation.
- **Explains every warning.** Risky phrases are highlighted; tap one to see the warning sign it matches, why it matters, and what to do instead.
- **Conversation mode.** It catches the *trust-then-request* pattern behind romance and investment ("pig-butchering") scams: friendly messages first, then a request for money.
- **India pack.** It handles UPI PIN, QR and collect requests, KYC/PAN/Aadhaar updates, USSD call-forwarding codes, "digital arrest", courier-drug and electricity threats, in English, Hinglish and Hindi.
- **Link X-ray.** It splits each link into parts, shows the real domain and names look-alike characters, for example a Cyrillic "о" posing as a Latin "o". Links are never opened.
- **Simple mode for elders.** A Hindi-first screen with three big buttons and a full-colour answer ("रुकिए! यह धोखा लगता है"). It has read-aloud, one-tap calling of a family member, and a 1930 button. It never says "safe".
- **Protects the family.** A warning card in Hindi or English can be sent on WhatsApp. An emergency plan for "I already paid" puts India's 1930 cyber-fraud helpline first and drafts a masked incident report.
- **Installable and offline.** It is a PWA with an Android share target, so you can share a message from WhatsApp straight into SafeClick. The safety guide works offline.

## How we built it

- **App:** Next.js 16 (App Router), React 19, TypeScript (strict) and Tailwind CSS v4.
- **Analysis engine:** explainable regex rules, grouped into warning-sign families with diminishing returns and combination bonuses. Alongside them, a **56 KB logistic-regression model** trained on public SMS datasets that runs in the browser and shows which words pushed its score up.
- **OCR:** tesseract.js (WebAssembly), self-hosted, so nothing comes from a CDN.
- **Privacy is enforced, not just promised:** the Content-Security-Policy uses `connect-src 'self'`, there is no analytics and no server-side analysis, and messages are never stored. Automated tests check that no request leaves the device during analysis.
- **Evaluation:**
  - We wrote the evaluation plan and committed it *before* running it.
  - Sources were three public CC BY 4.0 datasets, with a held-out test set and near-duplicates removed.
  - The India set is an independent Hinglish dataset.
  - We report 95% confidence intervals.
- **Quality:**
  - 260 unit tests and 42 Playwright browser tests, run on desktop and mobile.
  - An axe-core WCAG 2.1 AA audit in light and dark mode.
  - GitHub Actions CI.

**Results** (held-out real-world SMS the system never saw):

| Measure | First version | Now |
| --- | --- | --- |
| Scams flagged | 14% | **85%** (95% CI 77–91%) |
| Genuine texts wrongly flagged (2,393 texts) | | **0.3%** |
| India set (Hinglish and Indian messages), scams flagged | | 85% |

## Challenges we ran into

- **Honest evaluation.** Our first accuracy numbers looked great because near-identical template messages appeared in both training and test data. We added a pre-registered near-duplicate filter, and the honest number went down before our improvements brought it back up.
- **False alarms on genuine Indian bank alerts.** Real alerts contain "OTP" and "account" too, and the first model flagged them. We added a set of genuine Indian bank alerts to training (documented as a plan amendment) and re-measured.
- **On-device OCR.** Running Tesseract fully offline under a strict Content-Security-Policy meant self-hosting the WebAssembly files and turning off its hidden IndexedDB cache.
- **Designing for elders.** We used big targets, one decision per screen, plain Hindi, and never the word "safe": a low score is not a guarantee.

## Accomplishments that we're proud of

- 85% of new real-world scams caught (up from 14%) with 0.3% false alarms, measured honestly with a plan we published first.
- Zero bytes of message data leave the device.
- A version my grandparents can actually use.
- Zero automated WCAG 2.1 A/AA violations on every page, in light and dark mode.

## What we learned

- Explaining *why* a message is risky teaches people more than a score.
- Pre-registering an evaluation keeps you honest.
- Accessibility and language matter as much as accuracy for the people most targeted.

## What's next for SafeClick AI

- An Android app package (TWA) for the Play Store.
- More Indian languages (Tamil, Bengali, Marathi).
- Testing with elders and community groups.
- Voice-message and call-transcript checking.

## Built with

nextjs, react, typescript, tailwindcss, tesseract.js, webassembly, pwa, service-worker, logistic-regression, machine-learning, playwright, vitest, axe-core, github-actions, vercel

## Team

[Names and roles]

## AI disclosure

This project was built with help from an AI coding assistant (Claude Code). We designed, reviewed, tested and evaluated everything, and all results come from the code in the repository.
