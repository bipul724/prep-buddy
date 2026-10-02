import { TopicIcon } from "@/components/TopicIcon";
import { TOPIC_LABELS, scoreStatus } from "@/lib/client";

type Row = { topic: string; attempts: number; avgScore: number };

// One meter per topic on a fixed 0–10 scale. The fill carries the status (strong / okay / needs work),
// the track is a lighter step of the same hue, and the status is also written out, so colour is never alone.
export function TopicChart({ rows, weakest }: { rows: Row[]; weakest: string | null }) {
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const isWeak = r.topic === weakest;
        const untried = r.attempts === 0;
        const name = TOPIC_LABELS[r.topic] ?? r.topic;
        const status = scoreStatus(r.avgScore);
        return (
          <li
            key={r.topic}
            title={untried ? `${name}: not practised yet` : `${name}: ${r.avgScore.toFixed(1)} average over ${r.attempts} ${r.attempts === 1 ? "answer" : "answers"}`}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span className={`flex min-w-0 items-center gap-2 font-medium ${untried ? "text-muted" : ""}`}>
                <TopicIcon topic={r.topic} className="h-4 w-4 shrink-0 text-muted" />
                <span className="truncate">{name}</span>
                {isWeak && (
                  <span className="shrink-0 rounded-full bg-weak-soft px-2 py-0.5 text-[11px] font-semibold text-weak">
                    focus next
                  </span>
                )}
              </span>
              {untried ? (
                <span className="shrink-0 text-xs text-muted">not practised yet</span>
              ) : (
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  <span className="hidden items-center gap-1.5 sm:flex">
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden />
                    {status.label}
                  </span>
                  <span>
                    <span className="text-sm font-semibold text-text tabular-nums">{r.avgScore.toFixed(1)}</span> ·{" "}
                    {r.attempts} {r.attempts === 1 ? "answer" : "answers"}
                  </span>
                </span>
              )}
            </div>
            <div
              className={`relative h-2 overflow-hidden rounded-full ${untried ? "border border-dashed border-border" : status.track}`}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={r.avgScore}
              aria-label={`${name} average`}
              aria-valuetext={untried ? "not practised yet" : `${r.avgScore.toFixed(1)} out of 10, ${status.label}`}
            >
              {!untried && (
                <div
                  className={`h-full rounded-full ${status.fill}`}
                  style={{ width: `${Math.max(3, r.avgScore * 10)}%`, transition: "width 0.8s ease-out" }}
                />
              )}
              {/* tick at 7: where difficulty moves up to MEDIUM */}
              <span aria-hidden className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-surface" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
