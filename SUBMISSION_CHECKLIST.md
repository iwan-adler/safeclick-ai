# SafeSpace Hacks: Submission Checklist

> **Final submission deadline: November 22, 2026, 5:00 PM Eastern Time.**

Items marked ✅ are done and verified in the repository. Items marked ⬜ need a human to complete them. Nothing below has been filled in with invented links or results.

## Project

- ✅ **Name:** SafeClick AI
- ✅ **Tagline:** Pause. Understand. Stay Safe.
- ✅ **Short pitch:** A privacy-first scam checker that works the way scams actually arrive: as screenshots, chat threads and texts shared from your phone. It explains every warning sign, spots the trust-then-request pattern behind romance and investment scams, publishes its measured accuracy, and never lets a message leave your device.

## Problem and solution

- ✅ **Problem:** Scams succeed by creating pressure (deadlines, threats, prizes) or by slowly building trust. They arrive as screenshots and chats on phones. People need a quick, understandable way to check a message in the moment without uploading private conversations to a third party.
- ✅ **Solution:** A browser-only analyzer with explainable rules that highlights the exact words behind each warning and offers next steps. It reads screenshots on-device, analyzes whole conversations for escalation, receives shares from other apps on Android, and works offline, plus fictional examples, practice scenarios and a safety guide.

## Technologies

- ✅ Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Lucide React
- ✅ tesseract.js 7 (self-hosted WebAssembly OCR), Web App Manifest with Android share target
- ✅ Vitest (unit tests), Playwright (desktop + mobile browser tests), evaluation harness (`npm run eval`)
- ✅ Service worker for offline pages and on-device share handling; Content-Security-Policy with `connect-src 'self'`
- ✅ No backend logic, database, AI API, analytics or accounts

## Challenges and lessons learned (draft; edit in your own words)

- **Explainability over cleverness.** Rules had to point at exact words, so offsets are preserved through analysis, rendering and the conversation timeline.
- **Avoiding false alarms.** Genuine OTP messages say "do not share this code". Request-verb and protective-wording checks keep those at a score of 0, and the measured false-alarm rate on 2,393 held-out genuine texts is 0.3%.
- **Seeing patterns across messages.** Single-message rules can't see a slow romance or investment scam. Conversation mode tracks when the first request appears after request-free, friendly messages.
- **Private OCR.** tesseract.js loads its engine and model from a CDN by default. We self-host them, disable its IndexedDB cache, and verify in a browser test that no external request is made.
- **Measuring honestly.** We froze a held-out set before the first run and did not tune the rules to it, even after seeing clear misses. The misses became the roadmap instead.
- **Offline that actually works.** The service worker precaches each page's hashed scripts, verified by an automated offline browser test.

## Links and media

- ⬜ **Demo link:** deploy (see README → Deployment), then paste the URL here.
- ⬜ **Source repository:** push to a public repository, then paste the URL here.
- ⬜ **Screenshots:** run `npm run build && npm run screenshots`, review `screenshots/`, and upload your picks. Includes screenshot reading, conversation mode, examples, learn, guide and privacy (with accuracy) at desktop and mobile sizes.
- ✅ **Launch video (20s):** generated locally in `brag-output/brag.mp4` with a poster frame and `share-copy.txt` (not committed; upload it to YouTube/Devpost).
- ✅ **Pitch deck:** 12 slides with speaker notes, made as a private Claude artifact. Share it from its Share menu; fill in `[demo link]` and `[team names]` on the last slide.
- ⬜ **Demo video (optional, longer):** record using [DEMO_SCRIPT.md](DEMO_SCRIPT.md) (about 3 minutes), with [`demo/sample-sms.png`](demo/sample-sms.png).

## Safer outcomes to demonstrate (all covered by tests)

- ✅ **Screenshot:** the sample SMS image is read on-device and rated *High concern*; the user checks the parcel in the official app instead of paying.
- ✅ **Conversation:** the "wrong number" chat is flagged for trust-then-request escalation; the user stops before depositing money.
- ✅ **Internship:** the upfront-fee offer is *High concern* with "registration fee" and "Reply only to this number" highlighted.

- ✅ **Simple mode:** a pasted OTP scam turns the whole screen red with "रुकिए! यह धोखा (स्कैम) लगता है" and three plain steps; an ordinary message is never called "safe".

## Limitation to demonstrate

- ✅ The innocent opening message of a slow scam ("Hi! Is this Rahul? We met at the alumni meetup…") scores *Lower apparent risk* with both rules and model. The UI says a low score is not a guarantee, and conversation mode is the answer once the request appears. Covered by a unit test.

## Evidence for judges

- ✅ [eval/RESULTS.md](eval/RESULTS.md): measured detection and false-alarm rates, every missed scam, caveats
- ✅ Automated tests: unit tests for every rule and demo claim; browser tests for the full journey, offline use, screenshot reading, sharing and privacy guarantees
- ⬜ **Real user feedback:** have 5–10 classmates try the deployed app and record what they actually said (with permission). Do not paraphrase into invented quotes.

## Credits and AI disclosure

- ✅ Open-source and dataset credits listed in README → Credits.
- ✅ AI-assisted development disclosure in README (built with Claude Code, Claude Opus 5.5).
- ✅ Pre-existing vs. challenge-built work described in README.
- ⬜ Add team member names and roles to the submission form and README.

## Final verification (re-run before submitting)

- ⬜ `npm run check` (typecheck, lint, unit tests, build)
- ⬜ `npm run test:e2e`
- ⬜ `npm run eval` and update the numbers in README/DEMO_SCRIPT if anything changed
- ⬜ On an Android phone: install the deployed app and share a fictional message into it once
- ⬜ Submit before **November 22, 2026, 5:00 PM ET**
