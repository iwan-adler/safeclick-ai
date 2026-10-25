import type { AnalysisMode } from "../analysis/types";

/**
 * Fictional training examples.
 *
 * All organizations, people, numbers and links below are invented.
 * Links use the reserved ".example" top-level domain or the 192.0.2.0/24
 * documentation address range, so they cannot point to real websites.
 */

export type ExampleCategory =
  | "Banking"
  | "Delivery"
  | "Prizes"
  | "Accounts"
  | "Workplace"
  | "Jobs"
  | "Tech support"
  | "Shopping"
  | "Investment"
  | "Everyday";

export interface ExampleMessage {
  id: string;
  title: string;
  category: ExampleCategory;
  channel: "SMS" | "Email" | "Chat";
  /** Defaults to "message". Conversation examples are chat threads. */
  mode?: AnalysisMode;
  message: string;
  explanation: string;
  /** Rule ids the analyzer is expected to flag (verified by unit tests). */
  expectedSignals: string[];
  safeNextStep: string;
}

export const EXAMPLES: ExampleMessage[] = [
  {
    id: "bank-otp",
    title: "Bank OTP request",
    category: "Banking",
    channel: "SMS",
    message:
      "Northwind Bank ALERT: Unusual login detected on your account. To stop the transaction, share the OTP sent to your phone with our security team within 10 minutes or your account will be blocked.",
    explanation:
      "Combines a request for a one-time code with a short deadline and a threat. A bank's real security team never needs your OTP.",
    expectedSignals: ["credential-request", "urgency", "account-threat", "impersonation"],
    safeNextStep: "Do not reply. Call the number on the back of your card or open the official bank app.",
  },
  {
    id: "parcel-fee",
    title: "Parcel redelivery fee",
    category: "Delivery",
    channel: "SMS",
    message:
      "Dear customer, QuickParcel could not deliver your package due to an unpaid redelivery fee of $1.99. Pay now at http://192.0.2.44/parcel-release within 24 hours to avoid return to sender.",
    explanation:
      "A tiny fee and a numeric web address are classic signs of a delivery scam designed to collect card details.",
    expectedSignals: ["payment-request", "urgency", "suspicious-link", "generic-greeting"],
    safeNextStep: "Check the order in the retailer's app or the courier's official site using the tracking number from your order confirmation.",
  },
  {
    id: "prize",
    title: "Surprise prize notification",
    category: "Prizes",
    channel: "SMS",
    message:
      "Congratulations! You have been selected as the winner of a free iPhone in our anniversary lucky draw. To release your prize, pay a small processing fee of $4.99 using a gift card. Offer expires tonight!",
    explanation:
      "You cannot win a draw you never entered. Paying a fee, especially with a gift card, to receive a prize is a hallmark of advance-fee fraud.",
    expectedSignals: ["unexpected-benefit", "payment-request", "urgency"],
    safeNextStep: "Ignore and delete it. Do not reply, as replies confirm your number is active.",
  },
  {
    id: "account-suspension",
    title: "Account suspension threat",
    category: "Accounts",
    channel: "Email",
    message:
      "Your Contoso Mail account has been suspended due to unusual activity. Verify your password at https://contoso-mail-verify-login.example/secure within 24 hours or your mailbox will be permanently deleted.\n\nContoso Support Team",
    explanation:
      "Asks for your password through a link whose domain only looks official, under the threat of losing your mailbox.",
    expectedSignals: ["account-threat", "credential-request", "urgency", "suspicious-link", "impersonation"],
    safeNextStep: "Open your mail app or type the provider's address yourself and check for alerts there.",
  },
  {
    id: "colleague-gift-cards",
    title: "Colleague asks for gift cards",
    category: "Workplace",
    channel: "Chat",
    message:
      "Hi, it's Priya from finance. I'm in a meeting and can't talk. I need you to buy 5 Steam gift cards of $100 each for a client today and send me the codes. Keep this between us until it's done, I'll reimburse you.",
    explanation:
      "Business requests never involve gift cards. Being unreachable plus secrecy stops you from checking with the real person.",
    expectedSignals: ["payment-request", "bypass-verification", "secrecy"],
    safeNextStep: "Contact Priya through a channel you already use with her, or ask your manager, before doing anything.",
  },
  {
    id: "internship-fee",
    title: "Internship with an upfront fee",
    category: "Jobs",
    channel: "Email",
    message:
      "Congratulations! You've been shortlisted for a remote Data Entry Internship at Fabrikam Labs. Earn $500 per week, no experience needed. To confirm your seat, pay a refundable registration fee of $49. Reply only to this number.",
    explanation:
      "Real employers pay you, not the other way round. High pay for little experience plus a fee is a common student-targeted scam.",
    expectedSignals: ["unexpected-benefit", "payment-request", "bypass-verification"],
    safeNextStep: "Look up the company's careers page yourself and ask your college placement office before responding.",
  },
  {
    id: "tech-support",
    title: "Help desk remote access",
    category: "Tech support",
    channel: "Chat",
    message:
      "This is the IT Help Desk. We detected a virus on your laptop. Please install AnyDesk immediately and tell us the 9-digit ID so our technician can fix it remotely.",
    explanation:
      "Remote-access tools give a stranger control of your device. Unsolicited support contact plus urgency is a known tech-support scam pattern.",
    expectedSignals: ["remote-access", "impersonation", "urgency"],
    safeNextStep: "Do not install anything. Contact your organization's IT team through its usual portal or phone number.",
  },
  {
    id: "lookalike-card",
    title: "Look-alike payment page",
    category: "Shopping",
    channel: "Email",
    message:
      "Your Northwind Shop payment failed. Please update your card details at https://nоrthwind-shop.example/billing to keep your order.",
    explanation:
      "The “o” in the link is a Cyrillic letter that looks identical to a Latin one, so the address only resembles the real shop.",
    expectedSignals: ["personal-info", "suspicious-link", "hidden-characters"],
    safeNextStep: "Open the shop's app or type its address yourself and check your order status there.",
  },
  {
    id: "wrong-number-investment",
    title: "Wrong number that turns into investing",
    category: "Investment",
    channel: "Chat",
    mode: "conversation",
    message: [
      "Mia: Hi! Is this Daniel? I was looking for my yoga teacher",
      "Me: Sorry, wrong number!",
      "Mia: Oh no, sorry! You seem so kind though. Where are you based?",
      "Me: I'm a student in Pune.",
      "Mia: Nice to meet you! I work in fashion, but my uncle is a financial analyst.",
      "Mia: Good morning dear, how was your day?",
      "Mia: My uncle showed me a crypto trading platform with 30% weekly returns. I made $4,000 last month!",
      "Mia: Let's move to Telegram, it's easier. Start with just $200 deposit at https://coinpeak-trade.example and I'll guide you.",
    ].join("\n"),
    explanation:
      "No single early message looks dangerous. The pattern is the build-up: an accidental contact, compliments and daily chat, then an investment pitch and a request to deposit money on an unfamiliar platform.",
    expectedSignals: ["trust-then-request", "investment-pitch", "payment-request", "channel-switch"],
    safeNextStep: "Stop replying and block the contact. Never invest through a platform suggested by someone you met online.",
  },
  {
    id: "dentist-reminder",
    title: "Appointment reminder",
    category: "Everyday",
    channel: "SMS",
    message:
      "Hi Sam, this is a reminder that your appointment at Riverside Dental Clinic is on Thursday, 14 Nov at 3:30 PM. Reply C to confirm or call the clinic to reschedule. See you soon!",
    explanation:
      "No requests for money, codes or personal details, no links and no pressure. This is what an ordinary reminder looks like.",
    expectedSignals: [],
    safeNextStep: "If you were expecting it, no action is needed. If you never booked, call the clinic using a number you look up yourself.",
  },
  {
    id: "new-device-alert",
    title: "Sign-in alert with mixed signals",
    category: "Banking",
    channel: "Email",
    message:
      "Northwind Bank: A new device signed in to your account on 12 Nov. If this was you, no action is needed. If not, review your activity in the Northwind app or at http://northwind-account-review.example. We will never ask for your PIN or OTP.",
    explanation:
      "It reads like a genuine alert and even warns you not to share your PIN. But the link uses plain http and a domain we cannot confirm. The safest path is the one it also offers: open the official app.",
    expectedSignals: ["suspicious-link"],
    safeNextStep: "Ignore the link and check recent sign-ins inside the official app you already have installed.",
  },
];

export const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  ...new Set(EXAMPLES.map((e) => e.category)),
];
