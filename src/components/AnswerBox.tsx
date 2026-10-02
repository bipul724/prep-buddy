"use client";

import { useState } from "react";

const MAX = 4000;

export function AnswerBox({ onSubmit, busy }: { onSubmit: (answer: string) => void; busy: boolean }) {
  const [answer, setAnswer] = useState("");
  const trimmed = answer.trim();
  const canSubmit = !busy && trimmed.length > 0 && answer.length <= MAX;
  const words = trimmed ? trimmed.split(/\s+/).length : 0;

  return (
    <form
      className="card overflow-hidden transition focus-within:border-accent"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(trimmed);
      }}
    >
      <label htmlFor="answer" className="sr-only">
        Your answer
      </label>
      <textarea
        id="answer"
        autoFocus
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) {
            e.preventDefault();
            onSubmit(trimmed);
          }
        }}
        rows={8}
        maxLength={MAX}
        disabled={busy}
        placeholder="Answer as you would in the interview. Define it, explain why it matters, give a small example."
        className="block w-full resize-y bg-transparent p-5 leading-relaxed outline-none placeholder:text-muted/70 focus-visible:outline-none disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-bg/60 px-5 py-3">
        <span className="text-xs text-muted tabular-nums">
          {words} {words === 1 ? "word" : "words"} · <kbd className="font-sans">Ctrl/⌘ + Enter</kbd> to submit
        </span>
        <button type="submit" disabled={!canSubmit} className="btn-primary">
          {busy ? "Grading…" : "Submit answer"}
        </button>
      </div>
    </form>
  );
}
