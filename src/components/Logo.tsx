// Speech bubble with a tick: "an interviewer who checks your answer".
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M9 10.5A2.5 2.5 0 0 1 11.5 8h9A2.5 2.5 0 0 1 23 10.5v7a2.5 2.5 0 0 1-2.5 2.5H15l-4 3.5V20h0a2.5 2.5 0 0 1-2-2.5z"
        fill="var(--accent-fg)"
      />
      <path d="m12.5 14 2.3 2.3 4.7-4.6" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="7" r="3" fill="var(--highlight)" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight">Prep Buddy</span>
    </span>
  );
}
