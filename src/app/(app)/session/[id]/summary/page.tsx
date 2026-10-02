"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ScoreRing } from "@/components/ScoreRing";
import { api, cleanText, ClientError, scoreTone, TOPIC_LABELS, type AttemptView, type SessionView } from "@/lib/client";

function toMarkdown(session: SessionView, attempts: AttemptView[]): string {
  const s = session.summary!;
  return [
    `# Prep Buddy session (${new Date(session.startedAt).toLocaleDateString()})`,
    "",
    `**Overall score:** ${s.overallScore.toFixed(1)} / 10`,
    "",
    s.headline,
    "",
    "## Next steps",
    ...s.nextSteps.map((n, i) => `${i + 1}. ${cleanText(n)}`),
    "",
    "## Questions",
    ...attempts.map(
      (a) =>
        `- [${TOPIC_LABELS[a.question.topic]}] ${a.question.prompt} → **${a.score ?? "-"}/10**` +
        (a.feedback?.gaps.length ? `\n  - Missing: ${a.feedback.gaps.join("; ")}` : ""),
    ),
    "",
    `_${s.encouragement}_`,
  ].join("\n");
}

export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ session: SessionView; attempts: AttemptView[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ session: SessionView; attempts: AttemptView[] }>(`/api/sessions/${id}`)
      .then(setData)
      .catch((err) => setError(err instanceof ClientError ? err.message : "Could not load the summary."));
  }, [id]);

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-weak-soft p-4 text-weak">
        {error}
      </p>
    );
  }
  if (!data) {
    return <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-2xl bg-surface-2" aria-busy="true" />;
  }

  const { session, attempts } = data;
  const s = session.summary;

  function download() {
    const blob = new Blob([toMarkdown(session, attempts)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prep-buddy-session-${session.startedAt.slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {session.status === "ABANDONED" && (
        <div className="card p-8 text-center">
          <p className="font-display text-2xl font-semibold">Nothing to summarise yet</p>
          <p className="mt-2 text-muted">This session ended before any answers were graded.</p>
        </div>
      )}
      {session.status === "ACTIVE" && (
        <div className="card p-8 text-center">
          <p className="font-display text-2xl font-semibold">This session is still running</p>
          <Link href={`/session/${id}`} className="btn-primary mt-4">
            Continue it →
          </Link>
        </div>
      )}

      {s && (
        <section className="card rise overflow-hidden">
          <div className="flex flex-col items-center gap-6 border-b border-border bg-accent-soft/50 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
            <ScoreRing value={s.overallScore} size={128} label="overall" />
            <div>
              <p className="eyebrow">Session summary</p>
              <h1 className="mt-2 font-display text-2xl leading-snug font-semibold text-balance sm:text-3xl">
                {cleanText(s.headline)}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {attempts.length} {attempts.length === 1 ? "question" : "questions"} ·{" "}
                {new Date(session.startedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>

          {s.bestTopic && s.bestTopic === s.weakestTopic && (
            <div className="border-b border-border p-5">
              <p className="eyebrow">Topic practised</p>
              <p className="mt-1 font-display text-xl font-semibold">{TOPIC_LABELS[s.bestTopic]}</p>
            </div>
          )}
          {(s.bestTopic || s.weakestTopic) && s.bestTopic !== s.weakestTopic && (
            <div className="grid border-b border-border sm:grid-cols-2">
              {s.bestTopic && (
                <div className="p-5 sm:border-r sm:border-border">
                  <p className="eyebrow">Strongest</p>
                  <p className="mt-1 font-display text-xl font-semibold text-good">{TOPIC_LABELS[s.bestTopic]}</p>
                </div>
              )}
              {s.weakestTopic && (
                <div className="p-5">
                  <p className="eyebrow">Work on next</p>
                  <p className="mt-1 font-display text-xl font-semibold text-weak">{TOPIC_LABELS[s.weakestTopic]}</p>
                </div>
              )}
            </div>
          )}

          <div className="p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold">Your next 3 steps</h2>
            <ol className="mt-4 space-y-3">
              {s.nextSteps.map((n, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-highlight-soft font-display font-semibold text-okay">
                    {i + 1}
                  </span>
                  <span className="pt-1 leading-relaxed">{cleanText(n)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-xl bg-bg p-4 font-display text-lg italic">“{cleanText(s.encouragement)}”</p>
          </div>
        </section>
      )}

      {attempts.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 font-display text-xl font-semibold">Question by question</h2>
          <ul className="divide-y divide-border">
            {attempts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 text-sm">
                  <p className="text-xs text-muted">{TOPIC_LABELS[a.question.topic]}</p>
                  <p className="mt-0.5 leading-relaxed">{a.question.prompt}</p>
                  {a.feedback && a.feedback.gaps.length > 0 && (
                    <p className="mt-1 text-xs text-weak">Missing: {a.feedback.gaps.join(" · ")}</p>
                  )}
                </div>
                <span className={`font-display text-2xl font-semibold tabular-nums ${scoreTone(a.score ?? 0)}`}>
                  {a.score ?? "–"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className="btn-primary px-6 py-3">
          Back to dashboard
        </Link>
        {s && (
          <button type="button" onClick={download} className="btn-secondary px-6 py-3">
            Download as Markdown
          </button>
        )}
      </div>
    </div>
  );
}
