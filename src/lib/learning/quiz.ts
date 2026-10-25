/**
 * Pure state logic for the learning mode, kept separate from React so it
 * can be unit tested. Points: safest = 1, partial = 0.5, unsafe = 0.
 */
import type { OptionOutcome, Scenario } from "../data/scenarios";

export const OUTCOME_POINTS: Record<OptionOutcome, number> = { safest: 1, partial: 0.5, unsafe: 0 };

export interface QuizState {
  index: number;
  /** scenarioId -> chosen optionId. Answers are locked once chosen. */
  answers: Record<string, string>;
  finished: boolean;
}

export function initialQuizState(): QuizState {
  return { index: 0, answers: {}, finished: false };
}

export function answerScenario(state: QuizState, scenario: Scenario, optionId: string): QuizState {
  if (state.answers[scenario.id]) return state;
  if (!scenario.options.some((o) => o.id === optionId)) return state;
  return { ...state, answers: { ...state.answers, [scenario.id]: optionId } };
}

export function goTo(state: QuizState, index: number, total: number): QuizState {
  const clamped = Math.max(0, Math.min(total - 1, index));
  return { ...state, index: clamped };
}

export function finishQuiz(state: QuizState, scenarios: Scenario[]): QuizState {
  const allAnswered = scenarios.every((s) => state.answers[s.id]);
  return allAnswered ? { ...state, finished: true } : state;
}

export function outcomeFor(scenario: Scenario, optionId: string | undefined): OptionOutcome | null {
  if (!optionId) return null;
  return scenario.options.find((o) => o.id === optionId)?.outcome ?? null;
}

export interface QuizSummary {
  points: number;
  maxPoints: number;
  safestCount: number;
  answered: number;
  total: number;
  percent: number;
  /** Scenarios where the safest option was not chosen. */
  review: string[];
  headline: string;
}

export function summarizeQuiz(state: QuizState, scenarios: Scenario[]): QuizSummary {
  let points = 0;
  let safestCount = 0;
  let answered = 0;
  const review: string[] = [];
  for (const s of scenarios) {
    const outcome = outcomeFor(s, state.answers[s.id]);
    if (outcome) answered++;
    if (outcome) points += OUTCOME_POINTS[outcome];
    if (outcome === "safest") safestCount++;
    else review.push(s.id);
  }
  const maxPoints = scenarios.length;
  const percent = maxPoints === 0 ? 0 : Math.round((points / maxPoints) * 100);
  const headline =
    percent >= 90
      ? "Excellent judgment in this exercise."
      : percent >= 60
        ? "Good instincts, with a few patterns worth revisiting."
        : "A great start. The explanations below are worth a second read.";
  return { points, maxPoints, safestCount, answered, total: scenarios.length, percent, review, headline };
}
