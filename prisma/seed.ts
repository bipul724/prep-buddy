// Seeds the question bank from data/questions.json and embeds every question with EmbeddingGemma.
// Run with: npx prisma db seed   (prisma.config.ts runs this file with `tsx`)
// Needs: Postgres (docker compose up -d) + Ollama running with `embeddinggemma` pulled.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Ollama } from "ollama";
import { z } from "zod";
import { Difficulty, PrismaClient, Topic } from "../src/generated/prisma/client";

const QuestionFile = z.array(
  z.object({
    topic: z.enum(Topic),
    difficulty: z.enum(Difficulty),
    prompt: z.string().min(10).max(500),
    keyPoints: z.array(z.string().min(2).max(120)).min(2).max(6),
  }),
);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434" });
const EMBED_MODEL = process.env.EMBED_MODEL ?? "embeddinggemma";
const EMBED_DIMENSIONS = Number(process.env.EMBED_DIMENSIONS ?? 768);
const BATCH = 16;

async function main() {
  const questions = QuestionFile.parse(JSON.parse(readFileSync("data/questions.json", "utf8")));

  // Re-seeding replaces seeded questions only. Questions with attempts are kept,
  // so practice history never points at deleted rows.
  await prisma.question.deleteMany({ where: { source: "seed", attempts: { none: {} } } });
  const existing = new Set((await prisma.question.findMany({ select: { prompt: true } })).map((q) => q.prompt));
  const fresh = questions.filter((q) => !existing.has(q.prompt));
  await prisma.question.createMany({ data: fresh.map((q) => ({ ...q, source: "seed" })) });

  const missing = await prisma.$queryRaw<{ id: string; prompt: string; topic: string }[]>`
    SELECT id, prompt, topic::text AS topic FROM "Question" WHERE embedding IS NULL`;

  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    // EmbeddingGemma document format: "title: {title} | text: {content}"
    const { embeddings } = await ollama.embed({
      model: EMBED_MODEL,
      input: batch.map((q) => `title: ${q.topic} | text: ${q.prompt}`),
    });
    for (const [j, q] of batch.entries()) {
      const vec = embeddings[j];
      if (vec.length !== EMBED_DIMENSIONS) {
        throw new Error(`Expected ${EMBED_DIMENSIONS} dims from ${EMBED_MODEL}, got ${vec.length}`);
      }
      await prisma.$executeRaw`UPDATE "Question" SET embedding = ${`[${vec.join(",")}]`}::vector WHERE id = ${q.id}`;
    }
    console.log(`Embedded ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
  }
  console.log(`Seed done: ${fresh.length} new questions, ${missing.length} embedded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
