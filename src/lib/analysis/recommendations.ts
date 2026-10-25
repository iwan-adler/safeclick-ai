import type { ConcernLevel, RecommendedAction, Signal } from "./types";

const SEVERITY_PRIORITY = { high: 80, medium: 60, low: 40 } as const;

const BASELINE: Record<ConcernLevel, RecommendedAction[]> = {
  high: [
    {
      id: "no-engage",
      text: "Do not reply, click links, scan codes or call numbers from this message.",
      priority: 100,
    },
    {
      id: "already-acted",
      text: "If you already shared details or paid, contact your bank or the service right away using the number on your card or in the official app.",
      priority: 95,
    },
  ],
  caution: [
    {
      id: "pause-verify",
      text: "Pause before acting. Open the official app or type the website address yourself to check whether the request is real.",
      priority: 90,
    },
  ],
  lower: [
    {
      id: "expected-only",
      text: "Only act on requests you were expecting. If anything feels off, verify with the sender through a contact you already have.",
      priority: 70,
    },
  ],
};

const ALWAYS: RecommendedAction[] = [
  {
    id: "trusted-channel",
    text: "Verify through a channel you already trust: the official app, a website you type yourself, or a number from your card or statement.",
    priority: 85,
  },
  {
    id: "ask-someone",
    text: "If you are unsure, show the message to someone you trust before deciding.",
    priority: 30,
  },
];

/**
 * Builds a de-duplicated, priority-ordered list of next steps from the
 * concern level and the signals that were found.
 */
export function buildRecommendations(level: ConcernLevel, signals: Signal[]): RecommendedAction[] {
  const actions = new Map<string, RecommendedAction>();
  const add = (a: RecommendedAction) => {
    const existing = actions.get(a.id);
    if (!existing || existing.priority < a.priority) actions.set(a.id, a);
  };

  BASELINE[level].forEach(add);
  ALWAYS.forEach(add);
  for (const s of signals) {
    add({ id: `signal-${s.id}`, text: s.recommendation, priority: SEVERITY_PRIORITY[s.severity] });
  }

  // Two different signals can share identical advice; keep the first.
  const seenText = new Set<string>();
  return [...actions.values()]
    .sort((a, b) => b.priority - a.priority)
    .filter((a) => (seenText.has(a.text) ? false : (seenText.add(a.text), true)));
}
