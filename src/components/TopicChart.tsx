import { TOPIC_LABELS, scoreTone } from "@/lib/client";

type Row = { topic: string; attempts: number; avgScore: number };

// Horizontal bars, one per topic, weakest highlighted. Score scale is fixed 0–10.
export function TopicChart({ rows, weakest }: { rows: Row[]; weakest: string | null }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const isWeak = r.topic === weakest;
        return (
          <li key={r.topic} className={`rounded-lg p-2 ${isWeak ? "bg-weak-soft" : ""}`}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">
                {TOPIC_LABELS[r.topic] ?? r.topic}
                {isWeak && <span className="ml-2 text-xs text-weak">weakest</span>}
              </span>
              <span className="text-muted tabular-nums">
                <span className={`font-semibold ${scoreTone(r.avgScore)}`}>{r.avgScore.toFixed(1)}</span> / 10 ·{" "}
                {r.attempts} {r.attempts === 1 ? "answer" : "answers"}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-2"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={r.avgScore}
              aria-label={`${TOPIC_LABELS[r.topic] ?? r.topic} average`}
            >
              <div
                className={`h-full rounded-full ${isWeak ? "bg-weak" : "bg-accent"}`}
                style={{ width: `${Math.max(2, r.avgScore * 10)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
