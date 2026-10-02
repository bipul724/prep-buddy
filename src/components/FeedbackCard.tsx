import { scoreTone, type Feedback } from "@/lib/client";

function List({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className={`mb-1 text-sm font-semibold ${tone}`}>{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

export function FeedbackCard({ feedback }: { feedback: Feedback }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5" aria-label="Feedback">
      <div className="flex items-baseline gap-3">
        <span className={`text-4xl font-semibold tabular-nums ${scoreTone(feedback.score)}`}>{feedback.score}</span>
        <span className="text-muted">/ 10</span>
        <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-xs capitalize">{feedback.verdict}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <List title="What went well" items={feedback.strengths} tone="text-good" />
        <List title="What was missing" items={feedback.gaps} tone="text-weak" />
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">A strong answer would cover</h3>
        <p className="text-sm leading-relaxed">{feedback.idealAnswerOutline}</p>
      </div>
      {feedback.followUpQuestion && (
        <p className="rounded-lg bg-surface-2 p-3 text-sm">
          <span className="font-semibold">Likely follow-up:</span> {feedback.followUpQuestion}
        </p>
      )}
    </section>
  );
}
