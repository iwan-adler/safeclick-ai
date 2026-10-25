/**
 * "I already responded" emergency plan: turns what the person did into an
 * ordered list of actions. Pure logic, no storage, unit tested.
 *
 * Phone numbers and URLs appear only for India's official channels, which
 * were verified against government sources (see lib/data/guide.ts).
 */

export type Exposure =
  | "paid"
  | "card"
  | "otp"
  | "password"
  | "remote-app"
  | "dial-code"
  | "id-documents"
  | "clicked"
  | "replied";

export type Region = "india" | "elsewhere";

export type Urgency = "now" | "today" | "soon";

export interface PlanStep {
  id: string;
  urgency: Urgency;
  title: string;
  detail: string;
}

export const EXPOSURES: { id: Exposure; label: string; hint: string }[] = [
  { id: "paid", label: "I sent money", hint: "UPI, bank transfer, wallet, gift card or crypto" },
  { id: "card", label: "I shared card details", hint: "Card number, expiry date or CVV" },
  { id: "otp", label: "I shared an OTP or UPI PIN", hint: "Read out, typed into a link or sent in chat" },
  { id: "password", label: "I entered a password", hint: "On a page opened from the message" },
  { id: "remote-app", label: "I installed an app or shared my screen", hint: "AnyDesk, TeamViewer, an APK file, screen sharing" },
  { id: "dial-code", label: "I dialled a code", hint: "A code starting with * or #, like *401*" },
  { id: "id-documents", label: "I shared ID documents", hint: "Aadhaar, PAN, passport, photos or selfies" },
  { id: "clicked", label: "I only opened a link", hint: "I did not type anything on the page" },
  { id: "replied", label: "I only replied or called back", hint: "No details shared" },
];

const ORDER: Record<Urgency, number> = { now: 0, today: 1, soon: 2 };

function reportMoney(region: Region): PlanStep {
  return region === "india"
    ? {
        id: "report-1930",
        urgency: "now",
        title: "Call 1930, the National Cyber Crime Helpline",
        detail:
          "Report the payment straight away. Fast reports give the best chance of freezing the money. Then file a complaint at cybercrime.gov.in and keep the acknowledgement number.",
      }
    : {
        id: "report-fraud-line",
        urgency: "now",
        title: "Report to your national fraud or cybercrime service",
        detail: "Find it through an official government website you search for yourself, and keep any reference number you are given.",
      };
}

const BANK_NOW: PlanStep = {
  id: "call-bank",
  urgency: "now",
  title: "Call your bank or payment app",
  detail:
    "Use the number on your card, your passbook or the official app, never one from the message. Ask them to block the card or account and to try to stop or reverse the transaction.",
};

/** Builds a de-duplicated, urgency-ordered plan. */
export function buildPlan(exposures: Exposure[], region: Region): PlanStep[] {
  const steps = new Map<string, PlanStep>();
  const add = (s: PlanStep) => {
    const existing = steps.get(s.id);
    if (!existing || ORDER[s.urgency] < ORDER[existing.urgency]) steps.set(s.id, s);
  };
  const has = (e: Exposure) => exposures.includes(e);

  if (has("remote-app")) {
    add({
      id: "disconnect",
      urgency: "now",
      title: "Disconnect from the internet and end any screen sharing",
      detail: "Turn on airplane mode or switch off Wi-Fi and mobile data, so the other person loses access to your device.",
    });
    add({
      id: "uninstall",
      urgency: "now",
      title: "Uninstall the app you were asked to install",
      detail: "Remove it in your phone's settings. If you installed an APK file, delete the file too, then restart the phone.",
    });
  }

  if (has("dial-code")) {
    add({
      id: "cancel-forwarding",
      urgency: "now",
      title: "Dial ##002# to cancel call forwarding",
      detail: "Codes like *401* or **21* forward your calls and OTP messages to someone else. ##002# cancels all forwarding. Then call your mobile operator from the official number.",
    });
  }

  if (has("paid") || has("card") || has("otp")) add(BANK_NOW);
  if (has("paid")) add(reportMoney(region));

  if (has("otp") || has("password") || has("remote-app")) {
    add({
      id: "change-passwords",
      urgency: "now",
      title: "Change your passwords from a safe device",
      detail: "Start with your email, banking and UPI apps. Use a different device if the scammer had access to this one. Sign out of all other sessions.",
    });
  }

  if (has("card")) {
    add({
      id: "block-card",
      urgency: "now",
      title: "Block the card",
      detail: "Most banking apps let you block a card instantly. Ask for a replacement and check recent transactions with the bank.",
    });
  }

  if (has("otp") || has("password") || has("remote-app") || has("dial-code")) {
    add({
      id: "two-step",
      urgency: "today",
      title: "Turn on two-step verification and check recovery details",
      detail: "Make sure your recovery email and phone number are your own, and remove any forwarding rules or devices you don't recognize.",
    });
  }

  if (has("paid") || has("card") || has("otp") || has("remote-app")) {
    add({
      id: "monitor",
      urgency: "today",
      title: "Watch your accounts closely",
      detail: "Check bank, card and UPI statements for unfamiliar transactions over the next few weeks and report any immediately.",
    });
  }

  if (has("id-documents")) {
    add({
      id: "id-misuse",
      urgency: "today",
      title: "Guard against misuse of your ID",
      detail:
        region === "india"
          ? "Report it at cybercrime.gov.in. Watch for loans or SIM cards taken in your name, and lock your Aadhaar biometrics through UIDAI's official app or website."
          : "Report it to the police and the agency that issued the document. Watch for accounts, loans or SIM cards opened in your name.",
    });
  }

  if (has("clicked")) {
    add({
      id: "close-page",
      urgency: "soon",
      title: "Close the page and don't return to it",
      detail: "Opening a link is usually not enough to cause harm if you didn't type anything. Keep your phone and browser updated, and don't download files from the page.",
    });
  }

  if (has("replied")) {
    add({
      id: "stop-replying",
      urgency: "soon",
      title: "Stop replying and block the sender",
      detail: "Replying can mark your number as active. Expect follow-up attempts and don't engage with them.",
    });
  }

  add({
    id: "save-evidence",
    urgency: "today",
    title: "Save evidence before deleting anything",
    detail: "Take screenshots of the messages, sender details, payment confirmations and transaction IDs. The incident report below helps you collect them.",
  });

  if (!has("paid") && exposures.some((e) => e !== "clicked" && e !== "replied")) {
    add({
      ...reportMoney(region),
      id: region === "india" ? "report-portal" : "report-fraud-line",
      urgency: "today",
      title: region === "india" ? "Report the scam at cybercrime.gov.in" : "Report the scam to your national fraud service",
      detail:
        region === "india"
          ? "Even without a money loss, a report helps police trace the scammers. If money moves later, call 1930 immediately."
          : "Find the service through an official government website, and keep any reference number.",
    });
  }

  add({
    id: "talk",
    urgency: "soon",
    title: "Tell someone you trust",
    detail: "Scams are designed to make careful people act fast. Talking it through helps, and it warns them about the same trick.",
  });

  return [...steps.values()].sort((a, b) => ORDER[a.urgency] - ORDER[b.urgency]);
}
