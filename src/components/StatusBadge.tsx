"use client";

import { useEffect, useRef, useState } from "react";

type Health = {
  ok: boolean;
  db: "up" | "down";
  ollama: { up: false } | { up: true; chat: boolean; embed: boolean };
  models?: { chat: string; embed: string };
};

function fixes(h: Health): string[] {
  const out: string[] = [];
  if (h.db === "down") out.push("docker compose up -d");
  if (!h.ollama.up) out.push("open -a Ollama");
  else {
    if (!h.ollama.chat) out.push(`ollama pull ${h.models?.chat ?? "gemma3:4b"}`);
    if (!h.ollama.embed) out.push(`ollama pull ${h.models?.embed ?? "embeddinggemma"}`);
  }
  return out;
}

// Polls /api/health and shows the fix-it command when something is down.
export function StatusBadge() {
  const [health, setHealth] = useState<Health | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = (await res.json()) as Health;
        if (alive) {
          setHealth(data);
          setUnreachable(false);
        }
      } catch {
        if (alive) setUnreachable(true);
      }
    };
    check();
    const t = setInterval(check, 10_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const ok = health?.ok && !unreachable;
  const label = unreachable ? "Server offline" : !health ? "Checking…" : ok ? "AI ready" : "Setup needed";
  const dot = !health && !unreachable ? "bg-muted" : ok ? "bg-good" : "bg-weak";
  const steps = health && !ok ? fixes(health) : [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm"
      >
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        <span role="status">{label}</span>
      </button>
      {open && health && (
        <div className="absolute right-0 z-10 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-3 text-sm shadow-lg">
          <ul className="space-y-1">
            <li>Database: {health.db === "up" ? "✅ up" : "❌ down"}</li>
            <li>Ollama: {health.ollama.up ? "✅ running" : "❌ not running"}</li>
            {health.ollama.up && (
              <>
                <li>Chat model: {health.ollama.chat ? "✅ pulled" : "❌ missing"}</li>
                <li>Embedding model: {health.ollama.embed ? "✅ pulled" : "❌ missing"}</li>
              </>
            )}
          </ul>
          {steps.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-muted">Run in a terminal:</p>
              {steps.map((s) => (
                <code key={s} className="block rounded bg-surface-2 px-2 py-1 font-mono text-xs">
                  {s}
                </code>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
