// One line icon per topic, drawn on a 24px grid in currentColor.
const PATHS: Record<string, React.ReactNode> = {
  // a small tree: root with two children
  DSA: (
    <>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M10.8 6.9 7.2 16M13.2 6.9 16.8 16" />
    </>
  ),
  // a chip
  CS_FUNDAMENTALS: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="0.8" />
      <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" />
    </>
  ),
  // a database cylinder
  DBMS: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.6" />
      <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </>
  ),
  // a terminal window
  OS: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 8.5h17M7.5 12.5l2.5 2-2.5 2M12 16.5h4" />
    </>
  ),
  // a globe
  CN: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5s1.1-6.1 3.5-8.5" />
    </>
  ),
  // a cube
  OOP: (
    <>
      <path d="m12 3.5 7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z" />
      <path d="m4.5 7.7 7.5 4.3 7.5-4.3M12 12v8.5" />
    </>
  ),
  // a person
  HR: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.6-3.6 3.4-6 7-6s6.4 2.4 7 6" />
    </>
  ),
};

export function TopicIcon({ topic, className = "h-5 w-5" }: { topic: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[topic] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
