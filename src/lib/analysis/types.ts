/**
 * Shared types for the SafeClick AI analysis engine.
 * The engine is pure TypeScript: no DOM, no network, no storage.
 */

export type Severity = "low" | "medium" | "high";

/** Visual/semantic grouping used for icons in the UI. */
export type SignalKind =
  | "urgency"
  | "sensitive"
  | "payment"
  | "threat"
  | "impersonation"
  | "link"
  | "bypass"
  | "lure"
  | "secrecy"
  | "device"
  | "obfuscation"
  | "escalation"
  | "contact"
  | "model"
  | "generic";

/**
 * Families group rules that describe the same underlying tactic.
 * Scoring counts the strongest rule in a family in full and the rest
 * at a reduced rate, so overlapping rules are not double-counted.
 */
export type SignalFamily =
  | "sensitive-data"
  | "money"
  | "pressure"
  | "authority"
  | "links"
  | "isolation"
  | "lure"
  | "device"
  | "deception"
  | "escalation"
  | "model";

export type ConcernLevel = "lower" | "caution" | "high";

export interface Evidence {
  /** Exact text as it appears in the original message. */
  text: string;
  /** Start offset (UTF-16 code units) in the original message. */
  start: number;
  /** End offset, exclusive. */
  end: number;
}

export interface Signal {
  /** Stable identifier, e.g. "credential-request". */
  id: string;
  title: string;
  kind: SignalKind;
  family: SignalFamily;
  severity: Severity;
  /** Points this rule contributes before overlap/combination handling. */
  weight: number;
  /** Plain-language explanation of why this matters. */
  explanation: string;
  evidence: Evidence[];
  /** One recommended action specific to this signal. */
  recommendation: string;
}

export type UrlFindingId =
  | "ip-host"
  | "punycode"
  | "non-ascii-host"
  | "shortener"
  | "insecure-http"
  | "at-symbol"
  | "many-subdomains"
  | "lookalike-brand"
  | "deceptive-keywords"
  | "uncommon-tld"
  | "very-long"
  | "malformed"
  | "free-hosting";

export interface UrlFinding {
  id: UrlFindingId;
  label: string;
  detail: string;
  weight: number;
}

export interface UrlReport {
  /** The URL-like text exactly as found in the message. */
  raw: string;
  start: number;
  end: number;
  /** Parsed hostname, or null if it could not be parsed. */
  host: string | null;
  findings: UrlFinding[];
}

export interface CombinationNote {
  id: string;
  label: string;
  bonus: number;
}

export interface RecommendedAction {
  id: string;
  text: string;
  /** Higher priority actions are listed first. */
  priority: number;
}

export interface AnalysisStats {
  characters: number;
  words: number;
  links: number;
}

export type AnalysisMode = "message" | "conversation";

/** Output of the on-device classifier, shown even when it raises no signal. */
export interface ModelInsight {
  probability: number;
  band: "low" | "moderate" | "strong";
  /** Features that pushed the score towards "scam", strongest first. */
  topFeatures: { label: string; weight: number }[];
}

export interface ConversationTurn {
  index: number;
  /** Speaker label as written ("Alex"), or null if none was given. */
  speaker: string | null;
  /** True for turns labelled "Me", "You" or "I" (the person using SafeClick). */
  isUser: boolean;
  start: number;
  end: number;
  /** Kinds of signals whose evidence falls inside this turn. */
  kinds: SignalKind[];
}

export interface ConversationInfo {
  turns: ConversationTurn[];
  /** False when no speaker labels or paragraph breaks could be found. */
  parsed: boolean;
  /** Index of the turn where a request first appears after rapport, if any. */
  escalationTurn: number | null;
  /** Earlier turns by the same speaker before that request. */
  turnsBeforeRequest: number;
}

export interface AnalysisResult {
  ok: true;
  mode: AnalysisMode;
  /** Present only in conversation mode. */
  conversation?: ConversationInfo;
  /** Present when the classifier ran. */
  model?: ModelInsight;
  score: number;
  level: ConcernLevel;
  signals: Signal[];
  urls: UrlReport[];
  combinations: CombinationNote[];
  recommendations: RecommendedAction[];
  stats: AnalysisStats;
}

export type AnalysisErrorCode = "empty" | "too-long";

export interface AnalysisError {
  ok: false;
  code: AnalysisErrorCode;
  message: string;
}

export type AnalysisOutcome = AnalysisResult | AnalysisError;
