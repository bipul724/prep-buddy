import { toResponse } from "@/lib/errors";
import { pickNext } from "@/services/selection";

export async function POST(_req: Request, ctx: RouteContext<"/api/sessions/[id]/questions/next">) {
  try {
    const { id } = await ctx.params;
    return Response.json(await pickNext(id));
  } catch (e) {
    return toResponse(e);
  }
}
