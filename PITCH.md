# SafeClick AI: Pitch Kit

Every number here comes from [eval/RESULTS.md](eval/RESULTS.md) and the test suite. Say them exactly as written.

## One-liner

SafeClick AI is a private scam checker that explains every warning in English or Hindi, and never uploads your messages.

## Tagline

Pause. Understand. Stay safe.

## 10-second pitch

Scam messages win through panic. SafeClick AI checks a message, screenshot or chat on your own phone, shows exactly which words are red flags, and tells you what to do. Nothing is ever uploaded.

## 30-second elevator pitch

My grandparents get scam messages every week: fake KYC updates, "your electricity will be cut tonight", "share the OTP". Scams don't win because people have never heard of scams. They win through pressure.

SafeClick AI is a second opinion for that moment. Paste a message, a screenshot or a whole chat, and it highlights the exact words that are warning signs, explains why, and says what to do next, in English, Hinglish or Hindi. It runs entirely on your device, so your private messages never leave your phone. We tested it on real scams it had never seen: it catches 85%, with 0.3% false alarms.

## 60-second pitch (video intro or live judging)

Everyone has seen a message like "Your bank account will be blocked today. Share the OTP now." Scams don't win because people have never heard of scams. They win through pressure: a deadline, a threat, or a friendly stranger who builds trust for weeks. And they hit the people least able to check, like my grandparents.

Most tools either give a black-box "safe or unsafe" answer or ask you to upload private chats to a server. SafeClick AI does neither.
- **Every warning is explained.** You can check a message, a screenshot or a whole conversation. It highlights each risky phrase and explains it.
- **It catches slow scams.** It spots the "friendly first, then a request for money" pattern behind romance and investment scams.
- **It's built for India.** It knows UPI PIN tricks, KYC links and "digital arrest", in Hinglish and Hindi.
- **It covers what comes next.** If you've already paid, it gives you a plan that starts with India's 1930 helpline.
- **There's a Simple mode for elders.** Hindi first, big buttons, read-aloud, and one tap to call family.

Everything runs on the phone: rules plus a small machine-learning model, with nothing uploaded. We measured it honestly, with a plan we published before testing. It caught 85% of real scams it had never seen, up from 14% in our first version, with 0.3% false alarms.

SafeClick AI: pause, understand, stay safe.

## The three things to remember

1. **It explains, not just flags.** Every warning points at the exact words and says why.
2. **It's private by design.** Analysis runs on your device, so not one byte of your messages is uploaded.
3. **It's measured honestly.** It caught 85% of never-seen real scams with 0.3% false alarms, using a pre-registered evaluation.

## Judge Q&A prep

**What's innovative here?**
- It explains, it doesn't just give a verdict.
- It analyses whole conversations, not only single messages.
- Simple mode is designed for elders in Hindi.
- All of it runs on-device, with no AI API.

**Why not just use ChatGPT?** That means pasting private messages into a server, it needs internet, and the answers vary each time. SafeClick runs offline on the device, gives the same answer every time, and points to the exact words behind each warning.

**How do you know it works?**
- **The plan was written first.** We committed the evaluation plan to GitHub before running it.
- **The data is public and unseen.** We used public SMS datasets, held out a test set and removed near-duplicates.
- **We report the uncertainty.** Results come with 95% confidence intervals. On new real-world scams it caught 85% (95% CI 77–91%), with 0.3% false alarms on 2,393 genuine texts.

**What's the hardest technical part?** Running OCR fully on-device under a strict Content-Security-Policy. That meant self-hosting the WebAssembly engine. The other hard part was keeping the evaluation honest: our first numbers were inflated by template leakage, and we fixed that before improving the model.

**What are the limits?**
- The first message of a slow scam looks innocent, which is why conversation mode exists.
- It can't verify senders or open links.
- The India test set is small (47 scams).
- It's an educational tool, so a low score is never a guarantee.

**How does it make money / scale?** It's free and open source, and costs almost nothing to host because there are no servers doing analysis. Next steps:
- An Android app on the Play Store.
- More Indian languages.
- Pilots with families and community groups.

**Does it store anything?** Messages are never stored. Only settings (theme, language, one family contact for Simple mode) are kept, and only in your browser.

## Links

- Live: https://safeclick-ai-mu.vercel.app
- Video: https://youtu.be/HJ9Df2gPYbw
- Code: https://github.com/iwan-adler/safeclick-ai

## Short social post

> Scams win through panic. I built SafeClick AI, a free scam checker that explains every red flag in English, Hinglish or Hindi, with a Simple mode for grandparents. It runs on your phone, so nothing is uploaded. It caught 85% of real scams it had never seen. Try it: https://safeclick-ai-mu.vercel.app #NextByteHacks
