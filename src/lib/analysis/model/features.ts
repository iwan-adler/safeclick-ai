/**
 * Feature extraction for the on-device classifier.
 *
 * Features are deliberately human-readable so every prediction can be
 * explained: lowercase words ("w:claim"), adjacent word pairs
 * ("b:you have"), and a few normalized token types ("t:<phone>",
 * "t:<money>", "t:<url>", "t:<code>"). Each feature keeps the character span
 * it came from, so the UI can highlight it in the original message.
 */

export interface FeatureHit {
  feature: string;
  start: number;
  end: number;
}

interface Token {
  value: string;
  start: number;
  end: number;
}

const TOKEN_PATTERN =
  /(?:https?:\/\/|www\.)[^\s<>"']+|(?:[£$₹€]|\b(?:rs\.?|inr)) ?\d[\d,.]*|\+?\d[\d ().-]{5,}\d|\d+(?:[.,]\d+)?|[\p{L}][\p{L}\p{M}'’]*/giu;

function classify(raw: string): string {
  if (/^(?:https?:\/\/|www\.)/i.test(raw)) return "<url>";
  if (/^(?:[£$₹€]|rs\.?|inr)/i.test(raw)) return "<money>";
  const digits = raw.replace(/\D/g, "");
  if (/^[+\d]/.test(raw) && digits.length >= 7) return "<phone>";
  if (digits.length >= 4 && digits.length <= 6 && /^\d+$/.test(raw)) return "<code>";
  if (/^\d/.test(raw)) return "<num>";
  return raw.toLowerCase().replace(/['’]/g, "");
}

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const m of text.matchAll(TOKEN_PATTERN)) {
    if (m.index === undefined) continue;
    tokens.push({ value: classify(m[0]), start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

/** All feature occurrences in a text (a feature may occur several times). */
export function extractFeatures(text: string): FeatureHit[] {
  const tokens = tokenize(text);
  const hits: FeatureHit[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prefix = t.value.startsWith("<") ? "t:" : "w:";
    hits.push({ feature: prefix + t.value, start: t.start, end: t.end });
    if (i + 1 < tokens.length) {
      const n = tokens[i + 1];
      hits.push({ feature: `b:${t.value} ${n.value}`, start: t.start, end: n.end });
    }
  }
  return hits;
}

/** Unique feature names in a text (the model uses binary presence). */
export function featureSet(text: string): Set<string> {
  return new Set(extractFeatures(text).map((h) => h.feature));
}

/** Readable label for a feature, e.g. "b:you have" -> "you have", "t:<phone>" -> "a phone number". */
export function describeFeature(feature: string): string {
  const body = feature.slice(2);
  const special: Record<string, string> = {
    "<phone>": "a phone number",
    "<money>": "a money amount",
    "<url>": "a link",
    "<code>": "a 4–6 digit number",
    "<num>": "a number",
  };
  return body
    .split(" ")
    .map((part) => special[part] ?? part)
    .join(" ");
}
