import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../data/scenarios";
import {
  answerScenario,
  finishQuiz,
  goTo,
  initialQuizState,
  OUTCOME_POINTS,
  outcomeFor,
  summarizeQuiz,
} from "./quiz";

function optionWith(index: number, outcome: "safest" | "partial" | "unsafe") {
  const o = SCENARIOS[index].options.find((x) => x.outcome === outcome);
  if (!o) throw new Error("missing option");
  return o.id;
}

describe("scenario content", () => {
  it("has at least five scenarios, each with exactly one safest option", () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(5);
    for (const s of SCENARIOS) {
      expect(s.options.filter((o) => o.outcome === "safest")).toHaveLength(1);
      expect(s.options.length).toBeGreaterThanOrEqual(3);
      expect(s.lesson.length).toBeGreaterThan(20);
    }
  });
});

describe("quiz state", () => {
  it("records an answer and locks it", () => {
    let state = initialQuizState();
    const s = SCENARIOS[0];
    state = answerScenario(state, s, optionWith(0, "unsafe"));
    const locked = answerScenario(state, s, optionWith(0, "safest"));
    expect(locked).toBe(state);
    expect(outcomeFor(s, state.answers[s.id])).toBe("unsafe");
  });

  it("ignores unknown option ids", () => {
    const state = initialQuizState();
    expect(answerScenario(state, SCENARIOS[0], "nope")).toBe(state);
  });

  it("clamps navigation to the scenario range", () => {
    const state = initialQuizState();
    expect(goTo(state, -3, SCENARIOS.length).index).toBe(0);
    expect(goTo(state, 99, SCENARIOS.length).index).toBe(SCENARIOS.length - 1);
  });

  it("only finishes when every scenario is answered", () => {
    let state = initialQuizState();
    expect(finishQuiz(state, SCENARIOS).finished).toBe(false);
    SCENARIOS.forEach((s, i) => (state = answerScenario(state, s, optionWith(i, "safest"))));
    expect(finishQuiz(state, SCENARIOS).finished).toBe(true);
  });
});

describe("summarizeQuiz", () => {
  it("scores a perfect run at 100%", () => {
    let state = initialQuizState();
    SCENARIOS.forEach((s, i) => (state = answerScenario(state, s, optionWith(i, "safest"))));
    const summary = summarizeQuiz(state, SCENARIOS);
    expect(summary.percent).toBe(100);
    expect(summary.safestCount).toBe(SCENARIOS.length);
    expect(summary.review).toEqual([]);
  });

  it("gives half points for partial answers and lists them for review", () => {
    let state = initialQuizState();
    SCENARIOS.forEach((s, i) => (state = answerScenario(state, s, optionWith(i, "partial"))));
    const summary = summarizeQuiz(state, SCENARIOS);
    expect(summary.points).toBe(SCENARIOS.length * OUTCOME_POINTS.partial);
    expect(summary.percent).toBe(50);
    expect(summary.review).toHaveLength(SCENARIOS.length);
  });

  it("counts unanswered scenarios as zero", () => {
    const summary = summarizeQuiz(initialQuizState(), SCENARIOS);
    expect(summary).toMatchObject({ points: 0, answered: 0, percent: 0 });
  });

  it("chooses an encouraging headline for every band", () => {
    expect(summarizeQuiz(initialQuizState(), SCENARIOS).headline).toMatch(/start/);
  });
});
