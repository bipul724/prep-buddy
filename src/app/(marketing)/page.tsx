import Link from "next/link";
import { connection } from "next/server";
import { LogoMark, Logo } from "@/components/Logo";
import { ScoreRing } from "@/components/ScoreRing";
import { TopicIcon } from "@/components/TopicIcon";
import { prisma } from "@/lib/db";
import { TOPIC_KEYS, TOPIC_LABELS } from "@/lib/client";

const TOPIC_BLURBS: Record<string, string> = {
  DSA: "Arrays, hashing, trees, graphs",
  CS_FUNDAMENTALS: "Complexity, how the web works",
  DBMS: "Normalization, ACID, indexing",
  OS: "Processes, threads, deadlocks",
  CN: "TCP/UDP, DNS, the OSI layers",
  OOP: "Inheritance, polymorphism, SOLID",
  HR: "Tell me about yourself, STAR",
};

/** Real question counts from the bank. The page still renders if the DB is down. */
async function topicCounts(): Promise<Record<string, number> | null> {
  await connection();
  try {
    const rows = await prisma.question.groupBy({ by: ["topic"], _count: { _all: true } });
    return Object.fromEntries(rows.map((r) => [r.topic, r._count._all]));
  } catch {
    return null;
  }
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-good" aria-hidden>
      <path d="m5 10.5 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-muted" aria-hidden>
      <path d="m6 6 8 8m0-8-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden>
      <path d="M11 2 4.5 11H10l-1 7 6.5-9H10z" fill="currentColor" />
    </svg>
  );
}

function WifiOffIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M3 3l14 14M2.5 7.5a11 11 0 0 1 4-2.3M10 5a11 11 0 0 1 7.5 2.5M5.5 10.5a6.5 6.5 0 0 1 3-1.6M12.6 9.6a6.5 6.5 0 0 1 1.9 1.1M10 15h.01" />
    </svg>
  );
}

/** Static illustration of one feedback turn, built from the same styles as the real app. */
function HeroDemo() {
  return (
    <div className="relative lg:pl-4">
      <div aria-hidden className="glow-b absolute -inset-10 -z-10 rounded-full blur-2xl" />
      <div className="relative">
        {/* Floating proof points on the card's empty edges (hidden on phones, where they would crowd it) */}
        <div
          aria-hidden
          className="float absolute -top-4 right-6 z-10 hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium shadow-lift sm:flex"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-good-soft text-good">
            <BoltIcon />
          </span>
          Graded on your laptop
        </div>
        <div
          aria-hidden
          className="float absolute -bottom-4 left-6 z-10 hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium shadow-lift sm:flex"
          style={{ animationDelay: "-3s" }}
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-soft text-accent">
            <WifiOffIcon />
          </span>
          Wi-Fi off, still works
        </div>
        <div className="card rise overflow-hidden shadow-lift" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2 border-b border-border bg-surface-2/60 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-weak/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-highlight/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-good/70" />
            </span>
            <span className="ml-2 truncate text-xs text-muted">Practice · DBMS · question 3 of 5</span>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <LogoMark className="h-8 w-8 shrink-0" />
              <div className="rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">
                Let&apos;s talk databases. What is normalization, and why would a team bother doing it?
              </div>
            </div>
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-4 py-3 text-[15px] leading-relaxed text-accent-fg">
              It splits big tables into smaller ones so the same data isn&apos;t stored twice. That reduces redundancy.
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-4">
                <ScoreRing value={6} size={72} />
                <div className="min-w-0 space-y-1.5 text-sm">
                  <p className="flex gap-2">
                    <Check /> <span>Correct: it reduces redundancy</span>
                  </p>
                  <p className="flex gap-2 text-weak">
                    <span aria-hidden className="w-4 text-center font-bold">!</span>
                    <span>Missing: update / delete anomalies</span>
                  </p>
                  <p className="flex gap-2 text-weak">
                    <span aria-hidden className="w-4 text-center font-bold">!</span>
                    <span>Missing: 1NF → 3NF with an example</span>
                  </p>
                </div>
              </div>
              <p className="mt-3 rounded-lg bg-highlight-soft px-3 py-2 text-xs">
                <span className="font-semibold">Next up:</span> a question on normal forms, picked from your gaps.
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-muted">Example feedback from Gemma 3 4B</p>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Answer like it's the real round",
    body: "One question at a time, in a friendly interviewer's voice. Type your answer the way you would say it.",
  },
  {
    n: "02",
    title: "Get graded in seconds",
    body: "A score out of 10, what you got right, what you missed, and an outline of a strong answer.",
  },
  {
    n: "03",
    title: "Your weak spots come back",
    body: "Prep Buddy remembers low-scoring topics and finds the next question closest to your gaps.",
  },
];

const COMPARISON: { label: string; us: string; them: string }[] = [
  { label: "Cost", us: "Free, forever", them: "Pay per question or a monthly plan" },
  { label: "Internet", us: "Not needed after setup", them: "Required for every answer" },
  { label: "Privacy", us: "Answers stay on your laptop", them: "Sent to a third-party server" },
  { label: "Model", us: "Swap Gemma sizes with one setting", them: "Locked to one vendor" },
];

