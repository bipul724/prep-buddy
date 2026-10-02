import { TOPIC_LABELS, type QuestionView } from "@/lib/client";

export function QuestionCard({ question, spoken, index }: { question: QuestionView; spoken: string; index: number }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5" aria-labelledby="question-heading">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Question {index}</span>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">{TOPIC_LABELS[question.topic]}</span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5">{question.difficulty.toLowerCase()}</span>
      </div>
      <h2 id="question-heading" className="text-lg leading-relaxed font-medium">
        {spoken}
      </h2>
      {spoken !== question.prompt && (
        <details className="mt-3 text-sm text-muted">
          <summary className="cursor-pointer">Original wording</summary>
          <p className="mt-1">{question.prompt}</p>
        </details>
      )}
    </section>
  );
}
