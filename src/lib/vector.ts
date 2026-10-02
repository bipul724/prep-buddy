// Raw SQL helpers for pgvector (docs/ARCHITECTURE.md §6).
// Prisma cannot read or write Unsupported("vector(768)") columns. Tagged templates are parameterised.
import { prisma } from "@/lib/db";
import type { Topic } from "@/generated/prisma/client";

const toVector = (v: number[]) => `[${v.join(",")}]`;

export async function setQuestionEmbedding(id: string, embedding: number[]) {
  await prisma.$executeRaw`UPDATE "Question" SET embedding = ${toVector(embedding)}::vector WHERE id = ${id}`;
}

export async function nearestQuestions(embedding: number[], topic: Topic, excludeIds: string[], limit = 5) {
  return prisma.$queryRaw<{ id: string; prompt: string; distance: number }[]>`
    SELECT id, prompt, embedding <=> ${toVector(embedding)}::vector AS distance
    FROM "Question"
    WHERE topic = ${topic}::"Topic" AND embedding IS NOT NULL AND id <> ALL(${excludeIds}::text[])
    ORDER BY distance
    LIMIT ${limit}`;
}

/** Nearest questions to an existing question (same topic, itself excluded). */
export async function similarToQuestion(id: string, limit = 5) {
  return prisma.$queryRaw<{ id: string; prompt: string; distance: number }[]>`
    SELECT q.id, q.prompt, q.embedding <=> src.embedding AS distance
    FROM "Question" q, "Question" src
    WHERE src.id = ${id} AND src.embedding IS NOT NULL AND q.embedding IS NOT NULL
      AND q.topic = src.topic AND q.id <> src.id
    ORDER BY distance
    LIMIT ${limit}`;
}
