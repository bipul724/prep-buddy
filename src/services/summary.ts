// Complete a session: coach agent summary, or ABANDONED when nothing was answered (docs/ARCHITECTURE.md §4.3).
import type { Topic } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { Feedback, SessionSummary } from "@/lib/schemas";
import { generateObject } from "@/services/ai";
import { meanScore } from "@/services/difficulty";
import { buildCoachPrompt } from "@/services/prompts";

/** Best/weakest topic by mean score. Used when the model names a topic that was not practised. */
function topicExtremes(rows: { topic: Topic; score: number }[]) {
  const byTopic = new Map<Topic, number[]>();
  for (const r of rows) byTopic.set(r.topic, [...(byTopic.get(r.topic) ?? []), r.score]);
  const means = [...byTopic.entries()].map(([topic, s]) => ({ topic, mean: meanScore(s) }));
  means.sort((a, b) => b.mean - a.mean);
  return { best: means[0]?.topic ?? null, weakest: means.at(-1)?.topic ?? null };
}

export async function completeSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      profile: true,
      attempts: { orderBy: { createdAt: "asc" }, include: { question: { select: { topic: true, difficulty: true } } } },
    },
  });
  if (!session) throw new ApiError("NOT_FOUND", "Session not found");
  if (session.status !== "ACTIVE") throw new ApiError("SESSION_NOT_ACTIVE", `Session is ${session.status}`);

  if (session.attempts.length === 0) {
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { status: "ABANDONED", endedAt: new Date() },
    });
    return { session: { id: updated.id, status: updated.status, endedAt: updated.endedAt }, summary: null };
  }

  const rows = session.attempts.map((a) => {
    const fb = Feedback.partial().safeParse(a.feedback);
    return {
      topic: a.question.topic,
      difficulty: a.question.difficulty,
      score: a.score ?? 0,
      gaps: fb.success ? (fb.data.gaps ?? []) : [],
    };
  });
  const avg = meanScore(rows.map((r) => r.score));

  const summary = await generateObject("coach", buildCoachPrompt(session.profile, rows, avg), SessionSummary);

  // Never trust the model with arithmetic or with topics it was not given.
  const practised = new Set(rows.map((r) => r.topic));
  const extremes = topicExtremes(rows);
  const final: SessionSummary = {
    ...summary,
    overallScore: avg,
    bestTopic: summary.bestTopic && practised.has(summary.bestTopic) ? summary.bestTopic : extremes.best,
    weakestTopic: summary.weakestTopic && practised.has(summary.weakestTopic) ? summary.weakestTopic : extremes.weakest,
  };

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", summary: final, endedAt: new Date() },
  });
  return { session: { id: updated.id, status: updated.status, endedAt: updated.endedAt }, summary: final };
}
