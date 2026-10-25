/**
 * Deterministic detection rules.
 *
 * Each rule is a set of regular expressions plus optional sentence-level
 * conditions. Rules are intentionally simple so that every result can be
 * explained by pointing at the exact words that triggered it.
 */
import type { Evidence, Severity, SignalFamily, SignalKind } from "./types";

export interface Rule {
  id: string;
  title: string;
  kind: SignalKind;
  family: SignalFamily;
  severity: Severity;
  weight: number;
  explanation: string;
  recommendation: string;
  /** Any match produces evidence (subject to the sentence conditions). */
  patterns: RegExp[];
  /** If set, the sentence containing the match must ALSO match this. */
  requireInSentence?: RegExp;
  /**
   * If the sentence containing a match also matches this, the match is
   * ignored. Used for protective phrasing like "never share this code".
   */
  excludeSentence?: RegExp;
}

// Words that turn a mention into a request ("send", "confirm", "share", ...).
const REQUEST_VERBS =
  /\b(share|send|tell|give|provide|reply|forward|read (?:out|me)|confirm|enter|submit|type|update|verify|upload|fill|need|require|requires|required|what(?:'s| is))\b/iu;

// Protective phrasing used by legitimate senders ("We will never ask for your PIN").
const PROTECTIVE_NEGATION =
  /\b(never|do not|don't|dont|won't|will not|not to)\b[^.!?\n]{0,40}\b(share|ask|send|give|disclose|request|tell)\b/iu;

export const RULES: Rule[] = [
  {
    id: "urgency",
    title: "Creates time pressure",
    kind: "urgency",
    family: "pressure",
    severity: "medium",
    weight: 14,
    explanation:
      "Short deadlines are designed to make you act before you have time to think or check. Genuine organizations rarely require action within minutes.",
    recommendation: "Slow down. A real deadline will still be there after you verify the message independently.",
    patterns: [
      /\b(urgent(?:ly)?|immediately|right away|asap|act now|respond now|final (?:notice|warning|reminder)|last chance|today only|don'?t delay|time[- ]sensitive|limited time|before it'?s too late)\b/giu,
      /\b(?:within|in the next|in) (?:\d+|one|two|few|twenty[- ]four) ?(?:hours?|hrs?|minutes?|mins?)\b/giu,
      /\bexpires? (?:today|tonight|soon|in \d+ ?(?:hours?|minutes?|mins?|hrs?))\b/giu,
      /\bbefore (?:midnight|end of (?:the )?day|tonight)\b/giu,
    ],
  },
  {
    id: "credential-request",
    title: "Asks for a code, PIN or password",
    kind: "sensitive",
    family: "sensitive-data",
    severity: "high",
    weight: 30,
    explanation:
      "One-time codes, PINs and passwords are the keys to your accounts. Banks, employers and support teams do not need you to send them by message or call.",
    recommendation: "Never share a code, PIN or password, even with someone who says they are from your bank or support.",
    patterns: [
      /\b(otp|one[- ]time (?:pass(?:word|code)|code)|verification code|security code|auth(?:entication)? code|2fa code|login code|the code (?:we|you) (?:just )?(?:sent|received)|pin(?: number)?|password|passcode|cvv|login (?:details|credentials)|credentials)\b/giu,
    ],
    requireInSentence: REQUEST_VERBS,
    excludeSentence: PROTECTIVE_NEGATION,
  },
  {
    id: "payment-request",
    title: "Requests money or an unusual payment",
    kind: "payment",
    family: "money",
    severity: "high",
    weight: 26,
    explanation:
      "Gift cards, cryptocurrency and wire transfers are hard to reverse, which is why scammers prefer them. Unexpected fees to release a parcel, prize or job are a common trick.",
    recommendation: "Do not pay. Check any charge by logging in to the official website or app yourself.",
    patterns: [
      /\b(gift ?cards?|(?:itunes|google play|steam|apple) (?:gift )?cards?|bitcoin|btc|crypto(?:currency)?(?! (?:trading|investment|mining|platform))|usdt|ethereum|wire transfer|western union|moneygram)\b/giu,
      /\b((?:processing|registration|training|release|delivery|redelivery|handling|clearance|activation|verification|onboarding|application) fee|customs (?:fee|duty|charge)|security deposit|refundable deposit|upfront (?:fee|payment|cost)|small (?:fee|charge|payment))\b/giu,
      /\b(send (?:money|funds|payment)|transfer (?:money|funds|the (?:money|amount|funds))|make (?:a|the) payment|pay (?:a|the) (?:small )?(?:fee|charge|amount))\b/giu,
      /\b(?:pay|send|transfer)\b[^.!?\n]{0,25}(?:[$₹€£]|\b(?:rs\.?|inr|usd|eur|gbp)) ?\d[\d,.]*/giu,
      // "deposit $200", "invest just $500", "$200 deposit"
      /\b(?:deposit|invest|top up|recharge) (?:just |only |a |an )?[$₹€£] ?\d[\d,.]*/giu,
      /[$₹€£] ?\d[\d,.]* (?:deposit|investment|top-up)\b/giu,
    ],
  },
  {
    id: "account-threat",
    title: "Threatens account loss or legal trouble",
    kind: "threat",
    family: "pressure",
    severity: "medium",
    weight: 20,
    explanation:
      "Threats of suspension, fines or arrest are meant to frighten you into acting quickly. Real organizations explain problems through official channels and give you time to respond.",
    recommendation: "Check your account status by opening the official app or typing the website address yourself.",
    patterns: [
      /\b(suspend(?:ed|sion)?|deactivat(?:e|ed|ion)|locked out|lose access|legal action|lawsuit|arrest(?:ed)?|warrant|prosecut\w*|penalt(?:y|ies))\b/giu,
      /\b(?:will be|has been|have been|is being|be) (?:locked|blocked|closed|terminated|disabled|frozen|cancelled|canceled|deleted)\b/giu,
    ],
  },
  {
    id: "impersonation",
    title: "Claims to be from an organization or authority",
    kind: "impersonation",
    family: "authority",
    severity: "low",
    weight: 10,
    explanation:
      "Anyone can type a bank, government office or company name into a message. SafeClick cannot verify who sent it, so treat the claimed identity as unconfirmed.",
    recommendation: "Contact the organization using details you find yourself, not the ones in the message.",
    patterns: [
      /\b(your bank|(?:bank|fraud|security|account|support|billing) (?:team|department|desk)|customer (?:care|support|service)|it (?:support|department|helpdesk)|help ?desk|tax (?:department|office|authority)|revenue (?:service|agency)|customs (?:office|department)|post office|postal service|courier|delivery (?:service|company|partner)|government|ministry|police department|hr (?:department|team)|human resources|recruit(?:er|ment team)|ceo|managing director)\b/giu,
    ],
  },
  {
    id: "bypass-verification",
    title: "Discourages normal checks",
    kind: "bypass",
    family: "isolation",
    severity: "medium",
    weight: 18,
    explanation:
      "Asking you to avoid calling the bank, use a new number or reply only in this chat cuts you off from the people who could confirm the story.",
    recommendation: "Confirm through a contact method you already had before this message arrived.",
    patterns: [
      /\b(?:don'?t|do not|no need to) (?:call|contact|visit|verify|check with|go to) (?:the |your )?(?:bank|branch|office|support|helpline|app|website|anyone|them)\b/giu,
      /\b(new (?:number|phone|whatsapp|account)|changed my (?:number|phone)|lost my phone|can'?t (?:talk|call|speak)(?: right now)?|in a meeting|only (?:reply|respond|communicate) (?:here|on|via|through)|reply (?:only )?to this (?:message|number|email)|use this link (?:instead|only)|not through the (?:app|website)|outside (?:the|our) (?:app|platform))\b/giu,
    ],
  },
  {
    id: "unexpected-benefit",
    title: "Offers an unexpected prize, refund or job",
    kind: "lure",
    family: "lure",
    severity: "medium",
    weight: 16,
    explanation:
      "Surprise winnings, refunds or easy high-paying jobs are used as bait. If you did not enter, apply or expect it, be very cautious.",
    recommendation: "Ask yourself whether you expected this. Look up the offer independently before responding.",
    patterns: [
      /\b(congratulations|congrats|you(?:'ve| have)? (?:won|been selected|been chosen)|winner|prize|lottery|jackpot|lucky draw|cash ?back|claim (?:your|now|the)|free (?:gift|iphone|phone|money|vacation|trip)|work from home|no experience (?:needed|required)|guaranteed (?:job|income|returns?|profit)|double your)\b/giu,
      /\b(refund (?:of|is|has been|pending|available)|eligible for (?:a |an )?(?:refund|reward|grant|bonus))\b/giu,
      /\b(?:earn|make) (?:up to )?(?:[$₹€£] ?)?\d[\d,]*(?: ?(?:usd|inr|rs))? ?(?:\/|per|a|every) ?(?:day|week|hour)\b/giu,
    ],
  },
  {
    id: "secrecy",
    title: "Asks you to keep it secret",
    kind: "secrecy",
    family: "isolation",
    severity: "high",
    weight: 22,
    explanation:
      "Requests for secrecy stop you from asking friends, family or colleagues, who might spot the scam. Legitimate requests rarely need to be hidden.",
    recommendation: "Talk to someone you trust before acting. Secrecy is a reason to pause.",
    patterns: [
      /\b(keep (?:this|it) (?:between us|confidential|secret|private|quiet|to yourself)|between you and me|strictly confidential|tell no ?one|this is (?:a )?secret)\b/giu,
      /\b(?:don'?t|do not) (?:tell|inform|mention (?:this|it) to|discuss (?:this|it) with) (?:anyone|anybody|your|others|the)\b/giu,
    ],
  },
  {
    id: "personal-info",
    title: "Requests sensitive personal details",
    kind: "sensitive",
    family: "sensitive-data",
    severity: "high",
    weight: 24,
    explanation:
      "Identity numbers, card details and account numbers can be used to open accounts or make payments in your name.",
    recommendation: "Do not send identity or financial details by message. Provide them only on a site or app you opened yourself.",
    patterns: [
      /\b(social security(?: number)?|ssn|aadhaa?r(?: number| card)?|pan (?:card|number)|passport(?: number| details| copy| photo| scan)?|national id(?: number)?|id (?:card|proof)|driver'?s licen[cs]e|date of birth|mother'?s maiden name|bank (?:account|login) (?:number|details)|account number|routing number|ifsc(?: code)?|card (?:number|details)|credit card|debit card|expiry date|home address|selfie)\b/giu,
    ],
    requireInSentence: REQUEST_VERBS,
    excludeSentence: PROTECTIVE_NEGATION,
  },
  {
    id: "remote-access",
    title: "Asks you to install an app or share your screen",
    kind: "device",
    family: "device",
    severity: "high",
    weight: 26,
    explanation:
      "Remote-access and screen-sharing tools let another person see or control your device, including banking apps and one-time codes.",
    recommendation: "Do not install apps or share your screen at a stranger's request. Uninstall anything you installed and disconnect.",
    patterns: [
      /\b(anydesk|teamviewer|rustdesk|quick ?support|remote (?:access|desktop|control)|screen ?shar(?:e|ing)|share (?:your|the|my) screen|install (?:this|the|our) (?:app|apk|application|software)|download (?:this|the|our) (?:app|apk))\b/giu,
      /\b[\w-]+\.apk\b/giu,
    ],
  },
  {
    id: "channel-switch",
    title: "Moves the conversation to another app",
    kind: "bypass",
    family: "isolation",
    severity: "medium",
    weight: 14,
    explanation:
      "Asking to continue on WhatsApp, Telegram or another private app moves you away from the platform's safety tools and reporting, and makes the conversation harder to trace.",
    recommendation: "Stay on the original platform. Be cautious of anyone who urgently wants to switch apps.",
    patterns: [
      /\b(?:move|switch|continue|talk|chat|text|message|contact me)(?: (?:this|our chat|the conversation|with me))? (?:to|on|over|via) (?:whatsapp|telegram|signal|wechat|line app|kik|a private (?:chat|app))\b/giu,
      /\badd me on (?:whatsapp|telegram|signal|wechat)\b/giu,
    ],
  },
  {
    id: "investment-pitch",
    title: "Pitches an investment or trading opportunity",
    kind: "lure",
    family: "lure",
    severity: "medium",
    weight: 18,
    explanation:
      "Unsolicited investment tips, trading platforms and promised returns are a hallmark of investment scams, including slow-build “friendship” scams that end in a fake trading app.",
    recommendation: "Never invest through a platform or contact you met online. Check any firm with your country's financial regulator.",
    patterns: [
      /\b(investment (?:platform|opportunity|plan|app)|trading (?:platform|app|account|signals?|bot)|crypto (?:trading|investment|mining)|forex|insider (?:tip|information)|(?:daily|weekly|monthly) (?:returns?|profits?)|\d{1,3} ?% (?:daily|weekly|monthly|returns?|profit))\b/giu,
      /\bmy (?:uncle|aunt|mentor|cousin|friend) (?:is|works as) an? (?:analyst|trader|investor|financial advisor)\b/giu,
    ],
  },
  {
    id: "generic-greeting",
    title: "Uses a generic greeting",
    kind: "generic",
    family: "deception",
    severity: "low",
    weight: 6,
    explanation:
      "Services you have an account with usually know your name. A generic greeting can mean the message was sent to many people at once. Many legitimate bulk messages do this too.",
    recommendation: "Treat a generic greeting as a small hint, not proof. Look at the other signals.",
    patterns: [
      /\bdear (?:customer|user|client|member|account holder|sir\/madam|sir or madam|valued (?:customer|member|user|client))\b/giu,
    ],
  },
];

/** Offsets where sentences end. A sentence ends at .!? followed by whitespace, or at a newline. */
export function sentenceBounds(text: string): { start: number; end: number }[] {
  const bounds: { start: number; end: number }[] = [];
  let start = 0;
  for (const m of text.matchAll(/[.!?]+(?=\s)|\n+/g)) {
    const end = (m.index ?? 0) + m[0].length;
    bounds.push({ start, end });
    start = end;
  }
  if (start < text.length) bounds.push({ start, end: text.length });
  return bounds;
}

function sentenceFor(bounds: { start: number; end: number }[], text: string, index: number): string {
  const b = bounds.find((s) => index >= s.start && index < s.end);
  return b ? text.slice(b.start, b.end) : text;
}

const MAX_EVIDENCE_PER_RULE = 4;

/** Runs a single rule and returns its non-overlapping evidence spans. */
export function runRule(rule: Rule, text: string, bounds = sentenceBounds(text)): Evidence[] {
  const found: Evidence[] = [];
  for (const pattern of rule.patterns) {
    // Reset lastIndex defensively; matchAll clones the regex but keep it explicit.
    pattern.lastIndex = 0;
    for (const m of text.matchAll(pattern)) {
      if (m.index === undefined || !m[0].trim()) continue;
      const sentence = sentenceFor(bounds, text, m.index);
      if (rule.requireInSentence && !rule.requireInSentence.test(sentence)) continue;
      if (rule.excludeSentence && rule.excludeSentence.test(sentence)) continue;
      const ev = { text: m[0], start: m.index, end: m.index + m[0].length };
      if (found.some((f) => ev.start < f.end && f.start < ev.end)) continue;
      found.push(ev);
    }
  }
  return found.sort((a, b) => a.start - b.start).slice(0, MAX_EVIDENCE_PER_RULE);
}
