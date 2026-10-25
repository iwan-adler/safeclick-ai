/**
 * Fictional learning scenarios. Each has exactly one "safest" option.
 * "partial" options are better than the worst choice but leave a gap.
 */

export type OptionOutcome = "safest" | "partial" | "unsafe";

export interface ScenarioOption {
  id: string;
  text: string;
  outcome: OptionOutcome;
  feedback: string;
}

export interface Scenario {
  id: string;
  title: string;
  context: string;
  /** The message or situation the learner reacts to. */
  prompt: string;
  question: string;
  options: ScenarioOption[];
  /** Why the safest option is preferable, shown after any answer. */
  lesson: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "otp-call",
    title: "The helpful bank caller",
    context: "Your phone rings. The caller knows your name and the last four digits of your card.",
    prompt:
      "\"Hi, this is the fraud team at Northwind Bank. We've blocked a suspicious payment. I've just sent you a code, please read it back so I can cancel the charge.\"",
    question: "What do you do?",
    options: [
      {
        id: "read-code",
        text: "Read the code back. They already know your card details, so they must be the bank.",
        outcome: "unsafe",
        feedback:
          "Scammers often have partial details from data leaks. The code they \"sent\" is usually a real login or payment code that lets them into your account.",
      },
      {
        id: "quiz-them",
        text: "Ask them to confirm your full address first, then decide.",
        outcome: "partial",
        feedback:
          "Testing the caller feels sensible, but leaked data can include addresses. It also keeps you on a call controlled by the other person.",
      },
      {
        id: "hang-up",
        text: "Hang up and call the number printed on the back of your card.",
        outcome: "safest",
        feedback:
          "Right. Calling a number you already trust puts you in control. If there really is a problem, the bank will see it on their side.",
      },
    ],
    lesson:
      "A one-time code is a key, not a confirmation. No real bank needs you to read it out. End the call and reach the bank through a contact you already have.",
  },
  {
    id: "friend-new-number",
    title: "A friend with a new number",
    context: "You get a chat message from an unknown number with your friend Alex's profile photo.",
    prompt:
      "\"Hey, it's Alex! Lost my phone, this is my new number. I'm stuck at the station and my card isn't working. Can you send me $60? I'll pay you back tonight. Please don't call, the line is terrible here.\"",
    question: "How do you respond?",
    options: [
      {
        id: "send-money",
        text: "Send the money. It's a small amount and Alex would do the same for you.",
        outcome: "unsafe",
        feedback:
          "Small amounts are used deliberately so you won't think twice. Profile photos are easy to copy from public accounts.",
      },
      {
        id: "verify-old",
        text: "Contact Alex on their old number or through someone you both know before doing anything.",
        outcome: "safest",
        feedback:
          "Exactly. A quick check through a known channel exposes most impersonation. The real Alex will understand.",
      },
      {
        id: "ask-question",
        text: "Ask a personal question only Alex would know, then send the money if they answer correctly.",
        outcome: "partial",
        feedback:
          "Better than sending straight away, but answers can often be found on social media. Verifying through a separate channel is stronger.",
      },
    ],
    lesson:
      "\"New number\" plus \"please don't call\" is designed to stop you from checking. Always verify through a contact method you had before the request.",
  },
  {
    id: "internship-fee",
    title: "The dream internship",
    context: "You applied to many internships. An email arrives from a recruiter at a company you don't remember applying to.",
    prompt:
      "\"You've been selected for a paid remote internship! $500/week. To reserve your place, pay a $49 refundable onboarding fee by Friday. Limited seats.\"",
    question: "What is the best next step?",
    options: [
      {
        id: "pay-fee",
        text: "Pay the fee. It's refundable, and the pay is worth it.",
        outcome: "unsafe",
        feedback:
          "\"Refundable\" fees are rarely refunded in these schemes. Legitimate employers do not charge you to start a job.",
      },
      {
        id: "research",
        text: "Find the company's official careers page yourself, contact them there, and ask your college placement office.",
        outcome: "safest",
        feedback:
          "Great choice. Independent research and a second opinion are the best defences against fake job offers.",
      },
      {
        id: "reply-ask",
        text: "Reply to the email asking whether the company is legitimate.",
        outcome: "partial",
        feedback:
          "Asking is reasonable, but the sender controls the answer. Check through sources the sender doesn't control.",
      },
    ],
    lesson: "Real jobs pay you. Any offer that requires an upfront fee deserves independent verification before you respond.",
  },
  {
    id: "parcel-link",
    title: "The missed delivery",
    context: "You are expecting a package this week. A text arrives.",
    prompt:
      "\"QuickParcel: your parcel is held at our depot. A $1.99 redelivery fee is due. Pay at http://192.0.2.44/release within 24h or it will be returned.\"",
    question: "What do you do?",
    options: [
      {
        id: "pay-small",
        text: "Pay it. You are expecting a parcel and the fee is tiny.",
        outcome: "unsafe",
        feedback:
          "The small fee is bait for your card details, which can then be used for much larger charges. Timing with a real order is often coincidence.",
      },
      {
        id: "official-tracking",
        text: "Check the tracking number from your order confirmation on the retailer's or courier's official site.",
        outcome: "safest",
        feedback:
          "Correct. Using the tracking details you already have avoids the message's link entirely.",
      },
      {
        id: "open-link-look",
        text: "Open the link just to look, but don't enter anything.",
        outcome: "partial",
        feedback:
          "Not entering anything helps, but opening unknown links can still confirm your number is active or expose you to malicious pages.",
      },
    ],
    lesson: "Expecting a delivery makes this scam feel real. Go to the source you already trust instead of following the link.",
  },
  {
    id: "boss-gift-cards",
    title: "An urgent request from the boss",
    context: "It's Friday afternoon. You get an email that appears to be from your manager.",
    prompt:
      "\"I need a favour, quickly. Buy four $100 gift cards for a client and email me photos of the codes. I'm in back-to-back meetings so don't call. Keep this between us for now.\"",
    question: "What should you do?",
    options: [
      {
        id: "buy-cards",
        text: "Buy the cards. Your manager is busy and you want to be helpful.",
        outcome: "unsafe",
        feedback:
          "Gift card codes work like cash and cannot be recovered once shared. This is one of the most common workplace scams.",
      },
      {
        id: "reply-email",
        text: "Reply to the email asking if it's really them.",
        outcome: "partial",
        feedback: "If the account is spoofed or compromised, the scammer will simply say yes.",
      },
      {
        id: "verify-separately",
        text: "Check with your manager in person, by phone, or on your usual work chat, and follow your company's payment process.",
        outcome: "safest",
        feedback:
          "Exactly. A separate channel and your normal process protect both you and the company.",
      },
    ],
    lesson: "Urgency, \"don't call\", secrecy and gift cards together are a strong warning combination. Verify separately every time.",
  },
  {
    id: "signin-alert",
    title: "The sign-in alert",
    context: "You receive an email about your student portal account.",
    prompt:
      "\"New sign-in to your account from an unrecognized device. If this wasn't you, secure your account here: https://student-portal-secure-login.example\"",
    question: "What is the safest response?",
    options: [
      {
        id: "click-secure",
        text: "Click the link and change your password right away.",
        outcome: "unsafe",
        feedback:
          "If the alert is fake, you would be typing your current password into the attacker's page. The domain is not one you can confirm.",
      },
      {
        id: "ignore",
        text: "Ignore it completely. Alerts like this are always fake.",
        outcome: "partial",
        feedback:
          "Many alerts like this are genuine. Ignoring a real one could leave your account exposed.",
      },
      {
        id: "go-direct",
        text: "Open the portal by typing its address or using a saved bookmark, then check recent activity and change your password there.",
        outcome: "safest",
        feedback:
          "Right. You act on the warning without trusting the link. If it was real, you've secured your account. If fake, you've lost nothing.",
      },
    ],
    lesson:
      "Treat alerts as a reason to check, not a link to follow. Going directly to the site works whether the alert is real or fake.",
  },
];
