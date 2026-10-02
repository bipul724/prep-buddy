"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopicChart } from "@/components/TopicChart";
import { TopicIcon } from "@/components/TopicIcon";
import {
  api,
  ClientError,
  getProfileId,
  scoreStatus,
  setProfileId,
  TOPIC_KEYS,
  TOPIC_LABELS,
  type Profile,
} from "@/lib/client";

type Progress = {
  topics: { topic: string; attempts: number; avgScore: number }[];
  weakestTopic: string | null;
  totalAttempts: number;
  recentSessions: { id: string; topic: string | null; status: string; startedAt: string; overallScore: number | null }[];
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function Sparkle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.5c.4 4.6 2.4 6.6 7 7-4.6.4-6.6 2.4-7 7-.4-4.6-2.4-6.6-7-7 4.6-.4 6.6-2.4 7-7ZM19 15c.2 2 1 2.8 3 3-2 .2-2.8 1-3 3-.2-2-1-2.8-3-3 2-.2 2.8-1 3-3Z" />
    </svg>
  );
}

/** Session scores over time, oldest first. History in a quiet line, the latest point in the accent. */
function Sparkline({ points }: { points: { score: number; label: string }[] }) {
  const w = 160;
  const h = 44;
  const pad = 5;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (points.length - 1);
  const y = (v: number) => h - pad - (v / 10) * (h - 2 * pad);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const last = points.length - 1;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-40" role="img" aria-label="Score trend across your recent sessions">
      <path d={d} fill="none" stroke="var(--muted)" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          {/* invisible larger hit target so the native tooltip is easy to reach */}
          <circle cx={x(i)} cy={y(p.score)} r="9" fill="transparent">
            <title>{`${p.label}: ${p.score.toFixed(1)} / 10`}</title>
          </circle>
          <circle
            cx={x(i)}
            cy={y(p.score)}
            r={i === last ? 4.5 : 3}
            fill={i === last ? "var(--accent)" : "var(--surface)"}
            stroke={i === last ? "var(--surface)" : "var(--muted)"}
            strokeWidth="2"
            pointerEvents="none"
          />
        </g>
      ))}
    </svg>
  );
}

function StatTile({ icon, label, value, children }: { icon: React.ReactNode; label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="card lift flex items-start gap-4 p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-0.5 text-3xl font-semibold tracking-tight">{value}</p>
        {children}
      </div>
    </div>
  );
}

