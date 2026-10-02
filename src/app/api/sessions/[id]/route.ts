import { prisma } from "@/lib/db";
import { ApiError, toResponse } from "@/lib/errors";

export async function GET(_req: Request, ctx: RouteContext<"/api/sessions/[id]">) {
  try {
    const { id } = await ctx.params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        attempts: {
          orderBy: { createdAt: "asc" },
          include: { question: { select: { id: true, prompt: true, topic: true, difficulty: true } } },
        },
      },
    });
    if (!session) throw new ApiError("NOT_FOUND", "Session not found");
    const { attempts, ...rest } = session;

    // The last served question, if it has not been answered yet (lets the UI resume after a reload).
    const lastAsked = session.askedQuestionIds.at(-1);
    const pending = lastAsked && !attempts.some((a) => a.questionId === lastAsked) ? lastAsked : null;
    const currentQuestion = pending
      ? await prisma.question.findUnique({
          where: { id: pending },
          select: { id: true, topic: true, difficulty: true, prompt: true },
        })
      : null;

    return Response.json({ session: rest, attempts, currentQuestion });
  } catch (e) {
    return toResponse(e);
  }
}
