import { toResponse } from "@/lib/errors";
import { completeSession } from "@/services/summary";

export async function POST(_req: Request, ctx: RouteContext<"/api/sessions/[id]/complete">) {
  try {
    const { id } = await ctx.params;
    return Response.json(await completeSession(id));
  } catch (e) {
    return toResponse(e);
  }
}
