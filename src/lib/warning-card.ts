/**
 * Content for the "warn a family member" card, in English or Hindi.
 * Pure logic: the component draws it on a canvas on the device.
 */
import type { AnalysisResult, ConcernLevel } from "./analysis/types";
import { maskSensitive } from "./emergency/report";

export type CardLanguage = "en" | "hi";

export interface CardContent {
  language: CardLanguage;
  level: ConcernLevel;
  title: string;
  levelLabel: string;
  signsHeading: string;
  signs: string[];
  stepsHeading: string;
  steps: string[];
  excerpt: string | null;
  footer: string;
}

const STRINGS = {
  en: {
    title: "Think before you trust this message",
    levels: { lower: "Lower apparent risk", caution: "Needs caution", high: "High concern" },
    signsHeading: "Warning signs",
    stepsHeading: "What to do",
    noSigns: "No common warning signs found",
    steps: {
      high: [
        "Don't reply, click links or call numbers in it",
        "Never share an OTP, PIN or password",
        "Check with the bank or person using a number you already have",
      ],
      caution: ["Pause before doing anything", "Check through the official app or a number you already know"],
      lower: ["No common warning signs, but stay alert", "Only act on requests you were expecting"],
    },
    lostMoney: "If money was lost, call 1930 straight away",
    footer: "Checked privately with SafeClick AI. Nothing was uploaded.",
  },
  hi: {
    title: "इस मैसेज पर भरोसा करने से पहले सोचें",
    levels: { lower: "कम जोखिम दिखा", caution: "सावधानी ज़रूरी", high: "बहुत ज़्यादा ख़तरा" },
    signsHeading: "चेतावनी के संकेत",
    stepsHeading: "क्या करें",
    noSigns: "आम चेतावनी संकेत नहीं मिले",
    steps: {
      high: [
        "जवाब न दें, लिंक पर क्लिक न करें, इसमें दिए नंबर पर कॉल न करें",
        "OTP, PIN या पासवर्ड कभी किसी को न बताएं",
        "बैंक या व्यक्ति से अपने पास पहले से मौजूद नंबर पर बात करके जाँच करें",
      ],
      caution: ["कुछ भी करने से पहले रुकें", "आधिकारिक ऐप या जाने-पहचाने नंबर से जाँच करें"],
      lower: ["आम चेतावनी संकेत नहीं मिले, फिर भी सतर्क रहें", "सिर्फ़ उन्हीं अनुरोधों पर ध्यान दें जिनकी आपको उम्मीद थी"],
    },
    lostMoney: "अगर पैसे गए हों तो तुरंत 1930 पर कॉल करें",
    footer: "SafeClick AI से निजी तौर पर जाँचा गया। कुछ भी अपलोड नहीं हुआ।",
  },
} as const;

/** Hindi titles for every signal id. Unknown ids fall back to the English title. */
export const HINDI_SIGNAL_TITLES: Record<string, string> = {
  urgency: "जल्दबाज़ी का दबाव",
  "credential-request": "OTP, PIN या पासवर्ड माँगता है",
  "payment-request": "पैसे या असामान्य भुगतान माँगता है",
  "account-threat": "खाता बंद होने या कानूनी कार्रवाई की धमकी",
  impersonation: "किसी संस्था या अधिकारी होने का दावा",
  "bypass-verification": "जाँच करने से रोकता है",
  "unexpected-benefit": "अचानक इनाम, रिफ़ंड या नौकरी का लालच",
  secrecy: "बात छुपाने को कहता है",
  "personal-info": "निजी जानकारी माँगता है",
  "remote-access": "ऐप इंस्टॉल या स्क्रीन शेयर करवाता है",
  "prize-claim": "पैसे या इनाम जीतने का दावा",
  "call-to-action-number": "किसी नंबर पर कॉल या मैसेज करने को कहता है",
  "premium-rate": "महँगे प्रीमियम नंबर या प्रति-मैसेज शुल्क",
  "link-cta": "लिंक खोलने का दबाव",
  "channel-switch": "बातचीत दूसरे ऐप पर ले जाना चाहता है",
  "investment-pitch": "निवेश या ट्रेडिंग का ऑफ़र",
  "generic-greeting": "आम अभिवादन, जैसे “प्रिय ग्राहक”",
  "kyc-update": "KYC या PAN/आधार अपडेट करने को कहता है",
  "upi-request": "UPI PIN डालने या QR स्कैन करने को कहता है",
  "dial-code": "* से शुरू होने वाला कोड डायल करवाता है",
  "authority-threat-india": "गिरफ़्तारी, कनेक्शन कटने या पुलिस केस की धमकी",
  "suspicious-link": "संदिग्ध लिंक",
  "hidden-characters": "छिपे या मिलते-जुलते अक्षर",
  "trust-then-request": "पहले भरोसा जीतता है, फिर कुछ माँगता है",
  "pattern-model": "जाने-माने स्कैम मैसेज जैसा",
};

const MAX_SIGNS = 4;
const MAX_EXCERPT = 140;

export function buildCardContent(
  result: AnalysisResult,
  language: CardLanguage,
  options: { message?: string; includeExcerpt?: boolean; india?: boolean } = {},
): CardContent {
  const t = STRINGS[language];
  const signs = result.signals
    .slice(0, MAX_SIGNS)
    .map((s) => (language === "hi" ? (HINDI_SIGNAL_TITLES[s.id] ?? s.title) : s.title));
  const steps: string[] = [...t.steps[result.level]];
  if (options.india !== false && result.level !== "lower") steps.push(t.lostMoney);

  let excerpt: string | null = null;
  if (options.includeExcerpt && options.message?.trim()) {
    const masked = maskSensitive(options.message.trim().replace(/\s+/g, " "));
    excerpt = masked.length > MAX_EXCERPT ? `${masked.slice(0, MAX_EXCERPT - 1)}…` : masked;
  }

  return {
    language,
    level: result.level,
    title: t.title,
    levelLabel: t.levels[result.level],
    signsHeading: t.signsHeading,
    signs: signs.length ? signs : [t.noSigns],
    stepsHeading: t.stepsHeading,
    steps,
    excerpt,
    footer: t.footer,
  };
}

/** Plain-text version for pasting into WhatsApp or SMS. */
export function buildCardText(c: CardContent): string {
  const icon = c.level === "high" ? "🚨" : c.level === "caution" ? "⚠️" : "ℹ️";
  return [
    `${icon} ${c.title}`,
    `*${c.levelLabel}*`,
    "",
    `${c.signsHeading}:`,
    ...c.signs.map((s) => `• ${s}`),
    "",
    `${c.stepsHeading}:`,
    ...c.steps.map((s) => `✅ ${s}`),
    ...(c.excerpt ? ["", `“${c.excerpt}”`] : []),
    "",
    c.footer,
  ].join("\n");
}
