import { prisma } from "@/lib/db";
import { ApiError, toResponse } from "@/lib/errors";

export async function GET(_req: Request, ctx: RouteContext<"/api/profiles/[id]">) {
  try {
    const { id } = await ctx.params;
    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new ApiError("NOT_FOUND", "Profile not found");
    return Response.json({ profile });
  } catch (e) {
    return toResponse(e);
  }
}
