"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopicChart } from "@/components/TopicChart";
import { api, ClientError, getProfileId, setProfileId, TOPIC_KEYS, TOPIC_LABELS, type Profile } from "@/lib/client";

type Progress = {
  topics: { topic: string; attempts: number; avgScore: number }[];
  weakestTopic: string | null;
  totalAttempts: number;
  recentSessions: { id: string; topic: string | null; status: string; startedAt: string; overallScore: number | null }[];
};

function Stat({ label, value, hint, tone = "", small = false }: { label: string; value: string; hint?: string; tone?: string; small?: boolean }) {
  return (
    <div className="card p-4">
      <p className="eyebrow">{label}</p>
      <p className={`mt-2 font-display font-semibold tabular-nums ${small ? "text-xl leading-9 sm:text-2xl" : "text-3xl"} ${tone}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
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
      <div className="space-y-4" aria-busy="true" aria-label="Loading your dashboard">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-surface-2" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  // Show every focus topic, plus any other topic that has been practised.
  const statByTopic = new Map(progress.topics.map((t) => [t.topic, t]));
  const chartRows = [
    ...progress.topics,
    ...profile.focusTopics.filter((t) => !statByTopic.has(t)).map((t) => ({ topic: t, attempts: 0, avgScore: 0 })),
  ];
  const overall = progress.totalAttempts
    ? progress.topics.reduce((s, t) => s + t.avgScore * t.attempts, 0) / progress.totalAttempts
    : null;
  const completed = progress.recentSessions.filter((s) => s.status === "COMPLETED").length;
  const autoTarget = profile.focusTopics.find((t) => !statByTopic.has(t)) ?? progress.weakestTopic;
  const chips = ["AUTO", ...profile.focusTopics, ...TOPIC_KEYS.filter((t) => !profile.focusTopics.includes(t))];

  return (
    <div className="space-y-8">
      <div className="rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Hi {profile.name} 👋</h1>
          <p className="mt-1 text-muted">Preparing for {profile.targetRole}</p>
        </div>
        <Link href="/onboarding" className="text-sm text-muted underline-offset-4 hover:text-text hover:underline">
          New profile
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Answers" value={String(progress.totalAttempts)} hint="graded so far" />
        <Stat
          label="Average"
          value={overall === null ? "–" : overall.toFixed(1)}
          hint="out of 10"
          tone={overall === null ? "" : overall >= 8 ? "text-good" : overall >= 5 ? "text-okay" : "text-weak"}
        />
        <Stat label="Topics" value={`${progress.topics.length}/7`} hint="practised" />
        <Stat
          label="Focus next"
          value={progress.weakestTopic ? TOPIC_LABELS[progress.weakestTopic] : "–"}
          hint={progress.weakestTopic ? "your weakest topic" : "answer a few first"}
          tone={progress.weakestTopic ? "text-weak" : ""}
          small={!!progress.weakestTopic}
        />
      </div>

      <section className="card overflow-hidden" aria-labelledby="start-heading">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 id="start-heading" className="font-display text-2xl font-semibold">
              Start a practice session
            </h2>
            <p className="mt-1 text-sm text-muted">Pick a topic, or let Prep Buddy aim at your weak spots.</p>
            <fieldset className="mt-4">
              <legend className="sr-only">Topic</legend>
              <div className="flex flex-wrap gap-2">
                {chips.map((t) => {
                  const on = topic === t;
                  const isFocus = profile.focusTopics.includes(t);
                  return (
                    <label
                      key={t}
                      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${
                        on
                          ? "border-accent bg-accent text-accent-fg"
                          : isFocus || t === "AUTO"
                            ? "border-border bg-surface hover:bg-surface-2"
                            : "border-transparent text-muted hover:bg-surface-2"
                      }`}
                    >
                      <input
                        type="radio"
                        name="topic"
                        value={t}
                        className="sr-only"
                        checked={on}
                        onChange={() => setTopic(t)}
                      />
                      {t === "AUTO" ? "✨ Auto" : TOPIC_LABELS[t]}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p className="mt-3 text-xs text-muted">
              {topic === "AUTO"
                ? autoTarget
                  ? `Auto will start with ${TOPIC_LABELS[autoTarget]} and keep following your weakest focus topic.`
                  : "Auto follows your weakest focus topic."
                : `Every question will be from ${TOPIC_LABELS[topic]}.`}
            </p>
          </div>
          <button type="button" onClick={start} disabled={starting} className="btn-primary px-6 py-3 text-base">
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
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 id="progress-heading" className="font-display text-xl font-semibold">
              Progress by topic
            </h2>
            <span className="text-xs text-muted">average score / 10</span>
          </div>
          {chartRows.length === 0 ? (
            <p className="text-muted">No attempts yet. Your strong and weak topics will show up here.</p>
          ) : (
            <TopicChart rows={chartRows} weakest={progress.weakestTopic} />
          )}
        </section>

        <section className="card p-6" aria-labelledby="recent-heading">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 id="recent-heading" className="font-display text-xl font-semibold">
              Recent sessions
            </h2>
            {completed > 0 && <span className="text-xs text-muted">{completed} completed</span>}
          </div>
          {progress.recentSessions.length === 0 ? (
            <p className="text-sm text-muted">Your sessions will be listed here.</p>
          ) : (
            <ul className="-mx-2 space-y-1">
              {progress.recentSessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={s.status === "ACTIVE" ? `/session/${s.id}` : `/session/${s.id}/summary`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {s.topic ? TOPIC_LABELS[s.topic] : "Auto"}
                      </span>
                      <span className="block text-xs text-muted">
                        {new Date(s.startedAt).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    {s.status === "COMPLETED" && s.overallScore !== null ? (
                      <span className="font-display text-lg font-semibold tabular-nums">{s.overallScore.toFixed(1)}</span>
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
