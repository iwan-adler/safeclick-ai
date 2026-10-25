/**
 * India rule pack: scam patterns reported widely in India (UPI, KYC, "digital
 * arrest", SIM/electricity disconnection, courier-drug calls), written to
 * match English, Hinglish (Hindi in Latin script) and some Hindi (Devanagari).
 *
 * Devanagari patterns cannot use \b (JavaScript word boundaries are ASCII
 * only), so they match plain phrases instead.
 */
import type { Rule } from "./rules";

export const INDIA_RULES: Rule[] = [
  {
    id: "kyc-update",
    title: "Asks you to update KYC or link PAN/Aadhaar",
    kind: "sensitive",
    family: "sensitive-data",
    severity: "high",
    weight: 24,
    explanation:
      "Banks, wallets and mobile operators do not ask you to complete KYC, or to link PAN or Aadhaar, by tapping a link or calling a number in an SMS. Fake KYC pages steal login details, card numbers and OTPs.",
    recommendation: "Update KYC only inside the official app or at a branch or store. Never through a link or caller.",
    patterns: [
      /\b(?:re-?kyc|e-?kyc|kyc)\b[^.!?\n]{0,40}?\b(?:update[sd]?|expire[sd]?|pending|incomplete|verif\w*|complete|suspend\w*|block\w*|karein|kare|kijiye|nahi)\b/giu,
      /\b(?:update|complete|verify)\b[^.!?\n]{0,25}?\b(?:re-?kyc|e-?kyc|kyc)\b/giu,
      /\b(?:pan|aadhaa?r)\b[^.!?\n]{0,25}?\b(?:link|linking|update|verify)\b/giu,
      /\b(?:link|update|verify)\b[^.!?\n]{0,15}?\b(?:pan|aadhaa?r)\b/giu,
      /(केवाईसी)/gu,
    ],
  },
  {
    id: "upi-request",
    title: "Asks for your UPI PIN or to scan/approve a request",
    kind: "payment",
    family: "money",
    severity: "high",
    weight: 26,
    explanation:
      "You never need to enter your UPI PIN, scan a QR code or approve a request to receive money. A UPI PIN only ever sends money out of your account.",
    recommendation: "Never enter your UPI PIN or approve a request to “receive” money. Decline it and block the sender.",
    patterns: [
      /\b(?:enter|daalein|dalein|type|share)\b[^.!?\n]{0,20}?\bupi pin\b/giu,
      /\bupi pin\b[^.!?\n]{0,40}?\b(?:receive|get|credit\w*|milenge|aayenge|refund|cashback)\b/giu,
      /\bscan\b[^.!?\n]{0,25}?\bqr\b[^.!?\n]{0,40}?\b(?:receive|get|credit\w*|refund|cashback|prize|milenge)\b/giu,
      /\b(?:approve|accept)\b[^.!?\n]{0,30}?\b(?:collect |payment |upi )?request\b/giu,
    ],
  },
  {
    id: "dial-code",
    title: "Asks you to dial a code starting with *",
    kind: "device",
    family: "device",
    severity: "high",
    weight: 22,
    explanation:
      "Codes like *401* or **21* can forward your calls and SMS, including OTPs, to someone else's phone. Scammers pose as courier or telecom staff and ask you to dial them.",
    recommendation: "Never dial a * or # code someone sends you. If you already did, dial ##002# to cancel call forwarding and call your mobile operator.",
    patterns: [
      /\b(?:dial|dialling|dialing|call|press|type)\b[^.!?\n]{0,20}?\*{1,2}\d{2,3}[\d*]*#?/giu,
      /\*{1,2}(?:401|21|61|62|67)\*[\d*]*#?/gu,
    ],
  },
  {
    id: "authority-threat-india",
    title: "Threatens arrest, disconnection or a police case",
    kind: "threat",
    family: "pressure",
    severity: "high",
    weight: 24,
    explanation:
      "“Digital arrest” is not a real legal procedure. Police, CBI, customs and courier companies do not settle cases over video calls or ask for money to clear your name, and electricity or SIM disconnections are not handled by calling a number in an SMS.",
    recommendation: "Hang up or ignore it. Contact the organization through its official website or helpline, and report the attempt to your local cyber crime helpline.",
    patterns: [
      /\bdigital(?:ly)? arrest\w*\b/giu,
      /\b(?:parcel|package|courier)\b[^.!?\n]{0,60}?\b(?:drugs?|narcotics|illegal items?|contraband|fake passports?|mdma)\b/giu,
      /\b(?:sim|mobile number|connection)\b[^.!?\n]{0,30}?\b(?:will be|has been|ho jayega|hoga)\b[^.!?\n]{0,15}?\b(?:blocked|disconnected|deactivated|suspended|band|block)\b/giu,
      /\b(?:electricity|power|bijli)\b[^.!?\n]{0,50}?\b(?:disconnect\w*|cut off|will be cut|kat jayegi|kat di jayegi|band)\b/giu,
      /\b(?:cbi|enforcement directorate|narcotics (?:bureau|department)|cyber (?:cell|crime|police)|trai|customs)\b[^.!?\n]{0,60}?\b(?:case|fir|warrant|arrest\w*|investigation|complaint|registered|money laundering)\b/giu,
      /\bmoney laundering\b/giu,
    ],
  },
];
