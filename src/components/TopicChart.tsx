import { TOPIC_LABELS, scoreTone } from "@/lib/client";

type Row = { topic: string; attempts: number; avgScore: number };

// One bar per topic on a fixed 0–10 scale. Weakest highlighted; untried topics shown as empty tracks.
export function TopicChart({ rows, weakest }: { rows: Row[]; weakest: string | null }) {
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const isWeak = r.topic === weakest;
        const untried = r.attempts === 0;
        const name = TOPIC_LABELS[r.topic] ?? r.topic;
        return (
          <li key={r.topic}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                {name}
                {isWeak && (
                  <span className="rounded-full bg-weak-soft px-2 py-0.5 text-[11px] font-semibold text-weak">weakest</span>
                )}
              </span>
              {untried ? (
                <span className="text-xs text-muted">not practised yet</span>
              ) : (
                <span className="text-muted tabular-nums">
                  <span className={`font-semibold ${scoreTone(r.avgScore)}`}>{r.avgScore.toFixed(1)}</span>
                  <span className="text-xs">
                    {" "}
                    · {r.attempts} {r.attempts === 1 ? "answer" : "answers"}
                  </span>
                </span>
              )}
            </div>
            <div
              className={`relative h-2.5 overflow-hidden rounded-full ${untried ? "border border-dashed border-border" : "bg-surface-2"}`}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={r.avgScore}
              aria-label={`${name} average`}
            >
              {!untried && (
                <div
                  className={`h-full rounded-full ${isWeak ? "bg-weak" : "bg-accent"}`}
                  style={{ width: `${Math.max(3, r.avgScore * 10)}%`, transition: "width 0.8s ease-out" }}
                />
              )}
              {/* tick at 7: where difficulty moves up to MEDIUM */}
              <span aria-hidden className="absolute top-0 bottom-0 left-[70%] w-px bg-bg/70" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
