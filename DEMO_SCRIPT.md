# SafeClick AI: Demo Script (about 3 minutes)

**Before recording:** run the production build (`npm run build && npm run start`) or use the deployed site. Open it once so the offline cache is ready, and check one screenshot beforehand so the text reader is cached and instant. Use a desktop window around 1440px wide and have [`demo/sample-sms.png`](demo/sample-sms.png) ready to drag in. Every outcome below is covered by an automated test, so the demo will behave as described.

---

## 0:00 – 0:20 · The problem

> "Scams don't win because people have never heard of scams. They win because of pressure: a deadline, a threat, a friendly stranger. And they arrive on our phones, as screenshots and chats, not as tidy text. SafeClick AI helps you pause and understand a message before you act, entirely on your device."

## 0:20 – 0:55 · A screenshot, checked on-device

Drag `demo/sample-sms.png` onto the message box (or click **Check a screenshot**).

- Point at the progress bar: *"The text is being read right here in the browser. The image never leaves the device, and nothing goes to an AI API."*
- The text appears with a note to check it. Press **Analyze**.
- **High concern**: open **What does this score mean?**, then click the highlighted **redelivery fee**. Its warning card opens. Scroll to **Links in this message**: a numeric address, "never opened".

## 0:55 – 1:40 · Conversation mode: the scam no single message reveals

Click the **Wrong number that turns into investing** chip. The mode switches to **Conversation**. Press **Analyze**.

- Point at the timeline: friendly messages first, then the red **Request** bubble.
- Read the banner: *"Trust, then a request."*
- Click the request bubble to open its explanation.

> "None of the early messages looks dangerous on its own. The danger is the pattern: compliments and daily chat, then an investment pitch and a deposit. That's how romance and pig-butchering scams work, and conversation mode is built to see it."

**Safer outcome:** in **Recommended next steps**, tick **"Never invest through a platform or contact you met online…"** and **"However long you have been talking, do not send money…"**. *"Instead of depositing $200, they stop, block, and talk it over with someone they trust."*

## 1:40 – 2:05 · We measured it

Open **Privacy → How accurate is it?**

> "We didn't just build rules, we tested them. On 4,827 real personal text messages, SafeClick wrongly raised concern on only 0.3%. On a held-out set of 80 messages it caught 82.5% of the scams with zero false alarms. That set was written by the same author as the rules, so we treat that number as optimistic. The full report lists every scam we missed."

## 2:05 – 2:30 · An honest limitation

Go back to **Analyze**, switch to **Single message**, press **Clear**, and paste:

> Hi, it's Jordan from the housing office. Could you confirm your new move-in date and send the deposit to the account below when you get a moment? Thanks!

It scores **Lower apparent risk**. Point at the green box: *"That's a good sign, but it is not a guarantee."*

> "A polite request with no urgency and no link slips past the rules. SafeClick is a teaching aid, not a verdict, and every result says so."

## 2:30 – 2:50 · Phone, offline and learning (quick tour)

- **Safety Guide**: point at **Saved for offline use**. *"This works with no connection, exactly when your account or phone has been compromised."*
- Mention: on Android, install SafeClick and share a suspicious text or screenshot straight into it from your messaging app.
- **Learn**: six practice scenarios with instant feedback.

## 2:50 – 3:00 · Close

> "Screenshots, conversations, offline guidance, measured honestly, and nothing ever leaves your device. SafeClick AI: Pause. Understand. Stay safe."

---

### Optional: live phone-share demo

Needs the site deployed over HTTPS and an Android phone with Chrome:

1. Open the site, then use **Install SafeClick** (sidebar or menu), or Chrome's menu → *Install app*.
2. In your messaging app, long-press a (fictional) message → **Share** → **SafeClick**.
3. SafeClick opens with the text filled in and a "Shared message received" notice. Press **Analyze**.

Rehearse this first: share sheets vary by phone and messaging app. iOS does not support web share targets.
