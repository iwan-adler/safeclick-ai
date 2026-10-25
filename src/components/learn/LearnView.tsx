"use client";

import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, CircleX, GraduationCap, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SCENARIOS, type OptionOutcome, type Scenario } from "@/lib/data/scenarios";
import {
  answerScenario,
  finishQuiz,
  goTo,
  initialQuizState,
  outcomeFor,
  summarizeQuiz,
  type QuizState,
} from "@/lib/learning/quiz";
import { Badge, Button, cn, PageHeader, Progress } from "../ui/primitives";

const OUTCOME_UI: Record<OptionOutcome, { label: string; icon: typeof CircleCheck; box: string; text: string }> = {
  safest: { label: "Safest choice", icon: CircleCheck, box: "border-mint-200 bg-mint-50", text: "text-mint-700" },
  partial: { label: "Partly safe", icon: CircleAlert, box: "border-amber-200 bg-amber-50", text: "text-amber-700" },
  unsafe: { label: "Risky choice", icon: CircleX, box: "border-coral-200 bg-coral-50", text: "text-coral-700" },
};

function ScenarioCard({ scenario, chosen, onChoose }: { scenario: Scenario; chosen: string | undefined; onChoose: (id: string) => void }) {
  const answered = Boolean(chosen);
  const choice = scenario.options.find((o) => o.id === chosen);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (choice) feedbackRef.current?.focus({ preventScroll: false });
  }, [choice]);

  return (
    <article className="card overflow-hidden animate-fade-up" aria-labelledby={`sc-${scenario.id}`}>
      <div className="border-b border-line bg-gradient-to-b from-lavender-50/70 to-transparent p-5 sm:p-6">
        <h2 id={`sc-${scenario.id}`} className="text-lg font-semibold tracking-tight text-ink">
          {scenario.title}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{scenario.context}</p>
        <blockquote className="mt-4 rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-3 text-[14.5px] leading-relaxed text-ink shadow-[var(--shadow-card)]">
          {scenario.prompt}
        </blockquote>
      </div>

      <div className="p-5 sm:p-6">
        <fieldset>
          <legend className="text-[15px] font-semibold text-ink">{scenario.question}</legend>
          <div className="mt-3 space-y-2">
            {scenario.options.map((o, i) => {
              const isChosen = o.id === chosen;
              const reveal = answered && (isChosen || o.outcome === "safest");
              const ui = OUTCOME_UI[o.outcome];
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={answered}
                  aria-pressed={isChosen}
                  onClick={() => onChoose(o.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[14px] leading-relaxed transition-[border-color,background-color,box-shadow]",
                    !answered && "border-line bg-surface hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-[var(--shadow-card)]",
                    answered && !reveal && "border-line bg-surface text-ink-subtle",
                    reveal && ui.box,
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                      reveal ? cn("border-transparent", ui.text) : "border-line-strong text-ink-subtle",
                    )}
                  >
                    {reveal ? <ui.icon aria-hidden="true" className="h-5 w-5 animate-pop" /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">
                    <span className={reveal ? "text-ink" : undefined}>{o.text}</span>
                    {reveal && (
                      <span className={cn("mt-1 block text-xs font-medium", ui.text)}>
                        {isChosen ? `Your choice · ${ui.label}` : ui.label}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {choice && (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            role="status"
            className={cn("mt-4 rounded-xl border p-4 outline-none animate-fade-up", OUTCOME_UI[choice.outcome].box)}
          >
            <p className={cn("flex items-center gap-2 text-sm font-semibold", OUTCOME_UI[choice.outcome].text)}>
              {(() => {
                const Icon = OUTCOME_UI[choice.outcome].icon;
                return <Icon aria-hidden="true" className="h-4 w-4" />;
              })()}
              {OUTCOME_UI[choice.outcome].label}
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{choice.feedback}</p>
            <p className="mt-3 border-t border-black/5 pt-3 text-[13.5px] leading-relaxed text-ink-muted">
              <span className="font-medium text-ink">Why the safest choice works: </span>
              {scenario.lesson}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function Summary({ state, onRestart, onReview }: { state: QuizState; onRestart: () => void; onReview: (i: number) => void }) {
  const s = summarizeQuiz(state, SCENARIOS);
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <section className="card p-6 animate-fade-up sm:p-8" aria-labelledby="summary-title">
      <div className="flex flex-col items-center text-center">
        <div className="relative h-24 w-24">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r={R} fill="none" stroke="var(--color-sunken)" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke="#7c6cf2"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - s.percent / 100)}
              style={{ transition: "stroke-dashoffset 900ms ease-out" }}
            />
          </svg>
          <Trophy aria-hidden="true" className="absolute inset-0 m-auto h-8 w-8 text-lavender-700 animate-pop" />
        </div>
        <h2 id="summary-title" className="mt-4 text-xl font-semibold tracking-tight text-ink">
          {s.headline}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          You chose the safest option in <strong className="text-ink">{s.safestCount}</strong> of {s.total} scenarios ·{" "}
          {s.points} / {s.maxPoints} points ({s.percent}%)
        </p>
        <p className="mt-3 max-w-md text-xs leading-relaxed text-ink-subtle">
          This score only reflects your choices in this training exercise. It is not a measure of how secure you or your
          accounts are.
        </p>
      </div>

      <ul className="mx-auto mt-6 max-w-xl divide-y divide-line rounded-xl border border-line">
        {SCENARIOS.map((sc, i) => {
          const outcome = outcomeFor(sc, state.answers[sc.id]) ?? "unsafe";
          const ui = OUTCOME_UI[outcome];
          return (
            <li key={sc.id} className="flex items-center gap-3 px-4 py-3">
              <ui.icon aria-hidden="true" className={cn("h-5 w-5 shrink-0", ui.text)} />
              <span className="flex-1 text-sm text-ink">{sc.title}</span>
              <span className="sr-only">{ui.label}</span>
              {outcome !== "safest" && (
                <button type="button" onClick={() => onReview(i)} className="rounded text-xs font-medium text-brand-700 hover:text-brand-600">
                  Review
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex justify-center">
        <Button variant="primary" onClick={onRestart}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Restart training
        </Button>
      </div>
    </section>
  );
}

export function LearnView() {
  const [state, setState] = useState<QuizState>(initialQuizState);
  const total = SCENARIOS.length;
  const scenario = SCENARIOS[state.index];
  const answeredCount = Object.keys(state.answers).length;
  const summary = summarizeQuiz(state, SCENARIOS);
  const isLast = state.index === total - 1;
  const currentAnswered = Boolean(state.answers[scenario.id]);
  const topRef = useRef<HTMLDivElement>(null);

  const go = (i: number) => {
    setState((s) => goTo({ ...s, finished: false }, i, total));
    topRef.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="page-enter" ref={topRef}>
      <PageHeader
        eyebrow="Learning mode"
        title="Practise safer choices."
        subtitle="Work through fictional situations. Pick what you would do, then see why the safest option works."
        aside={
          <Badge tone="lavender" className="self-start sm:self-auto">
            <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
            Training score: {summary.points} / {total}
          </Badge>
        }
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-subtle">
            <span>{state.finished ? "Complete" : `Scenario ${state.index + 1} of ${total}`}</span>
            <span>
              {answeredCount} of {total} answered
            </span>
          </div>
          <Progress value={answeredCount} max={total} label="Scenarios answered" tone="lavender" />
          <nav aria-label="Scenarios" className="mt-3 flex flex-wrap gap-1.5">
            {SCENARIOS.map((sc, i) => {
              const outcome = outcomeFor(sc, state.answers[sc.id]);
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-current={!state.finished && i === state.index ? "step" : undefined}
                  aria-label={`Scenario ${i + 1}: ${sc.title}${outcome ? `, ${OUTCOME_UI[outcome].label}` : ", not answered"}`}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                    !state.finished && i === state.index && "ring-2 ring-brand-500 ring-offset-2 ring-offset-canvas",
                    outcome === "safest" && "bg-mint-100 text-mint-700",
                    outcome === "partial" && "bg-amber-100 text-amber-700",
                    outcome === "unsafe" && "bg-coral-100 text-coral-700",
                    !outcome && "bg-surface text-ink-muted ring-1 ring-inset ring-line hover:bg-sunken",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </nav>
        </div>

        {state.finished ? (
          <Summary state={state} onRestart={() => setState(initialQuizState())} onReview={go} />
        ) : (
          <>
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              chosen={state.answers[scenario.id]}
              onChoose={(id) => setState((s) => answerScenario(s, scenario, id))}
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button onClick={() => go(state.index - 1)} disabled={state.index === 0}>
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Previous
              </Button>
              {isLast ? (
                <Button
                  variant="primary"
                  onClick={() => setState((s) => finishQuiz(s, SCENARIOS))}
                  disabled={answeredCount < total}
                  title={answeredCount < total ? "Answer every scenario to see your summary" : undefined}
                >
                  See summary
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant={currentAnswered ? "primary" : "secondary"} onClick={() => go(state.index + 1)}>
                  {currentAnswered ? "Next scenario" : "Skip for now"}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isLast && answeredCount < total && (
              <p className="mt-2 text-right text-xs text-ink-subtle">Answer every scenario to see your summary.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
