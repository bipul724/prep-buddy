import { ScoreRing } from "@/components/ScoreRing";
import { cleanText, type Feedback } from "@/lib/client";

const VERDICT: Record<Feedback["verdict"], { label: string; tone: string }> = {
  strong: { label: "Strong answer", tone: "bg-accent-soft text-good" },
  okay: { label: "Decent, with gaps", tone: "bg-highlight-soft text-okay" },
  weak: { label: "Needs work", tone: "bg-weak-soft text-weak" },
};

function List({ title, items, tone, mark }: { title: string; items: string[]; tone: string; mark: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className={`mb-2 text-sm font-semibold ${tone}`}>{title}</h3>
      <ul className="space-y-1.5 text-sm leading-relaxed">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className={`w-4 shrink-0 text-center font-bold ${tone}`}>
              {mark}
            </span>
            <span>{cleanText(s)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeedbackCard({ feedback }: { feedback: Feedback }) {
  // Derived from the score: the model's own verdict sometimes disagrees with its score.
  const verdict = VERDICT[feedback.score >= 8 ? "strong" : feedback.score >= 5 ? "okay" : "weak"];
  return (
    <section className="card rise overflow-hidden" aria-label="Feedback">
      <div className="flex flex-wrap items-center gap-5 border-b border-border p-5 sm:p-6">
        <ScoreRing value={feedback.score} size={96} />
        <div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdict.tone}`}>{verdict.label}</span>
          <p className="mt-2 max-w-md text-sm text-muted">Graded against the key points an interviewer listens for.</p>
        </div>
      </div>
      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        <List title="What went well" items={feedback.strengths} tone="text-good" mark="✓" />
        <List title="What was missing" items={feedback.gaps} tone="text-weak" mark="!" />
      </div>
      <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="rounded-xl border border-border bg-bg p-4">
          <h3 className="eyebrow mb-2">A strong answer would cover</h3>
          <p className="text-sm leading-relaxed">{cleanText(feedback.idealAnswerOutline)}</p>
        </div>
        {feedback.followUpQuestion && (
          <p className="rounded-xl bg-highlight-soft p-4 text-sm leading-relaxed">
            <span className="font-semibold">Likely follow-up: </span>
            {cleanText(feedback.followUpQuestion)}
          </p>
        )}
      </div>
    </section>
  );
}
