"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerBox } from "@/components/AnswerBox";
import { FeedbackCard } from "@/components/FeedbackCard";
import { QuestionCard } from "@/components/QuestionCard";
import { api, ClientError, TOPIC_LABELS, type AttemptView, type Feedback, type QuestionView, type SessionView } from "@/lib/client";
import { useElapsed } from "@/lib/useElapsed";

type Phase = "loading" | "asking" | "answering" | "grading" | "feedback" | "ending" | "exhausted" | "error";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [current, setCurrent] = useState<{ question: QuestionView; spoken: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answered, setAnswered] = useState(0);
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const started = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const waiting = phase === "asking" || phase === "grading" || phase === "ending";
  const elapsed = useElapsed(waiting);

  // Show the score first; keyboard focus goes to "Next question" without jumping past it.
  useEffect(() => {
    if (phase !== "feedback") return;
    nextRef.current?.focus({ preventScroll: true });
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase]);

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
        setSessionTopic(data.session.topic);
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Practice session · {sessionTopic ? TOPIC_LABELS[sessionTopic] : "Auto"}</p>
          <div className="mt-2 flex items-center gap-1.5" aria-label={`${answered} answered`}>
            {Array.from({ length: Math.max(5, answered + 1) }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-1.5 w-6 rounded-full transition ${
                  i < answered ? "bg-accent" : i === answered && phase !== "feedback" ? "bg-highlight" : "bg-surface-2"
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-muted tabular-nums">{answered} answered</span>
          </div>
        </div>
        <button type="button" onClick={end} disabled={waiting} className="btn-secondary px-4 py-2 text-sm">
          End session
        </button>
      </div>

      {current && phase !== "asking" && (
        <QuestionCard
          question={current.question}
          spoken={current.spoken}
          index={answered + (phase === "feedback" ? 0 : 1)}
        />
      )}

      <div aria-live="polite" className="space-y-6">
        {waiting && (
          <div className="card flex items-center gap-4 p-5">
            <span
              aria-hidden
              className="h-9 w-9 shrink-0 animate-spin rounded-full border-[3px] border-surface-2 border-t-accent"
            />
            <div>
              <p className="font-medium">
                {waitText}… <span className="text-muted tabular-nums">{elapsed}s</span>
              </p>
              <p className="text-sm text-muted">
                {elapsed >= 10
                  ? "The first call after a break loads the model into memory, so it is slower."
                  : "Gemma is running on this laptop, nothing is sent online."}
              </p>
            </div>
          </div>
        )}
        {phase === "error" && error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-weak-soft p-5 text-sm text-weak">
            <p className="max-w-lg">{error.message}</p>
            <button type="button" onClick={error.retry} className="rounded-xl border border-weak px-4 py-2 font-medium">
              Try again
            </button>
          </div>
        )}
        {phase === "exhausted" && (
          <div className="card p-6 text-center">
            <p className="font-display text-xl font-semibold">You&apos;ve cleared the bank 🎉</p>
            <p className="mt-1 text-sm text-muted">Every question here has been asked. End the session to see your summary.</p>
            <button type="button" onClick={end} className="btn-primary mt-4">
              See my summary
            </button>
          </div>
        )}
        {phase === "feedback" && feedback && (
          <div ref={feedbackRef} className="scroll-mt-20">
            <FeedbackCard feedback={feedback} />
          </div>
        )}
      </div>

      {(phase === "answering" || phase === "grading") && current && (
        <AnswerBox key={current.question.id} onSubmit={submit} busy={phase === "grading"} />
      )}

      {phase === "feedback" && (
        <div className="flex flex-wrap gap-3">
          <button ref={nextRef} type="button" onClick={nextQuestion} className="btn-primary px-6 py-3">
            Next question →
          </button>
          <button type="button" onClick={end} className="btn-secondary px-6 py-3">
            Finish and see summary
          </button>
        </div>
      )}
    </div>
  );
}
