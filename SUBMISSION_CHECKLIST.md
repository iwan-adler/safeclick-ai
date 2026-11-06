# Next Byte Hacks V5: Submission Checklist

> **Deadline: November 8, 2026, 3:30 AM IST, which is November 7, 2026, 5:00 PM ET.** Submit on Devpost: https://next-byte-hacks-v5.devpost.com/

Items marked ✅ are done and verified in the repository. Items marked ⬜ need a human. Nothing below is filled in with invented links, feedback or results. The page text is drafted in [DEVPOST.md](DEVPOST.md).

## What the rules require

| Requirement | Status |
| --- | --- |
| Working project built during the hackathon period (Oct 6 – Nov 8) | ✅ Started on 2026-10-20 from the `create-next-app` scaffold; see README → "What existed before the challenge" |
| Title and description | ✅ Drafted in [DEVPOST.md](DEVPOST.md). ⬜ Rewrite "Inspiration" in your own words |
| List of technologies | ✅ DEVPOST.md → Built with |
| Screenshots | ✅ `screenshots/`. Suggested: `simple-verdict.png`, `shots-desktop-02-analyze-result.png`, `shots-desktop-02b-conversation.png`, `shots-desktop-03b-link-xray.png`, `shots-desktop-02c-warning-card-hi.png` |
| Demo video, 2–5 minutes: what it does, how it works, the problem it solves | ✅ Narrated, captioned walkthrough (3:33) from `npm run demo:record` (see [DEMO_SCRIPT.md](DEMO_SCRIPT.md)). ⬜ Upload it to YouTube (unlisted is fine); optionally replace the computer voice with your own |
| Public GitHub repository with setup instructions | ✅ https://github.com/iwan-adler/safeclick-ai (README → Setup) |
| Licensing and platform rules | ✅ Dependencies and datasets credited in README → Credits (datasets CC BY 4.0) |
| AI use within tool policies | ✅ Disclosed in README and DEVPOST.md |
| Team info, challenges, what you learned, future plans | ✅ Drafted in DEVPOST.md. ⬜ Add team names |

## Scored criteria (25% each), and where to show them

- **Innovation & creativity:**
  - Simple mode for elders in Hindi.
  - Conversation mode's trust-then-request detection.
  - Explanations word by word instead of a verdict.
  - Link X-ray with look-alike characters.
- **Technical complexity:**
  - On-device logistic-regression model and rules engine.
  - WebAssembly OCR.
  - PWA share target and offline service worker.
  - Pre-registered evaluation with confidence intervals ([eval/RESULTS.md](eval/RESULTS.md)).
- **Functionality & execution:**
  - 260 unit tests and 42 browser tests (desktop + mobile), plus an axe-core WCAG 2.1 AA audit, all green in CI.
  - ⬜ A live deployed link for judges to try.
- **Presentation & clarity:**
  - The demo video with your voice.
  - A clear Devpost page.
  - Screenshots.

## Links and media

- ✅ **Live demo:** https://safeclick-ai-mu.vercel.app (checked: screenshot reading, analysis and simple mode work, with no requests to other sites)
- ✅ **Source:** https://github.com/iwan-adler/safeclick-ai
- ⬜ **Video:** upload `demo-video/safeclick-demo.mp4` (already narrated) to YouTube (title, description and chapters in [YOUTUBE.md](YOUTUBE.md)) and paste the link.
- ✅ **Short launch video (20s):** `brag-output/brag.mp4`, optional extra for social posts.

## Safer outcomes shown in the video (all covered by tests)

- ✅ **Screenshot:** the sample SMS image is read on-device and rated *High concern*.
- ✅ **Conversation:** the "wrong number" chat is flagged for trust-then-request escalation.
- ✅ **India:** a Hinglish electricity cut-off threat is flagged.
- ✅ **Simple mode:** a pasted OTP scam turns the screen red with "रुकिए! यह धोखा (स्कैम) लगता है"; an ordinary message is never called "safe".
- ✅ **Limitation:** the innocent opening of a slow scam scores *Lower apparent risk*, and the UI says that is not a guarantee.

## Before submitting

- ⬜ `npm run check` (typecheck, lint, unit tests, build)
- ⬜ `npm run test:e2e`
- ⬜ Open the deployed link on a phone and check one message.
- ⬜ Optional, but strong: an honest line or photo from a real person (for example a grandparent) using simple mode, shared with their permission. Never invent quotes.
- ⬜ Submit before **Nov 7, 5:00 PM ET / Nov 8, 3:30 AM IST**.
