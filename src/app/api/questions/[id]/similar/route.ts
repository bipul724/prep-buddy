import { prisma } from "@/lib/db";
import { ApiError, toResponse } from "@/lib/errors";
import { SimilarQuery } from "@/lib/schemas";
import { similarToQuestion } from "@/lib/vector";

export async function GET(req: Request, ctx: RouteContext<"/api/questions/[id]/similar">) {
  try {
    const { id } = await ctx.params;
    const { limit } = SimilarQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
    const exists = await prisma.question.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new ApiError("NOT_FOUND", "Question not found");
    const questions = await similarToQuestion(id, limit);
    return Response.json({ questions });
  } catch (e) {
    return toResponse(e);
  }
}
