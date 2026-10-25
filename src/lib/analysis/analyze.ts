/**
 * Entry point of the analysis engine. Pure and synchronous: the same input
 * always produces the same output, and nothing leaves the device.
 */
import { analyzeConversation } from "./conversation";
import { runModel } from "./model";
import { buildRecommendations } from "./recommendations";
import { RULES, runRule, sentenceBounds } from "./rules";
import { scoreSignals } from "./scoring";
import type { AnalysisMode, AnalysisOutcome, ConversationInfo, Evidence, ModelInsight, Severity, Signal } from "./types";
import { analyzeUrls, urlRiskWeight } from "./urls";

export const MAX_MESSAGE_LENGTH = 5000;

// Zero-width and invisible formatting characters, built from code points so
// they stay visible in source code.
const INVISIBLE_CHARS = new RegExp(
  "[" + [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x00ad].map((c) => String.fromCharCode(c)).join("") + "]+",
  "g",
);

const HAS_LATIN = /\p{Script=Latin}/u;
const HAS_LOOKALIKE_SCRIPT = /[\p{Script=Cyrillic}\p{Script=Greek}]/u;

function detectObfuscation(text: string): Signal | null {
  const evidence: Evidence[] = [];
  for (const m of text.matchAll(INVISIBLE_CHARS)) {
    if (m.index === undefined) continue;
    // Show the surrounding word so the user has something visible to look at.
    const start = Math.max(0, text.lastIndexOf(" ", m.index) + 1);
    const nextSpace = text.indexOf(" ", m.index + m[0].length);
    const end = nextSpace === -1 ? text.length : nextSpace;
    evidence.push({ text: text.slice(start, end), start, end });
  }
  for (const m of text.matchAll(/[\p{L}\p{M}]{2,}/gu)) {
    if (m.index === undefined) continue;
    if (HAS_LATIN.test(m[0]) && HAS_LOOKALIKE_SCRIPT.test(m[0])) {
      evidence.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  // Digit-for-letter swaps inside words ("V0DAF0NE", "W1NNER") dodge spam filters.
  for (const m of text.matchAll(/\b[A-Za-z]*[A-Za-z][01][A-Za-z][A-Za-z0-9]*\b/g)) {
    if (m.index === undefined) continue;
    const letters = m[0].replace(/[^A-Za-z]/g, "");
    if (letters.length >= 3 && m[0].length >= 4) {
      evidence.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  if (evidence.length === 0) return null;
  const unique = evidence
    .filter((e, i) => evidence.findIndex((o) => o.start < e.end && e.start < o.end) === i)
    .sort((a, b) => a.start - b.start)
    .slice(0, 4);
  return {
    id: "hidden-characters",
    title: "Uses hidden or look-alike characters",
    kind: "obfuscation",
    family: "deception",
    severity: "medium",
    weight: 14,
    explanation:
      "Some words mix alphabets (for example a Cyrillic letter that looks like a Latin one), swap digits for letters (“V0DAF0NE”) or contain invisible characters. This can disguise brand names or slip past spam filters.",
    evidence: unique,
    recommendation: "Do not trust how a name or link looks. Type addresses yourself instead of copying them.",
  };
}

function severityForWeight(weight: number): Severity {
  if (weight >= 20) return "high";
  if (weight >= 12) return "medium";
  return "low";
}

export interface AnalyzeOptions {
  /** "conversation" also parses chat turns and looks for trust-then-request escalation. */
  mode?: AnalysisMode;
  /** Include the on-device classifier (default true). Set false for rules-only analysis. */
  useModel?: boolean;
}

export function analyzeMessage(input: string, options: AnalyzeOptions = {}): AnalysisOutcome {
  const mode: AnalysisMode = options.mode ?? "message";
  if (typeof input !== "string" || input.trim().length === 0) {
    return { ok: false, code: "empty", message: "Paste or type a message to analyze." };
  }
  if (input.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: "too-long",
      message: `This message is ${input.length.toLocaleString("en-US")} characters. Please shorten it to ${MAX_MESSAGE_LENGTH.toLocaleString("en-US")} characters or fewer.`,
    };
  }

  // Normalize line endings only. Offsets must stay aligned with what the user typed.
  const text = input.replace(/\r\n?/g, "\n");
  const bounds = sentenceBounds(text);
  const signals: Signal[] = [];

  for (const rule of RULES) {
    const evidence = runRule(rule, text, bounds);
    if (evidence.length === 0) continue;
    const { id, title, kind, family, severity, weight, explanation, recommendation } = rule;
    signals.push({ id, title, kind, family, severity, weight, explanation, recommendation, evidence });
  }

  const urls = analyzeUrls(text);
  const linkWeight = urlRiskWeight(urls);
  if (linkWeight > 0) {
    const flagged = urls.filter((u) => u.findings.length > 0);
    signals.push({
      id: "suspicious-link",
      title: "Link has unusual characteristics",
      kind: "link",
      family: "links",
      severity: severityForWeight(linkWeight),
      weight: linkWeight,
      explanation:
        "One or more links have features often seen in deceptive links. A link can look fine and still be harmful, and an odd-looking link can be harmless, so check the destination independently.",
      evidence: flagged.slice(0, 4).map((u) => ({ text: u.raw, start: u.start, end: u.end })),
      recommendation: "Do not open the link. Go to the organization's site by typing its address or using its official app.",
    });
  }

  const obfuscation = detectObfuscation(text);
  if (obfuscation) signals.push(obfuscation);

  let model: ModelInsight | undefined;
  if (options.useModel !== false) {
    const { insight, signal } = runModel(text);
    model = insight;
    if (signal) signals.push(signal);
  }

  let conversation: ConversationInfo | undefined;
  if (mode === "conversation") {
    const { info, signal } = analyzeConversation(text, signals);
    if (signal) {
      signals.push(signal);
      if (info.escalationTurn !== null) info.turns[info.escalationTurn].kinds.push("escalation");
    }
    conversation = info;
  }

  // Strongest first so the most important explanation is read first.
  signals.sort((a, b) => b.weight - a.weight);

  const { score, level, combinations } = scoreSignals(signals);

  return {
    ok: true,
    mode,
    ...(conversation ? { conversation } : {}),
    ...(model ? { model } : {}),
    score,
    level,
    signals,
    urls,
    combinations,
    recommendations: buildRecommendations(level, signals),
    stats: {
      characters: text.length,
      words: text.trim().split(/\s+/u).filter(Boolean).length,
      links: urls.length,
    },
  };
}
