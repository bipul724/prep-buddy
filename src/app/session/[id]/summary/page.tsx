"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ClientError, scoreTone, TOPIC_LABELS, type AttemptView, type SessionView } from "@/lib/client";

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
    ...s.nextSteps.map((n, i) => `${i + 1}. ${n}`),
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
  if (!data) return <p className="text-muted">Loading…</p>;

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
    <div className="space-y-6">
      {session.status === "ABANDONED" && (
        <p className="rounded-xl border border-border bg-surface p-5">
          This session ended before any answers were graded, so there is nothing to summarise.
        </p>
      )}
      {session.status === "ACTIVE" && (
        <p className="rounded-xl border border-border bg-surface p-5">
          This session is still running. <Link href={`/session/${id}`} className="underline">Continue it</Link>.
        </p>
      )}

      {s && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-baseline gap-3">
            <span className={`text-5xl font-semibold tabular-nums ${scoreTone(s.overallScore)}`}>
              {s.overallScore.toFixed(1)}
            </span>
            <span className="text-muted">/ 10 overall</span>
          </div>
          <h1 className="text-xl font-semibold">{s.headline}</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            {s.bestTopic && (
              <span className="rounded-full bg-accent-soft px-3 py-1 text-accent">Best: {TOPIC_LABELS[s.bestTopic]}</span>
            )}
            {s.weakestTopic && (
              <span className="rounded-full bg-weak-soft px-3 py-1 text-weak">Work on: {TOPIC_LABELS[s.weakestTopic]}</span>
            )}
          </div>
          <div>
            <h2 className="mb-2 font-semibold">Your next 3 steps</h2>
            <ol className="list-decimal space-y-1 pl-5">
              {s.nextSteps.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ol>
          </div>
          <p className="text-muted italic">{s.encouragement}</p>
        </section>
      )}

      {attempts.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-semibold">Questions in this session</h2>
          <ul className="divide-y divide-border">
            {attempts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="text-muted">[{TOPIC_LABELS[a.question.topic]}]</span> {a.question.prompt}
                </span>
                <span className={`font-semibold tabular-nums ${scoreTone(a.score ?? 0)}`}>{a.score ?? "–"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/" className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg">
          Back to dashboard
        </Link>
        {s && (
          <button type="button" onClick={download} className="rounded-lg border border-border px-4 py-2">
            Download as Markdown
          </button>
        )}
      </div>
    </div>
  );
}
