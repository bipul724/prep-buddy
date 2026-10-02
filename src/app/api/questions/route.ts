import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { parseBody, toResponse } from "@/lib/errors";
import { asDocument, embed } from "@/lib/ollama";
import { CreateQuestionBody, QuestionsQuery } from "@/lib/schemas";
import { setQuestionEmbedding } from "@/lib/vector";
import { toModelUnavailable } from "@/services/ai";

const select = { id: true, topic: true, difficulty: true, prompt: true, keyPoints: true } as const;

export async function GET(req: Request) {
  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const { topic, difficulty, limit } = QuestionsQuery.parse(params);
    const questions = await prisma.question.findMany({
      where: { topic, difficulty },
      orderBy: [{ topic: "asc" }, { difficulty: "asc" }, { createdAt: "asc" }],
      take: limit,
      select,
    });
    return Response.json({ questions });
  } catch (e) {
    return toResponse(e);
  }
}

// POST /api/questions: add your own question; it is embedded so it becomes selectable.
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, CreateQuestionBody);
    let vector: number[];
    try {
      // Same document format as prisma/seed.ts
      [vector] = await embed([asDocument(body.prompt, body.topic)]);
    } catch (e) {
      throw toModelUnavailable(e, env.EMBED_MODEL) ?? e;
    }
    const question = await prisma.question.create({ data: { ...body, source: "user" }, select });
    await setQuestionEmbedding(question.id, vector);
    return Response.json({ question }, { status: 201 });
  } catch (e) {
    return toResponse(e);
  }
}
