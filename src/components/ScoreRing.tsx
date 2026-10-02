// Circular 0–10 gauge. The number is the label; the ring is decoration.
const tone = (v: number) => (v >= 8 ? "var(--good)" : v >= 5 ? "var(--okay)" : "var(--weak)");

export function ScoreRing({ value, size = 88, label = "out of 10" }: { value: number; size?: number; label?: string }) {
  const stroke = Math.max(6, size / 11);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(10, Math.max(0, value)) / 10;
  const shown = Number.isInteger(value) ? value : value.toFixed(1);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Score ${shown} ${label}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone(value)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: "stroke-dasharray 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-display font-semibold tabular-nums" style={{ fontSize: size * 0.32 }}>
          {shown}
        </span>
        <span className="mt-1 text-muted" style={{ fontSize: Math.max(9, size * 0.11) }}>
          / 10
        </span>
      </div>
    </div>
  );
}
