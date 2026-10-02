"use client";

import { useState } from "react";

const MAX = 4000;

export function AnswerBox({ onSubmit, busy }: { onSubmit: (answer: string) => void; busy: boolean }) {
  const [answer, setAnswer] = useState("");
  const trimmed = answer.trim();
  const canSubmit = !busy && trimmed.length > 0 && answer.length <= MAX;

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(trimmed);
      }}
    >
      <label htmlFor="answer" className="block text-sm font-medium">
        Your answer
      </label>
      <textarea
        id="answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) {
            e.preventDefault();
            onSubmit(trimmed);
          }
        }}
        rows={7}
        maxLength={MAX}
        disabled={busy}
        placeholder="Answer as you would in the interview. Short examples help."
        className="w-full resize-y rounded-lg border border-border bg-surface p-3 leading-relaxed disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted">
          {answer.length}/{MAX} · Ctrl/⌘ + Enter to submit
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Grading…" : "Submit answer"}
        </button>
      </div>
    </form>
  );
}
