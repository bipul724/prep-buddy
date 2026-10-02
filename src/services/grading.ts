// Evaluate one answer, then persist Attempt + TopicStat in one transaction (docs/ARCHITECTURE.md §4.2, §7).
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { Feedback } from "@/lib/schemas";
import { generateObject } from "@/services/ai";
import { buildEvaluatorPrompt } from "@/services/prompts";

type AttemptRow = { id: string; sessionId: string; questionId: string; score: number | null; feedback: unknown; createdAt: Date };

const present = (a: AttemptRow) => ({
  attempt: { id: a.id, sessionId: a.sessionId, questionId: a.questionId, score: a.score, createdAt: a.createdAt },
  feedback: a.feedback as Feedback,
});

async function findReplay(sessionId: string, idempotencyKey: string) {
  const existing = await prisma.attempt.findUnique({ where: { idempotencyKey } });
  if (!existing) return null;
  if (existing.sessionId !== sessionId) {
    throw new ApiError("VALIDATION_ERROR", "Idempotency-Key was already used for another session");
  }
  return { ...present(existing), replayed: true as const };
}

export async function submitAttempt(
  sessionId: string,
  idempotencyKey: string | null,
  input: { questionId: string; answer: string },
) {
  if (idempotencyKey) {
    const replay = await findReplay(sessionId, idempotencyKey);
    if (replay) return replay;
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { profile: true, attempts: { select: { questionId: true } } },
  });
  if (!session) throw new ApiError("NOT_FOUND", "Session not found");
  if (session.status !== "ACTIVE") throw new ApiError("SESSION_NOT_ACTIVE", `Session is ${session.status}`);

  const question = await prisma.question.findUnique({ where: { id: input.questionId } });
  if (!question) throw new ApiError("NOT_FOUND", "Question not found");
  if (!session.askedQuestionIds.includes(question.id)) {
    throw new ApiError("VALIDATION_ERROR", "This question was not asked in this session");
  }
  if (session.attempts.some((a) => a.questionId === question.id)) {
    throw new ApiError("VALIDATION_ERROR", "This question was already answered in this session");
  }

  const feedback = await generateObject(
    "evaluator",
    buildEvaluatorPrompt(question, input.answer, session.profile.language),
    Feedback,
  );

  try {
    const attempt = await prisma.$transaction(async (tx) => {
      const row = await tx.attempt.create({
        data: {
          sessionId,
          questionId: question.id,
          answer: input.answer,
          score: feedback.score,
          feedback,
          idempotencyKey,
        },
      });
      await tx.$executeRaw`
        INSERT INTO "TopicStat"("profileId", topic, attempts, "avgScore", "updatedAt")
        VALUES (${session.profileId}, ${question.topic}::"Topic", 1, ${feedback.score}, now())
        ON CONFLICT ("profileId", topic) DO UPDATE SET
          "avgScore" = ("TopicStat"."avgScore" * "TopicStat".attempts + EXCLUDED."avgScore") / ("TopicStat".attempts + 1),
          attempts   = "TopicStat".attempts + 1,
          "updatedAt" = now()`;
      return row;
    });
    return { ...present(attempt), replayed: false as const };
  } catch (e) {
    // Two requests with the same key raced past findReplay: return the winner's row.
    if (idempotencyKey && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const winner = await findReplay(sessionId, idempotencyKey);
      if (winner) return winner;
    }
    throw e;
  }
}
