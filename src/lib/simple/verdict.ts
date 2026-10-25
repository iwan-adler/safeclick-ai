/**
 * Plain-language verdicts for senior ("simple") mode, in Hindi and English.
 *
 * The goal is one clear instruction a grandparent can act on alone. The
 * wording never calls a message "safe": the lowest level still says to stop
 * if anyone asks for money or a code. Pure logic, unit tested.
 */
import type { AnalysisResult } from "../analysis/types";
import { HINDI_SIGNAL_TITLES } from "../warning-card";

export type SimpleLanguage = "hi" | "en";
export type SimpleTone = "danger" | "caution" | "calm";

export interface SimpleVerdict {
  tone: SimpleTone;
  title: string;
  /** One to three short instructions, most important first. */
  steps: string[];
  /** Up to two plain reasons, from the detected signals. */
  reasons: string[];
  /** Text for read-aloud. Built only from fixed phrases, never the message itself. */
  speech: string;
}

export const SIMPLE_STRINGS = {
  hi: {
    appTitle: "SafeClick",
    tagline: "कोई मैसेज शक वाला लगे? यहाँ जाँचें।",
    paste: "मैसेज पेस्ट करें",
    screenshot: "स्क्रीनशॉट चुनें",
    type: "मैसेज लिखें",
    typeHint: "यहाँ मैसेज लिखें या पेस्ट करें",
    check: "जाँचें",
    checking: "जाँच हो रही है…",
    reading: "स्क्रीनशॉट पढ़ा जा रहा है…",
    listen: "सुनें",
    stopListening: "रोकें",
    askFamily: (name: string) => `${name} को कॉल करें`,
    sendFamily: "परिवार को भेजें",
    another: "दूसरा मैसेज जाँचें",
    lostMoney: "पैसे चले गए? 1930 पर कॉल करें",
    reasonsTitle: "क्यों?",
    pasteFailed: "पेस्ट नहीं हो पाया। नीचे मैसेज लिखें या पेस्ट करें।",
    emptyClipboard: "कॉपी किया हुआ कोई मैसेज नहीं मिला।",
    ocrFailed: "स्क्रीनशॉट नहीं पढ़ पाए। मैसेज लिखकर जाँचें।",
    privacy: "आपका मैसेज इसी फ़ोन पर जाँचा जाता है। कहीं नहीं भेजा जाता।",
    fullApp: "पूरा ऐप खोलें",
    setup: "परिवार का नंबर सेट करें",
    setupTitle: "परिवार का नंबर",
    setupHelp: "यह नंबर सिर्फ़ इसी फ़ोन पर सेव होता है, ताकि एक बटन से कॉल हो सके।",
    nameLabel: "नाम (जैसे: बेटा, पोती, राहुल)",
    phoneLabel: "फ़ोन नंबर",
    save: "सेव करें",
    remove: "हटाएँ",
    cancel: "वापस",
    shared: "शेयर किया गया मैसेज जाँचा गया।",
    sharedFailed: "शेयर किया गया मैसेज नहीं मिला। कृपया दोबारा शेयर करें या पेस्ट करें।",
    languageName: "English",
    verdicts: {
      danger: {
        title: "रुकिए! यह धोखा (स्कैम) लगता है",
        steps: ["इसका जवाब न दें", "कोई OTP, PIN या पासवर्ड न बताएं", "लिंक न खोलें, कोई पैसा न भेजें"],
      },
      caution: {
        title: "सावधान! पहले पक्का करें",
        steps: ["अभी कुछ न करें", "बैंक या उस व्यक्ति को अपने पुराने नंबर से खुद फ़ोन करके पूछें"],
      },
      calm: {
        title: "कोई आम खतरा नहीं दिखा",
        steps: ["फिर भी, अगर कोई पैसे या OTP माँगे, तो रुकें और परिवार से पूछें"],
      },
    },
  },
  en: {
    appTitle: "SafeClick",
    tagline: "Unsure about a message? Check it here.",
    paste: "Paste a message",
    screenshot: "Choose a screenshot",
    type: "Type a message",
    typeHint: "Type or paste the message here",
    check: "Check",
    checking: "Checking…",
    reading: "Reading the screenshot…",
    listen: "Listen",
    stopListening: "Stop",
    askFamily: (name: string) => `Call ${name}`,
    sendFamily: "Send to family",
    another: "Check another message",
    lostMoney: "Lost money? Call 1930",
    reasonsTitle: "Why?",
    pasteFailed: "Couldn't paste. Type or paste the message below.",
    emptyClipboard: "No copied message was found.",
    ocrFailed: "Couldn't read the screenshot. Type the message to check it.",
    privacy: "Your message is checked on this phone. It is never sent anywhere.",
    fullApp: "Open the full app",
    setup: "Set a family number",
    setupTitle: "Family number",
    setupHelp: "Saved only on this phone, so one button can call them.",
    nameLabel: "Name (for example: Son, Riya, Rahul)",
    phoneLabel: "Phone number",
    save: "Save",
    remove: "Remove",
    cancel: "Back",
    shared: "The shared message was checked.",
    sharedFailed: "The shared message didn't arrive. Please share it again or paste it.",
    languageName: "हिन्दी",
    verdicts: {
      danger: {
        title: "Stop! This looks like a scam",
        steps: ["Don't reply", "Never share an OTP, PIN or password", "Don't open links or send money"],
      },
      caution: {
        title: "Careful! Check first",
        steps: ["Don't do anything yet", "Call the bank or person yourself, on a number you already have"],
      },
      calm: {
        title: "No common warning signs found",
        steps: ["Still, if anyone asks for money or an OTP, stop and ask family"],
      },
    },
  },
} as const;

const TONE: Record<AnalysisResult["level"], SimpleTone> = { high: "danger", caution: "caution", lower: "calm" };

export function simpleVerdict(result: AnalysisResult, language: SimpleLanguage): SimpleVerdict {
  const tone = TONE[result.level];
  const copy = SIMPLE_STRINGS[language].verdicts[tone];
  const reasons =
    tone === "calm"
      ? []
      : result.signals
          .filter((s) => s.id !== "pattern-model" && s.id !== "generic-greeting")
          .slice(0, 2)
          .map((s) => (language === "hi" ? (HINDI_SIGNAL_TITLES[s.id] ?? s.title) : s.title));
  const steps = [...copy.steps];
  const speech = [copy.title, ...steps].join(language === "hi" ? "। " : ". ");
  return { tone, title: copy.title, steps, reasons, speech };
}

/** Normalizes a phone number for a tel: link (digits and a leading +). */
export function telHref(phone: string): string | null {
  const cleaned = phone.trim().replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return cleaned.replace(/\D/g, "").length >= 6 ? `tel:${cleaned}` : null;
}
