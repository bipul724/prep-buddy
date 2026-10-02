import { LogoMark } from "@/components/Logo";
import { TOPIC_LABELS, type QuestionView } from "@/lib/client";

const DIFFICULTY_TONE: Record<string, string> = {
  EASY: "bg-accent-soft text-accent",
  MEDIUM: "bg-highlight-soft text-okay",
  HARD: "bg-weak-soft text-weak",
};

export function QuestionCard({ question, spoken, index }: { question: QuestionView; spoken: string; index: number }) {
  return (
    <section className="card rise p-5 sm:p-6" aria-labelledby="question-heading">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="eyebrow mr-1">Question {index}</span>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium">{TOPIC_LABELS[question.topic]}</span>
        <span className={`rounded-full px-2.5 py-0.5 font-medium ${DIFFICULTY_TONE[question.difficulty] ?? ""}`}>
          {question.difficulty.toLowerCase()}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <LogoMark className="mt-0.5 h-9 w-9 shrink-0" />
        <h2
          id="question-heading"
          className="rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3 font-display text-lg leading-relaxed font-medium sm:text-xl"
        >
          {spoken}
        </h2>
      </div>
      {spoken !== question.prompt && (
        <details className="mt-3 ml-12 text-sm text-muted">
          <summary className="cursor-pointer select-none hover:text-text">Original wording</summary>
          <p className="mt-1">{question.prompt}</p>
        </details>
      )}
    </section>
  );
}
