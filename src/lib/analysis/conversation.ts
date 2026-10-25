/**
 * Conversation mode: splits a pasted chat thread into turns and looks for a
 * pattern single-message rules cannot see: someone builds rapport over
 * several messages and only later asks for money, codes, personal details or
 * device access ("trust, then request").
 */
import type { ConversationInfo, ConversationTurn, Evidence, Signal, SignalFamily } from "./types";

/** Families that represent the "ask" at the end of a slow-build scam. */
const REQUEST_FAMILIES: SignalFamily[] = ["sensitive-data", "money", "device"];

/** Minimum earlier turns by the same speaker before a request counts as escalation. */
export const MIN_TURNS_BEFORE_REQUEST = 3;
/** With this many earlier turns, no explicit rapport cue is needed. */
const TURNS_WITHOUT_RAPPORT = 5;

// "[10:42] Alex: hi", "10:42 PM - Alex: hi", "Alex: hi". The colon must be
// followed by whitespace so "https://..." is never treated as a speaker.
const SPEAKER_LINE =
  /^[ \t]*(?:\[[^\]\n]{1,25}\][ \t]*|\d{1,2}[:.]\d{2}(?:[ \t]*[ap]\.?m\.?)?[ \t]*[-–][ \t]*)?([\p{L}\p{N}][\p{L}\p{N} ._'()+-]{0,30}?)[ \t]*:[ \t]+\S/iu;

const USER_NAMES = /^(?:me|you|i|myself)$/i;

/** Friendly or affectionate language used to build trust. Only used inside conversations. */
const RAPPORT =
  /\b(how (?:are|was) (?:you|your (?:day|week|weekend))|good (?:morning|night) (?:dear|my|beautiful|handsome|friend)|dear|sweetheart|darling|my love|honey|babe|soulmate|i (?:feel|felt) (?:a |so )?(?:connection|connected|close to you)|you(?:'re| are) (?:so |really )?(?:special|beautiful|kind|amazing)|trust me|we(?:'re| are) (?:friends|family)|nice to (?:meet|talk to|chat with) you|god bless|miss you|thinking (?:about|of) you)\b/giu;

export function parseTurns(text: string): { turns: Omit<ConversationTurn, "kinds">[]; parsed: boolean } {
  const lines: { start: number; end: number; speaker: string | null }[] = [];
  let offset = 0;
  for (const line of text.split("\n")) {
    const m = SPEAKER_LINE.exec(line);
    lines.push({ start: offset, end: offset + line.length, speaker: m ? m[1].trim() : null });
    offset += line.length + 1;
  }

  const labelled = lines.filter((l) => l.speaker).length >= 2;
  const turns: Omit<ConversationTurn, "kinds">[] = [];

  if (labelled) {
    for (const l of lines) {
      if (l.speaker) {
        turns.push({ index: turns.length, speaker: l.speaker, isUser: USER_NAMES.test(l.speaker), start: l.start, end: l.end });
      } else if (turns.length > 0 && text.slice(l.start, l.end).trim()) {
        // Continuation line of the previous message.
        turns[turns.length - 1].end = l.end;
      }
    }
  } else {
    // No speaker labels: treat blank-line separated paragraphs as messages.
    for (const m of text.matchAll(/[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g)) {
      if (m.index === undefined || !m[0].trim()) continue;
      turns.push({ index: turns.length, speaker: null, isUser: false, start: m.index, end: m.index + m[0].length });
    }
  }

  if (turns.length < 2) {
    return { turns: [{ index: 0, speaker: null, isUser: false, start: 0, end: text.length }], parsed: false };
  }
  return { turns, parsed: true };
}

function inTurn(e: Evidence, t: { start: number; end: number }) {
  return e.start >= t.start && e.start < t.end;
}

/**
 * Builds turn summaries and, when the pattern is present, an extra
 * "trust then request" signal. Pure: takes the already-detected signals.
 */
export function analyzeConversation(text: string, signals: Signal[]): { info: ConversationInfo; signal: Signal | null } {
  const { turns: raw, parsed } = parseTurns(text);

  const turns: ConversationTurn[] = raw.map((t) => ({
    ...t,
    kinds: [...new Set(signals.filter((s) => s.evidence.some((e) => inTurn(e, t))).map((s) => s.kind))],
  }));

  const requestSignals = signals.filter((s) => REQUEST_FAMILIES.includes(s.family));
  const firstRequest = turns.find(
    (t) => !t.isUser && requestSignals.some((s) => s.evidence.some((e) => inTurn(e, t))),
  );

  const info: ConversationInfo = { turns, parsed, escalationTurn: null, turnsBeforeRequest: 0 };
  if (!parsed || !firstRequest) return { info, signal: null };

  // Earlier messages from the same person (or any non-user if unlabelled).
  const earlier = turns.filter(
    (t) => t.index < firstRequest.index && !t.isUser && (firstRequest.speaker === null || t.speaker === firstRequest.speaker),
  );
  const rapport: Evidence[] = [];
  for (const t of earlier) {
    const slice = text.slice(t.start, t.end);
    for (const m of slice.matchAll(RAPPORT)) {
      if (m.index === undefined) continue;
      rapport.push({ text: m[0], start: t.start + m.index, end: t.start + m.index + m[0].length });
    }
  }
  // Ignore earlier turns that already contained a request.
  const cleanEarlier = earlier.filter((t) => !requestSignals.some((s) => s.evidence.some((e) => inTurn(e, t))));

  const escalates =
    cleanEarlier.length >= MIN_TURNS_BEFORE_REQUEST && (rapport.length > 0 || cleanEarlier.length >= TURNS_WITHOUT_RAPPORT);
  if (!escalates) return { info, signal: null };

  info.escalationTurn = firstRequest.index;
  info.turnsBeforeRequest = cleanEarlier.length;

  const requestEvidence = requestSignals
    .flatMap((s) => s.evidence)
    .filter((e) => inTurn(e, firstRequest))
    .sort((a, b) => a.start - b.start)
    .slice(0, 1);

  return {
    info,
    signal: {
      id: "trust-then-request",
      title: "Builds trust first, then asks",
      kind: "escalation",
      family: "escalation",
      severity: "high",
      weight: 22,
      explanation: `The first ${cleanEarlier.length} messages from ${firstRequest.speaker ?? "this sender"} contain no requests${
        rapport.length ? " and use friendly or affectionate language" : ""
      }, then message ${firstRequest.index + 1} asks for money, details or access. Slow trust-building before a request is how romance, “wrong number” and investment scams work.`,
      evidence: [...rapport.slice(0, 2), ...requestEvidence],
      recommendation:
        "However long you have been talking, do not send money, codes or personal details to someone you have only met online. Talk it over with someone you trust first.",
    },
  };
}
