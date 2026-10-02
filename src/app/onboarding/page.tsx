"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ClientError, setProfileId, TOPIC_KEYS, TOPIC_LABELS, type Profile } from "@/lib/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetRole, setTargetRole] = useState("SDE-1");
  const [focusTopics, setFocusTopics] = useState<string[]>(["DSA", "DBMS", "OS"]);
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (t: string) =>
    setFocusTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { profile } = await api<{ profile: Profile }>("/api/profiles", {
        method: "POST",
        body: JSON.stringify({ name, targetRole, focusTopics, language }),
      });
      setProfileId(profile.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof ClientError ? err.message : "Could not save your profile.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Set up your practice</h1>
        <p className="mt-1 text-muted">Tell Prep Buddy what you are preparing for. Everything stays on this laptop.</p>
      </div>
      <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Your name
            <input
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface p-2 font-normal"
            />
          </label>
          <label className="block text-sm font-medium">
            Target role
            <input
              required
              maxLength={60}
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface p-2 font-normal"
            />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Focus topics (pick at least one)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TOPIC_KEYS.map((t) => {
              const on = focusTopics.includes(t);
              return (
                <label
                  key={t}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${
                    on ? "border-accent bg-accent-soft text-accent" : "border-border"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(t)} />
                  {TOPIC_LABELS[t]}
                </label>
              );
            })}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Feedback language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block rounded-lg border border-border bg-surface p-2 font-normal"
          >
            <option value="en">English</option>
            <option value="hi">Hindi (simple)</option>
          </select>
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-weak-soft p-3 text-sm text-weak">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || focusTopics.length === 0 || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