const STATUS_PILL: Record<string, string> = {
  ACTIVE: "bg-highlight-soft text-okay",
  COMPLETED: "bg-accent-soft text-accent",
  ABANDONED: "bg-surface-2 text-muted",
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [topic, setTopic] = useState("AUTO");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let id = getProfileId();
        if (id) {
          await api(`/api/profiles/${id}`).catch(() => (id = null));
        }
        if (!id) {
          const { profiles } = await api<{ profiles: Profile[] }>("/api/profiles");
          if (profiles.length === 0) return router.replace("/onboarding");
          id = profiles[0].id;
          setProfileId(id);
        }
        const [{ profile }, prog] = await Promise.all([
          api<{ profile: Profile }>(`/api/profiles/${id}`),
          api<Progress>(`/api/profiles/${id}/progress`),
        ]);
        setProfile(profile);
        setProgress(prog);
      } catch (err) {
        setError(err instanceof ClientError ? err.message : "Could not load your progress.");
      }
    })();
  }, [router]);

  async function start() {
    if (!profile) return;
    setStarting(true);
    setError(null);
    try {
      const { session } = await api<{ session: { id: string } }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ profileId: profile.id, ...(topic === "AUTO" ? {} : { topic }) }),
      });
      router.push(`/session/${session.id}`);
    } catch (err) {
      setError(err instanceof ClientError ? err.message : "Could not start a session.");
      setStarting(false);
    }
  }

  if (error && !profile) {
    return (
      <p role="alert" className="rounded-xl bg-weak-soft p-4 text-weak">
        {error}
      </p>
    );
  }
  if (!profile || !progress) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading your dashboard">
        <div className="h-52 animate-pulse rounded-3xl bg-surface-2" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  // Every topic is listed: practised first (as the API orders them), then focus topics, then the rest.
  const statByTopic = new Map(progress.topics.map((t) => [t.topic, t]));
  const untried = [...profile.focusTopics, ...TOPIC_KEYS.filter((t) => !profile.focusTopics.includes(t))]
    .filter((t) => !statByTopic.has(t))
    .map((t) => ({ topic: t, attempts: 0, avgScore: 0 }));
  const chartRows = [...progress.topics, ...untried];

  const overall = progress.totalAttempts
    ? progress.topics.reduce((s, t) => s + t.avgScore * t.attempts, 0) / progress.totalAttempts
    : null;
  const scored = progress.recentSessions
    .filter((s) => s.status === "COMPLETED" && s.overallScore !== null)
    .map((s) => ({ score: s.overallScore as number, label: shortDate(s.startedAt) }))
    .reverse(); // oldest first
  const delta = scored.length >= 2 ? scored[scored.length - 1].score - scored[scored.length - 2].score : null;
  const autoTarget = profile.focusTopics.find((t) => !statByTopic.has(t)) ?? progress.weakestTopic;
  const weakestStat = progress.weakestTopic ? statByTopic.get(progress.weakestTopic) : undefined;
  const chips = ["AUTO", ...profile.focusTopics, ...TOPIC_KEYS.filter((t) => !profile.focusTopics.includes(t))];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rise relative isolate overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div aria-hidden className="glow-a absolute -top-32 -left-24 -z-10 h-80 w-[32rem]" />
        <div aria-hidden className="glow-b absolute -right-24 -bottom-40 -z-10 h-96 w-96" />
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="min-w-0 max-w-md">
            <p className="eyebrow">{greeting()}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Hi {profile.name} 👋</h1>
            <p className="mt-2 text-muted">
              Preparing for <span className="font-medium text-text">{profile.targetRole}</span>.{" "}
              {progress.weakestTopic
                ? `${TOPIC_LABELS[progress.weakestTopic]} is your lowest topic right now, so that's the best place to spend ten minutes.`
                : "Answer a few questions and your strong and weak topics will show up here."}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href="#start" className="btn-primary">
                Practise now <span aria-hidden>→</span>
              </a>
              <Link href="/onboarding" className="text-sm text-muted underline-offset-4 hover:text-text hover:underline">
                New profile
              </Link>
            </div>
          </div>

          {/* Hero figure: the one number this page leads with */}
          <div className="w-full rounded-2xl border border-border bg-bg/70 p-5 backdrop-blur sm:w-auto sm:min-w-64">
            <p className="text-sm text-muted">Average score</p>
            {overall === null ? (
              <p className="mt-1 text-5xl font-semibold tracking-tight text-muted">–</p>
            ) : (
              <>
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-6xl font-semibold tracking-tight">{overall.toFixed(1)}</span>
                  <span className="text-muted">/ 10</span>
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${scoreStatus(overall).dot}`} aria-hidden />
                    {scoreStatus(overall).label}
                  </span>
                  {delta !== null && delta !== 0 && (
                    <span className={delta > 0 ? "text-good" : "text-weak"}>
                      {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}{" "}
                      <span className="text-muted">vs previous session</span>
                    </span>
                  )}
                </p>
              </>
            )}
            {scored.length >= 2 ? (
              <div className="mt-3">
                <Sparkline points={scored} />
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">Finish two sessions to see your trend.</p>
            )}
          </div>
        </div>
      </section>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Answers graded"
          value={String(progress.totalAttempts)}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5Z" />
              <path d="m9 11 2 2 4-4" />
            </svg>
          }
        >
          <p className="mt-1 text-xs text-muted">each one scored out of 10</p>
        </StatTile>
        <StatTile
          label="Topics covered"
          value={`${progress.topics.length} of 7`}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
              <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
              <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
              <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
            </svg>
          }
        >
          {/* meter: one segment per topic, the unfilled ones a lighter step of the same hue */}
          <div className="mt-2 flex gap-1" aria-hidden>
            {TOPIC_KEYS.map((t, i) => (
              <span key={t} className={`h-1.5 flex-1 rounded-full ${i < progress.topics.length ? "bg-accent" : "bg-accent-soft"}`} />
            ))}
          </div>
        </StatTile>
        <StatTile
          label="Sessions finished"
          value={String(progress.recentSessions.filter((s) => s.status === "COMPLETED").length)}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 4h8M9 4v3.5a3 3 0 0 0 6 0V4M6 4h12M12 10.5V14M8.5 20h7M12 14c-2.5 0-4 1.5-4 3.5V20h8v-2.5c0-2-1.5-3.5-4-3.5Z" />
            </svg>
          }
        >
          <p className="mt-1 text-xs text-muted">
            {progress.recentSessions[0] ? `last one ${shortDate(progress.recentSessions[0].startedAt)}` : "none yet"}
          </p>
        </StatTile>
      </div>

      {/* Start a session */}
      <section id="start" className="card scroll-mt-24 overflow-hidden" aria-labelledby="start-heading">
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="start-heading" className="font-display text-2xl font-semibold">
                Start a practice session
              </h2>
              <p className="mt-1 text-sm text-muted">Pick a topic, or let Prep Buddy aim at your weak spots.</p>
            </div>
            {progress.weakestTopic && weakestStat && (
              <p className="flex items-center gap-2 rounded-full bg-weak-soft px-3 py-1.5 text-sm text-weak">
                <TopicIcon topic={progress.weakestTopic} className="h-4 w-4" />
                Suggested: {TOPIC_LABELS[progress.weakestTopic]} · {weakestStat.avgScore.toFixed(1)} avg
              </p>
            )}
          </div>

          <fieldset className="mt-5">
            <legend className="sr-only">Topic</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {chips.map((t) => {
                const on = topic === t;
                const stat = statByTopic.get(t);
                const isFocus = profile.focusTopics.includes(t);
                return (
                  <label
                    key={t}
                    className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${
                      on
                        ? "border-accent bg-accent text-accent-fg shadow-lift"
                        : "border-border bg-bg hover:-translate-y-0.5 hover:border-accent/40"
                    }`}
                  >
                    <input type="radio" name="topic" value={t} className="sr-only" checked={on} onChange={() => setTopic(t)} />
                    <span
                      className={`hidden h-9 w-9 shrink-0 place-items-center rounded-lg sm:grid ${
                        on ? "bg-accent-fg/15" : t === "AUTO" ? "bg-highlight-soft text-okay" : "bg-accent-soft text-accent"
                      }`}
                    >
                      {t === "AUTO" ? <Sparkle className="h-4.5 w-4.5" /> : <TopicIcon topic={t} className="h-4.5 w-4.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block leading-snug font-medium">{t === "AUTO" ? "Auto" : TOPIC_LABELS[t]}</span>
                      <span className={`block truncate text-xs ${on ? "opacity-80" : "text-muted"}`}>
                        {t === "AUTO"
                          ? "follows your gaps"
                          : stat
                            ? `${stat.avgScore.toFixed(1)} avg${isFocus ? " · focus" : ""}`
                            : isFocus
                              ? "focus · new"
                              : "not tried"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-surface-2/50 px-6 py-4">
          <p className="text-sm text-muted">
            {topic === "AUTO"
              ? autoTarget
                ? `Auto will start with ${TOPIC_LABELS[autoTarget]} and keep following your weakest focus topic.`
                : "Auto follows your weakest focus topic."
              : `Every question will be from ${TOPIC_LABELS[topic]}.`}
          </p>
          <button type="button" onClick={start} disabled={starting} className="btn-primary w-full px-6 py-3 text-base shadow-lift sm:w-auto">
            {starting ? "Starting…" : "Start practice →"}
          </button>
        </div>
        {error && (
          <p role="alert" className="border-t border-border bg-weak-soft px-6 py-3 text-sm text-weak">
            {error}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-6" aria-labelledby="progress-heading">
          <div className="mb-5 flex items-baseline justify-between gap-2">
            <h2 id="progress-heading" className="font-display text-xl font-semibold">
              Progress by topic
            </h2>
            <span className="text-xs text-muted">average score / 10</span>
          </div>
          <TopicChart rows={chartRows} weakest={progress.weakestTopic} />
        </section>

        <section className="card p-6" aria-labelledby="recent-heading">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 id="recent-heading" className="font-display text-xl font-semibold">
              Recent sessions
            </h2>
          </div>
          {progress.recentSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
              Your sessions will be listed here.
            </div>
          ) : (
            <ul className="-mx-2 space-y-1">
              {progress.recentSessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={s.status === "ACTIVE" ? `/session/${s.id}` : `/session/${s.id}/summary`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-2"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                      {s.topic ? <TopicIcon topic={s.topic} className="h-4.5 w-4.5" /> : <Sparkle className="h-4.5 w-4.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{s.topic ? TOPIC_LABELS[s.topic] : "Auto"}</span>
                      <span className="block text-xs text-muted">{shortDate(s.startedAt)}</span>
                    </span>
                    {s.status === "COMPLETED" && s.overallScore !== null ? (
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${scoreStatus(s.overallScore).dot}`} aria-hidden />
                        <span className="text-lg font-semibold">{s.overallScore.toFixed(1)}</span>
                        <span className="sr-only">{scoreStatus(s.overallScore).label}</span>
                      </span>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_PILL[s.status]}`}>
                        {s.status === "ACTIVE" ? "Continue →" : s.status.toLowerCase()}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
