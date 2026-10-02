// Next-question algorithm (docs/ARCHITECTURE.md §5).
import type { Difficulty, Question, Topic } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/errors";
import { asQuery, embed } from "@/lib/ollama";
import { Feedback, InterviewerTurn } from "@/lib/schemas";
import { nearestQuestions } from "@/lib/vector";
import { generateObject, ModelError } from "@/services/ai";
import { pickDifficulty, pickWeakestTopic } from "@/services/difficulty";
import { buildInterviewerPrompt, isUsableRephrase } from "@/services/prompts";

export type PickReason = "targeted" | "weakest-topic" | "random" | "fallback";

export type PublicQuestion = Pick<Question, "id" | "topic" | "difficulty" | "prompt">;

const publicFields = { id: true, topic: true, difficulty: true, prompt: true } as const;

async function randomUnasked(where: { topic?: Topic; difficulty?: Difficulty }, exclude: string[]) {
  const ids = await prisma.question.findMany({ where: { ...where, id: { notIn: exclude } }, select: { id: true } });
  if (ids.length === 0) return null;
  const { id } = ids[Math.floor(Math.random() * ids.length)];
  return prisma.question.findUniqueOrThrow({ where: { id }, select: publicFields });
}

async function targetedPick(gaps: string[], topic: Topic, exclude: string[]) {
  try {
    const [vec] = await embed([asQuery(gaps.join("; "))]);
    const [nearest] = await nearestQuestions(vec, topic, exclude, 1);
    if (!nearest) return null;
    return prisma.question.findUnique({ where: { id: nearest.id }, select: publicFields });
  } catch (e) {
    // Targeting is a bonus (P1). If embeddings fail, fall back to a random pick.
    console.warn("targeted pick failed, falling back:", String(e));
    return null;
  }
}

export async function pickNext(
  sessionId: string,
): Promise<{ question: PublicQuestion; spoken: string; reason: PickReason }> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      profile: { include: { topicStats: true } },
      attempts: { orderBy: { createdAt: "desc" }, take: 1, include: { question: { select: { topic: true } } } },
    },
  });
  if (!session) throw new ApiError("NOT_FOUND", "Session not found");
  if (session.status !== "ACTIVE") throw new ApiError("SESSION_NOT_ACTIVE", `Session is ${session.status}`);

  const { profile } = session;
  const exclude = session.askedQuestionIds;

  // 1. Topic
  const topic = session.topic ?? pickWeakestTopic(profile.focusTopics, profile.topicStats) ?? "DSA";
  // 2. Difficulty
  const stat = profile.topicStats.find((s) => s.topic === topic);
  const difficulty = pickDifficulty(stat?.avgScore);

  let question: PublicQuestion | null = null;
  let reason: PickReason = session.topic ? "random" : "weakest-topic";

  // 4. Targeted pick: nearest question to the last attempt's gaps, same topic, any difficulty.
  const last = session.attempts[0];
  const lastGaps = Feedback.shape.gaps.safeParse((last?.feedback as { gaps?: unknown } | null)?.gaps);
  if (last && last.question.topic === topic && lastGaps.success && lastGaps.data.length > 0) {
    question = await targetedPick(lastGaps.data, topic, exclude);
    if (question) reason = "targeted";
  }

  // 5. Fallbacks: topic + difficulty → topic → any topic.
  question ??= await randomUnasked({ topic, difficulty }, exclude);
  if (!question) {
    reason = "fallback";
    question = (await randomUnasked({ topic }, exclude)) ?? (await randomUnasked({}, exclude));
  }
  if (!question) throw new ApiError("BANK_EXHAUSTED", "No unasked questions left. End this session and start a new one.");

  // Optional rephrase. Cosmetic, so invalid output falls back to the bank wording.
  let spoken = question.prompt;
  if (env.REPHRASE_QUESTIONS) {
    try {
      const turn = await generateObject("interviewer", buildInterviewerPrompt(profile, question), InterviewerTurn);
      if (isUsableRephrase(turn.spoken)) spoken = turn.spoken.trim().replace(/\?+$/, "?");
      else console.warn("rephrase is not a question, using bank wording:", turn.spoken);
    } catch (e) {
      if (e instanceof ModelError && e.code === "MODEL_UNAVAILABLE") throw e;
      console.warn("rephrase failed, using bank wording:", String(e));
    }
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { askedQuestionIds: { push: question.id } },
  });

  return { question, spoken, reason };
}
