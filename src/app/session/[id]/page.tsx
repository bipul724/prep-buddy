"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerBox } from "@/components/AnswerBox";
import { FeedbackCard } from "@/components/FeedbackCard";
import { QuestionCard } from "@/components/QuestionCard";
import { api, ClientError, type AttemptView, type Feedback, type QuestionView, type SessionView } from "@/lib/client";
import { useElapsed } from "@/lib/useElapsed";

type Phase = "loading" | "asking" | "answering" | "grading" | "feedback" | "ending" | "exhausted" | "error";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [current, setCurrent] = useState<{ question: QuestionView; spoken: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answered, setAnswered] = useState(0);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const started = useRef(false);
  const waiting = phase === "asking" || phase === "grading" || phase === "ending";
  const elapsed = useElapsed(waiting);

  const fail = (err: unknown, retry: () => void) => {
    setError({ message: err instanceof ClientError ? err.message : "Something went wrong.", retry });
    setPhase("error");
  };

  const nextQuestion = useCallback(async () => {
    setPhase("asking");
    setError(null);
    setFeedback(null);
    try {
      const next = await api<{ question: QuestionView; spoken: string }>(`/api/sessions/${id}/questions/next`, {
        method: "POST",
      });
      setCurrent(next);
      setPhase("answering");
    } catch (err) {
      if (err instanceof ClientError && err.code === "BANK_EXHAUSTED") return setPhase("exhausted");
      if (err instanceof ClientError && err.code === "SESSION_NOT_ACTIVE") return router.replace(`/session/${id}/summary`);
      fail(err, nextQuestion);
    }
  }, [id, router]);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev; never ask two questions.
    started.current = true;
    (async () => {
      try {
        const data = await api<{ session: SessionView; attempts: AttemptView[]; currentQuestion: QuestionView | null }>(
          `/api/sessions/${id}`,
        );
        if (data.session.status !== "ACTIVE") return router.replace(`/session/${id}/summary`);
        setAnswered(data.attempts.length);
        if (data.currentQuestion) {
          setCurrent({ question: data.currentQuestion, spoken: data.currentQuestion.prompt });
          setPhase("answering");
        } else {
          await nextQuestion();
        }
      } catch (err) {
        fail(err, () => window.location.reload());
      }
    })();
  }, [id, nextQuestion, router]);

  async function submit(answer: string) {
    if (!current || phase === "grading") return;
    setPhase("grading");
    setError(null);
    // One key per click: a double-click or a network retry can never grade twice.
    const key = crypto.randomUUID();
    const send = async () => {
      setPhase("grading");
      try {
        const res = await api<{ feedback: Feedback; replayed: boolean }>(`/api/sessions/${id}/attempts`, {
          method: "POST",
          headers: { "Idempotency-Key": key },
          body: JSON.stringify({ questionId: current.question.id, answer }),
        });
        setFeedback(res.feedback);
        if (!res.replayed) setAnswered((n) => n + 1);
        setPhase("feedback");
      } catch (err) {
        fail(err, send);
      }
    };
    await send();
  }

  async function end() {
    setPhase("ending");
    setError(null);
    try {
      await api(`/api/sessions/${id}/complete`, { method: "POST" });
      router.push(`/session/${id}/summary`);
    } catch (err) {
      if (err instanceof ClientError && err.code === "SESSION_NOT_ACTIVE") return router.push(`/session/${id}/summary`);
      fail(err, end);
    }
  }

  const waitText =
    phase === "asking" ? "Picking your next question" : phase === "grading" ? "Gemma is grading your answer" : "Writing your session summary";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {answered} {answered === 1 ? "answer" : "answers"} this session
        </p>
        <button
          type="button"
          onClick={end}
          disabled={waiting}
          className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          End session
        </button>
      </div>

      {current && phase !== "asking" && <QuestionCard question={current.question} spoken={current.spoken} index={answered + (phase === "feedback" ? 0 : 1)} />}

      <div aria-live="polite" className="space-y-5">
        {waiting && (
          <p className="flex items-center gap-2 rounded-lg bg-surface-2 p-4 text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
            {waitText}… {elapsed}s
            {elapsed >= 10 && <span className="text-muted"> (the first call loads the model, which is slower)</span>}
          </p>
        )}
        {phase === "error" && error && (
          <div role="alert" className="space-y-2 rounded-lg bg-weak-soft p-4 text-sm text-weak">
            <p>{error.message}</p>
            <button type="button" onClick={error.retry} className="rounded-lg border border-weak px-3 py-1">
              Try again
            </button>
          </div>
        )}
        {phase === "exhausted" && (
          <p className="rounded-lg bg-surface-2 p-4 text-sm">
            You have answered every question in this topic. End the session to see your summary.
          </p>
        )}
        {phase === "feedback" && feedback && <FeedbackCard feedback={feedback} />}
      </div>

      {(phase === "answering" || phase === "grading") && current && (
        <AnswerBox key={current.question.id} onSubmit={submit} busy={phase === "grading"} />
      )}

      {phase === "feedback" && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={nextQuestion}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg"
            autoFocus
          >
            Next question
          </button>
          <button type="button" onClick={end} className="rounded-lg border border-border px-4 py-2">
            End session
          </button>
        </div>
      )}
    </div>
  );
}
