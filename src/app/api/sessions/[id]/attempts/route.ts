import { env } from "@/lib/env";
import { ApiError, parseBody, toResponse } from "@/lib/errors";
import { IdempotencyKey, makeSubmitAttemptBody } from "@/lib/schemas";
import { submitAttempt } from "@/services/grading";

const SubmitAttemptBody = makeSubmitAttemptBody(env.MAX_ANSWER_CHARS);

// POST /api/sessions/:id/attempts. Same Idempotency-Key → stored attempt, no second grading.
export async function POST(req: Request, ctx: RouteContext<"/api/sessions/[id]/attempts">) {
  try {
    const { id } = await ctx.params;
    const rawKey = req.headers.get("idempotency-key");
    const key = rawKey === null ? null : IdempotencyKey.safeParse(rawKey);
    if (key && !key.success) throw new ApiError("VALIDATION_ERROR", "Invalid Idempotency-Key header", key.error.issues);

    const body = await parseBody(req, SubmitAttemptBody);
    const result = await submitAttempt(id, key?.data ?? null, body);
    return Response.json(result, { status: result.replayed ? 200 : 201 });
  } catch (e) {
    return toResponse(e);
  }
}
