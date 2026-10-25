/**
 * Deterministic detection rules.
 *
 * Each rule is a set of regular expressions plus optional sentence-level
 * conditions. Rules are intentionally simple so that every result can be
 * explained by pointing at the exact words that triggered it.
 */
import { INDIA_RULES } from "./rules-india";
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
export const REQUEST_VERBS =
  /\b(share|send|tell|give|provide|reply|forward|read (?:out|me)|confirm|enter|submit|type|update|verify|upload|fill|complete|review|need|require|requires|required|what(?:'s| is)|batao|bataiye|batayein|bataye|bata do|bhejo|bhejein|bhejiye|bhej do|share karein|share karo|share kare|daalein|dalein|daaliye|enter karein|update karein|bharein|bhariye)\b|(बताएं|बताइए|बताओ|शेयर करें|भेजें|भेजिए|दर्ज करें|डालें|अपडेट करें)/iu;

// Protective phrasing used by legitimate senders ("We will never ask for your PIN").
export const PROTECTIVE_NEGATION =
  /\b(never|do not|don't|dont|won't|will not|not to)\b[^.!?\n]{0,40}\b(share|ask|send|give|disclose|request|tell)\b|\b(share|batayein|bataye|bataen|dein|karein|kare)\b[^.!?\n]{0,12}\b(mat|na|nahi|naa)\b|\b(kabhi|kisi (?:ko|ke saath|se))\b[^.!?\n]{0,30}\b(na|mat|nahi)\b|(किसी के साथ|किसी को|कभी)[^.!?\n]{0,30}(न |ना |मत |नहीं)/iu;

const CORE_RULES: Rule[] = [
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
      /\b(?:final|last|2nd|second) (?:attempt|notification)\b|\btried (?:2|to) contact (?:u|you)\b/giu,
      /\b(?:turant|jaldi(?: se)?|aaj hi|der na karein|24 ghante (?:mein|me|ke andar))\b/giu,
      /(तुरंत|जल्दी|24 घंटे|आज ही)/gu,
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
      /\b(otp|one[- ]time (?:pass(?:word|code)|code)|verification code|security code|auth(?:entication)? code|2fa code|login code|the code (?:we|you) (?:just )?(?:sent|received)|\d[- ]digit code|apple id|icloud (?:account|id)|(?:netbanking|internet banking|online banking) (?:details|id|password)|pin(?: number)?|password|passcode|cvv|login (?:details|credentials)|credentials)\b/giu,
      /(ओटीपी|पिन|पासवर्ड)/gu,
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
      /\b(?:paise|payment|fee|charges?) (?:bhejo|bhejein|bhejiye|transfer karein|jama karein|bharein|karein)\b/giu,
      /\b((?:processing|registration|training|release|delivery|redelivery|handling|clearance|activation|verification|onboarding|application) (?:fee|charge)s?|customs (?:fee|duty|charge)|security deposit|refundable deposit|upfront (?:fee|payment|cost)|small (?:fee|charge|payment))\b/giu,
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
      /\b(?:unusual|suspicious) (?:activit(?:y|ies)|log-?in|sign-?in|transactions?)\b|\bunauthori[sz]ed (?:access|transactions?|log-?in)\b/giu,
      /\b(suspend(?:ed)?|suspension|de-?activat(?:e|ed|ion)|locked out|lose access|legal action|lawsuit|prosecut\w*|penalt(?:y|ies))\b/giu,
      /\b(?:arrest warrant|warrant (?:has been |was |is )?issued|(?:you|you'll|you will|will) (?:be|get) arrested|(?:police|legal) (?:action|case|complaint) (?:against|on) (?:you|your))\b/giu,
      /\b(?:will be|has been|have been|is being|be|been|gets?) (?:temporarily |permanently )?(?:locked|blocked|closed|terminated|disabled|frozen|cancelled|canceled|deleted|restricted|barred|put on hold|on hold)\b/giu,
      /\b(?:hold|freeze|block) your (?:account|card|amount|wallet|money|sim|number|payment)\b|\baccount (?:is |has been )?(?:on hold|restricted|limited)\b/giu,
      /\b(?:block|band|suspend|deactivate|freeze|bandh) (?:ho jayega|ho jayegi|kar diya jayega|kar di jayegi|hoga)\b|\bkat (?:jayega|jayegi|di jayegi|diya jayega)\b/giu,
      /((?:ब्लॉक|बंद|निलंबित) (?:हो जाएगा|हो जाएगी|कर दिया जाएगा)|कट जाएगा|कट जाएगी)/gu,
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
      /\b(rbi|reserve bank|sbi|hdfc|icici|axis bank|kotak|pnb|bank of baroda|paytm|phonepe|google pay|gpay|yono|npci|uidai|income tax (?:department|dept)|trai|cbi|enforcement directorate|cyber (?:cell|crime|police)|narcotics (?:bureau|department)|customs department|fedex|blue dart|india post|electricity (?:board|department|office)|bses|msedcl|jio|airtel|bsnl|valued (?:network|mobile) customer)\b/giu,
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
      /\b(award(?:ed)?|bonus prize|cash prize|claim (?:code|number)|selected to receive|unredeemed (?:points|bonus)|secret admirer|dating service|free (?:entry|msg|camera|holiday|tickets?|recharge|data)|(?:gift|discount|cash) vouchers?|lottery|lucky (?:winner|customer|draw)|w1nner|we owe you|(?:entitled|eligible) to (?:a |an )?(?:refund|payment|grant|relief|reward|bonus)|issued a payment|cash ?back pending)\b/giu,
      /\b(claim (?:this|this weeks?|this week's|your|now|the|a|an) (?:offer|reward|prize|refund|bonus|gift|compensation)|entitled to (?:claim|update|receive|a free)|claim compensation|(?:pre-?approved|instant) loan|loan (?:approved|sanctioned)|refused a loan|can'?t get credit|no credit check)\b/giu,
      /\b(part[- ]time job|work from home job|daily (?:income|earning)|like (?:youtube )?videos? (?:and|&) earn|prepaid task|task[- ]based (?:job|work)|ghar baithe (?:kamayein|kamao|paise))\b/giu,
      /\b(?:aapko|aapne)\b[^.!?\n]{0,40}\b(?:mila|jeeta|jeete|milega|milenge) (?:hai|hain)\b|\b(?:lottery lagi|inaam|jeet gaye|cashback mila)\b/giu,
      /(लॉटरी|इनाम|जीत गए|कैशबैक|मुफ्त)/gu,
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
      /\b(social security(?: number)?|ssn|aadhaa?r(?: number| card)?|pan (?:card|number)|passport(?: number| details| copy| photo| scan)?|national id(?: number)?|id (?:card|proof)|driver'?s licen[cs]e|date of birth|mother'?s maiden name|bank (?:account|login) (?:number|details)|account number|routing number|ifsc(?: code)?|card (?:number|details)|credit card|debit card|expiry date|home address|selfie|(?:bank|banking|account|personal|kyc) (?:details|information|info)|name,? (?:and )?(?:address|mobile))\b/giu,
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
    id: "prize-claim",
    title: "Says you won money or a prize",
    kind: "lure",
    family: "lure",
    severity: "high",
    weight: 20,
    explanation:
      "Telling you that you have already won a specific amount is the bait in lottery and prize scams. Real draws do not text winners asking them to call, reply or pay to collect.",
    recommendation: "Do not call, reply or pay to claim. If you really entered a draw, check its official website yourself.",
    patterns: [
      /\b(?:won|win|winner|w1nner|awarded|(?:specially )?selected (?:to|2) receive|selected for|entitled to|bonus|prize|award)\b[^.!?\n]{0,40}?(?:[£$₹€]|\b(?:rs\.?|inr|usd|gbp|pounds?|euros?|rupees|crores?|lakhs?|cash)\b|\d[\d,.]*euro)/giu,
      /\b(?:you(?:'ve| have)?|u|ur number|your (?:mobile|number)) (?:have |has )?won (?:an?|the|our)? ?(?:\w+ ){0,3}(?:iphone|ipad|ipod|nokia|samsung|car|holiday|cruise|voucher|prize|laptop|camera|tv)\b/giu,
      /(?:[£$₹€]|\b(?:rs\.?|inr)) ?[\d,.]+(?: \w+){0,4} (?:award|prize|bonus|reward|lottery|jackpot)\b/giu,
    ],
  },
  {
    id: "call-to-action-number",
    title: "Asks you to call or text a number",
    kind: "contact",
    family: "links",
    severity: "medium",
    weight: 12,
    explanation:
      "A phone number inside the message connects you to whoever sent it, not necessarily to the organization they claim to be. Some numbers also charge high rates per minute.",
    recommendation: "Do not use the number in the message. Find the official number on the organization's website, app or your card.",
    patterns: [
      /\b(?:call|ring|dial|phone|text|txt|sms|whatsapp|contact|reply)(?: (?:us|me|now|free|back|our|the|customer care|this number|claims? (?:line|hotline)|on|at|to|from)){0,4}:? ?\+?\(?\d[\d ().-]{6,}\d/giu,
      /\b(?:is number|niche diye number|helpline number)\b[^.!?\n]{0,20}\b(?:par|pe)\b[^.!?\n]{0,10}\b(?:call|sampark)\b/giu,
    ],
  },
  {
    id: "premium-rate",
    title: "Uses a premium-rate number or per-message charge",
    kind: "payment",
    family: "money",
    severity: "medium",
    weight: 14,
    explanation:
      "Premium-rate numbers and “per minute” or “per message” charges mean replying or calling costs you money, which is how many prize and “secret admirer” texts make theirs.",
    recommendation: "Do not call or text back. Report the message as spam and delete it.",
    patterns: [
      /\b(?:09\d{8,9}|087\d{7,8})\b/gu,
      /\b\d{1,3}(?:\.\d\d)? ?p ?(?:\/|per ) ?(?:min|minute|msg|message|txt|wk|week)\b|\b\d+ ?ppm\b|\b(?:£|gbp ?)\d+(?:\.\d\d)? ?(?:\/|per) ?(?:min|minute|msg|txt|wk|week|call)\b/giu,
      /\b(?:po ?box ?\d+\w*)\b/giu,
      /\b(?:[Tt]ext|[Tt]xt|TXT|TEXT|[Ss]end|SEND|[Rr]eply|REPLY)(?: (?:the word|with))? [A-Z0-9]{2,12} (?:to|2) \d{4,6}\b/gu,
    ],
  },
  {
    id: "link-cta",
    title: "Pushes you to open a link",
    kind: "link",
    family: "links",
    severity: "low",
    weight: 8,
    explanation:
      "Telling you to tap a link is how most phishing messages move you to a fake page. On its own it is a small hint: genuine services send links too.",
    recommendation: "Instead of tapping, open the organization's app or type its website address yourself.",
    patterns: [
      /\b(?:click (?:here|the link|this link|below|on the link)|tap (?:here|the link|this link)|follow (?:the|our|this) (?:secure )?link|open (?:the|this) link)\b/giu,
      /\blink (?:par|pe) click (?:karein|kare|karo|kijiye)\b|\b(?:is|niche diye(?: gaye)?) link (?:par|pe)\b/giu,
      /(लिंक पर क्लिक)/gu,
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
      /\bdear (?:customer|user|client|member|account holder|sir\/madam|sir or madam|voucher holder|winner|subscriber|valued (?:customer|member|user|client))\b/giu,
    ],
  },
];

/** All rules: general rules plus the India pack (English, Hinglish and Hindi). */
export const RULES: Rule[] = [...CORE_RULES, ...INDIA_RULES];

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