export default async function LandingPage() {
  const counts = await topicCounts();
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null;

  return (
    <div className="overflow-x-clip">
      <div className="relative isolate">
        {/* Backdrop: faint grid plus two soft glows */}
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden className="glow-a pointer-events-none absolute -top-48 left-[-10%] -z-10 h-[40rem] w-[40rem]" />
        <div aria-hidden className="glow-b pointer-events-none absolute top-10 right-[-15%] -z-10 h-[36rem] w-[36rem]" />

        {/* Nav */}
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <Logo />
          <nav className="flex items-center gap-1 text-sm sm:gap-4">
            <a href="#how" className="hidden rounded-lg px-2 py-1 text-muted hover:text-text sm:inline">
              How it works
            </a>
            <a href="#why" className="hidden rounded-lg px-2 py-1 text-muted hover:text-text sm:inline">
              Why local
            </a>
            <Link href="/dashboard" className="btn-primary px-4 py-2 text-sm">
              Open app
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden />
              Runs on your laptop · Wi-Fi optional
            </p>
            <h1 className="font-display text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Your 11 PM mock interviewer.{" "}
              <span className="relative whitespace-nowrap text-accent">
                No Wi-Fi needed.
                <svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 9c60-6 140-8 296-4" fill="none" stroke="var(--highlight)" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Prep Buddy asks campus-placement questions, grades your answers in seconds and keeps steering you
              toward your weakest topics. It runs on Google&apos;s open Gemma model on your own machine, so
              there&apos;s no account, no API key and no bill.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary px-6 py-3 text-base">
                Start practising <ArrowRight />
              </Link>
              <a href="#how" className="btn-secondary px-6 py-3 text-base">
                See how it works
              </a>
            </div>
            <ul className="mt-8 flex max-w-xl flex-wrap gap-2 text-sm">
              {["₹0 to run", "No sign-up", "Works offline", "Answers stay private"].map((t) => (
                <li key={t} className="flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1 backdrop-blur">
                  <Check /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroDemo />
        </section>
      </div>

      {/* Topics */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The question bank</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {total ? `${total} questions across 7 topics` : "7 topics placement rounds actually ask"}
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted">
              Written by hand, not generated, so the model grades against real key points instead of inventing
              facts.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOPIC_KEYS.map((t) => (
              <li key={t} className="lift group rounded-2xl border border-border bg-bg p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-accent-fg">
                    <TopicIcon topic={t} />
                  </span>
                  {counts?.[t] ? (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{counts[t]} questions</span>
                  ) : null}
                </div>
                <h3 className="mt-4 font-semibold">{TOPIC_LABELS[t]}</h3>
                <p className="mt-1 text-sm text-muted">{TOPIC_BLURBS[t]}</p>
              </li>
            ))}
            <li className="flex flex-col justify-center gap-2 rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-border text-xl" aria-hidden>
                +
              </span>
              Add your own questions. They get embedded and join the rotation.
            </li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Practise, get honest feedback, repeat where it hurts.
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="lift card relative p-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-highlight-soft font-display text-2xl font-semibold text-okay">
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-muted">
          End a session any time for a summary with your best topic, your weakest topic and{" "}
          <span className="font-medium text-text">three small next steps</span>.
        </p>
      </section>

      {/* Why local */}
      <section id="why" className="mx-auto max-w-6xl scroll-mt-8 px-4">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-band px-6 py-14 text-band-fg sm:px-12 sm:py-16">
          <div aria-hidden className="glow-b absolute -top-32 -right-24 -z-10 h-96 w-96" />
          <div aria-hidden className="absolute -bottom-40 -left-24 -z-10 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase opacity-70">Why open-source AI</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Hostel Wi-Fi is down? Practice isn&apos;t.
              </h2>
              <p className="mt-4 leading-relaxed opacity-80">
                Gemma runs through Ollama on your own laptop. After a one-time model download, every question,
                answer and score stays on your machine.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2 text-sm">
                {["Gemma 3 4B", "EmbeddingGemma", "Ollama", "pgvector"].map((t) => (
                  <li key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-2xl bg-surface text-text shadow-lift">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60">
                    <th scope="col" className="p-4 font-medium text-muted">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th scope="col" className="p-4 font-semibold">Prep Buddy</th>
                    <th scope="col" className="p-4 font-medium text-muted">Typical cloud AI</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <th scope="row" className="p-4 font-medium">{row.label}</th>
                      <td className="p-4">
                        <span className="flex items-start gap-2">
                          <Check /> {row.us}
                        </span>
                      </td>
                      <td className="p-4 text-muted">
                        <span className="flex items-start gap-2">
                          <Cross /> {row.them}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-surface px-6 py-16 text-center shadow-card">
          <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
          <div aria-hidden className="glow-a absolute -top-40 left-1/2 -z-10 h-96 w-[40rem] -translate-x-1/2" />
          <LogoMark className="mx-auto h-12 w-12" />
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Five questions tonight beats fifty next week.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            Set up your profile in under a minute and get your first piece of feedback.
          </p>
          <Link href="/dashboard" className="btn-primary mt-8 px-7 py-3 text-base shadow-lift">
            Start practising <ArrowRight />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted">
          <span>Prep Buddy · MIT licensed · built for the DEV Hacktoberfest Weekend Challenge</span>
          <span>
            Gemma is provided under the{" "}
            <a href="https://ai.google.dev/gemma/terms" className="underline hover:text-text">
              Gemma Terms of Use
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
