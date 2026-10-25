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

> "We tested SafeClick on real SMS scams it had never seen, with an evaluation plan we committed to GitHub before running it. The first version caught 14% of new real-world scams. Today, with an India rule pack and a small on-device model, it catches 85%, while wrongly flagging only 0.3% of over two thousand genuine texts. On an independent set of Hinglish and Indian messages, it catches 85%. The full report, including confidence intervals and every caveat, is in the repo."

## 2:05 – 2:30 · An honest limitation

Go back to **Analyze**, switch to **Single message**, press **Clear**, and paste:

> Hi! Is this Rahul? We met at the alumni meetup last month. Hope you're doing well, are you free to chat this week?

It scores **Lower apparent risk**. Point at the green box: *"That's a good sign, but it is not a guarantee."*

> "This could be the first message of a slow romance or investment scam, and on its own it is completely innocent, so neither the rules nor the model flag it. That is exactly why conversation mode exists: paste the whole chat later, and SafeClick shows when the request appears. It's a teaching aid, not a verdict."

## 2:30 – 2:50 · When it's too late to pause (quick tour)

- On a high-concern result, click **Warn family** → **हिन्दी** to show the Hindi warning card for a parent's WhatsApp.
- Then click **I already responded**. Tick **I sent money**: the plan puts **Call 1930** and the bank first, and the incident report masks the transaction ID automatically.
- **Safety Guide**: point at **Saved for offline use**. *"This works with no connection, exactly when your account or phone has been compromised."*
- Mention: on Android, install SafeClick and share a suspicious text or screenshot straight into it from your messaging app.
- **Learn**: eight practice scenarios, including a UPI QR buyer and a "CBI" video call.

## 2:50 – 3:00 · Close

> "Screenshots, conversations, offline guidance, measured honestly, and nothing ever leaves your device. SafeClick AI: Pause. Understand. Stay safe."

---

### Optional: live phone-share demo

Needs the site deployed over HTTPS and an Android phone with Chrome:

1. Open the site, then use **Install SafeClick** (sidebar or menu), or Chrome's menu → *Install app*.
2. In your messaging app, long-press a (fictional) message → **Share** → **SafeClick**.
3. SafeClick opens with the text filled in and a "Shared message received" notice. Press **Analyze**.

Rehearse this first: share sheets vary by phone and messaging app. iOS does not support web share targets.
