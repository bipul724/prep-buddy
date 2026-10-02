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
      <p role="alert" className="rounded-lg bg-weak-soft p-4 text-weak">
        {error}
      </p>
    );
  }
  if (!profile || !progress) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hi {profile.name} 👋</h1>
        <p className="mt-1 text-muted">
          Preparing for {profile.targetRole} · {progress.totalAttempts} answers practised
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Start practice</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">
            Topic
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 block rounded-lg border border-border bg-surface p-2 font-normal"
            >
              <option value="AUTO">Auto: my weakest focus topic</option>
              {TOPIC_KEYS.map((t) => (
                <option key={t} value={t}>
                  {TOPIC_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={start}
            disabled={starting}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg disabled:opacity-50"
          >
            {starting ? "Starting…" : "Start practice"}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-weak">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 font-semibold">Progress by topic</h2>
        {progress.topics.length === 0 ? (
          <p className="text-muted">No attempts yet. Start a practice session to see your strong and weak topics.</p>
        ) : (
          <TopicChart rows={progress.topics} weakest={progress.weakestTopic} />
        )}
      </section>

      {progress.recentSessions.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-semibold">Recent sessions</h2>
          <ul className="divide-y divide-border">
            {progress.recentSessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.status === "ACTIVE" ? `/session/${s.id}` : `/session/${s.id}/summary`}
                  className="flex items-center justify-between gap-2 py-2 text-sm hover:underline"
                >
                  <span>
                    {new Date(s.startedAt).toLocaleString()} · {s.topic ? TOPIC_LABELS[s.topic] : "Auto"}
                  </span>
                  <span className="text-muted">
                    {s.status === "ACTIVE"
                      ? "continue →"
                      : s.overallScore !== null
                        ? `${s.overallScore.toFixed(1)} / 10`
                        : s.status.toLowerCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm">
        <Link href="/onboarding" className="text-muted underline">
          Create a different profile
        </Link>
      </p>
    </div>
  );
}
