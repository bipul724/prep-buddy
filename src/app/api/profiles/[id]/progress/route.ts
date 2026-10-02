import { prisma } from "@/lib/db";
import { ApiError, toResponse } from "@/lib/errors";

export async function GET(_req: Request, ctx: RouteContext<"/api/profiles/[id]/progress">) {
  try {
    const { id } = await ctx.params;
    const profile = await prisma.profile.findUnique({ where: { id }, select: { id: true } });
    if (!profile) throw new ApiError("NOT_FOUND", "Profile not found");

    const [stats, sessions] = await Promise.all([
      prisma.topicStat.findMany({ where: { profileId: id }, orderBy: [{ avgScore: "asc" }, { attempts: "asc" }] }),
      prisma.session.findMany({ where: { profileId: id }, orderBy: { startedAt: "desc" }, take: 5 }),
    ]);

    const topics = stats.map((s) => ({ topic: s.topic, attempts: s.attempts, avgScore: Math.round(s.avgScore * 10) / 10 }));
    return Response.json({
      topics,
      weakestTopic: topics[0]?.topic ?? null,
      totalAttempts: topics.reduce((n, t) => n + t.attempts, 0),
      recentSessions: sessions.map((s) => ({
        id: s.id,
        topic: s.topic,
        status: s.status,
        startedAt: s.startedAt,
        overallScore: (s.summary as { overallScore?: number } | null)?.overallScore ?? null,
      })),
    });
  } catch (e) {
    return toResponse(e);
  }
}
