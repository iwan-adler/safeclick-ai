/**
 * Builds a plain-text incident report for a bank, the police or a cyber-crime
 * portal. Generated in the browser only; nothing is stored or sent.
 */
import { EXPOSURES, type Exposure, type PlanStep } from "./plan";

export interface IncidentDetails {
  happenedAt: string;
  channel: string;
  sender: string;
  message: string;
  amount: string;
  paymentMethod: string;
  transactionIds: string;
  bank: string;
  notes: string;
}

export const EMPTY_DETAILS: IncidentDetails = {
  happenedAt: "",
  channel: "",
  sender: "",
  message: "",
  amount: "",
  paymentMethod: "",
  transactionIds: "",
  bank: "",
  notes: "",
};

/**
 * Masks card and account numbers (12–19 digits, optionally spaced or dashed),
 * keeping the last 4 digits, and removes anything that looks like an OTP or
 * PIN after words such as "OTP" or "PIN". A report never needs them.
 */
export function maskSensitive(text: string): string {
  return text
    .replace(/\b(?:\d[ -]?){11,18}\d\b/g, (m) => {
      const digits = m.replace(/\D/g, "");
      return `${"•".repeat(digits.length - 4)}${digits.slice(-4)}`;
    })
    .replace(/\b(otp|pin|cvv|password|passcode)(\s*(?:is|was|:|-|=)?\s*)(\S+)/gi, (_m, word: string, sep: string) => `${word}${sep}[removed]`);
}

export function buildIncidentReport(
  details: IncidentDetails,
  exposures: Exposure[],
  completed: PlanStep[],
  /** Omitted in the live preview; stamped when the report is copied or downloaded. */
  generatedAt?: Date,
): string {
  const line = (label: string, value: string) => (value.trim() ? `${label}: ${maskSensitive(value.trim())}` : null);
  const what = EXPOSURES.filter((e) => exposures.includes(e.id)).map((e) => `- ${e.label}`);
  const lines = [
    "INCIDENT REPORT: SUSPECTED SCAM",
    generatedAt
      ? `Prepared with SafeClick AI on ${generatedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
      : "Prepared with SafeClick AI",
    "",
    "1. WHEN AND HOW",
    line("Date and time of incident", details.happenedAt),
    line("How it reached me", details.channel),
    line("Sender (number, ID, email or profile)", details.sender),
    "",
    "2. WHAT I DID",
    ...(what.length ? what : ["- Not specified"]),
    "",
    "3. MONEY INVOLVED",
    line("Amount", details.amount),
    line("Payment method", details.paymentMethod),
    line("Transaction / UTR / reference IDs", details.transactionIds),
    line("My bank or payment app", details.bank),
    "",
    "4. THE MESSAGE",
    details.message.trim() ? maskSensitive(details.message.trim()) : "Not provided",
    "",
    "5. STEPS ALREADY TAKEN",
    ...(completed.length ? completed.map((s) => `- ${s.title}`) : ["- None recorded yet"]),
    "",
    "6. OTHER NOTES",
    details.notes.trim() ? maskSensitive(details.notes.trim()) : "None",
    "",
    "Attach screenshots of the messages and payment confirmations when you submit this report.",
    "Card and account numbers are masked, and codes, PINs and passwords are removed automatically. Never share them, even with officials.",
  ];
  return lines.filter((l): l is string => l !== null).join("\n");
}
