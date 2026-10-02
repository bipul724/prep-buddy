"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ClientError, setProfileId, TOPIC_KEYS, TOPIC_LABELS, type Profile } from "@/lib/client";

const input = "mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2.5 font-normal transition focus:border-accent";

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
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ClientError ? err.message : "Could not save your profile.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="rise text-center">
        <p className="eyebrow">Step 1 of 1</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Set up your practice</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Tell Prep Buddy what you&apos;re preparing for. It takes a minute and stays on this laptop.
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-7 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Your name
            <input
              required
              autoFocus
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aman"
              className={input}
            />
          </label>
          <label className="block text-sm font-medium">
            Target role
            <input
              required
              maxLength={60}
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className={input}
            />
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Focus topics</legend>
          <p className="mt-0.5 text-xs text-muted">
            Pick the ones that scare you. Auto mode rotates through these, weakest first.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOPIC_KEYS.map((t) => {
              const on = focusTopics.includes(t);
              return (
                <label
                  key={t}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${
                    on ? "border-accent bg-accent text-accent-fg" : "border-border hover:bg-surface-2"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(t)} />
                  <span aria-hidden className="w-3 text-center">
                    {on ? "✓" : "+"}
                  </span>
                  {TOPIC_LABELS[t]}
                </label>
              );
            })}
          </div>
          {focusTopics.length === 0 && <p className="mt-2 text-xs text-weak">Pick at least one topic.</p>}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Feedback language</legend>
          <div className="mt-3 inline-flex rounded-xl border border-border bg-bg p-1">
            {[
              ["en", "English"],
              ["hi", "हिन्दी (simple Hindi)"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${
                  language === value ? "bg-surface font-medium shadow-card" : "text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="language"
                  value={value}
                  className="sr-only"
                  checked={language === value}
                  onChange={() => setLanguage(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl bg-weak-soft p-3 text-sm text-weak">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-muted">No account, no email. You can create another profile later.</p>
          <button
            type="submit"
            disabled={busy || focusTopics.length === 0 || !name.trim()}
            className="btn-primary px-6 py-3"
          >
            {busy ? "Saving…" : "Save and continue →"}
          </button>
        </div>
      </form>
    </div>
  );
}
