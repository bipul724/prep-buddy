import { prisma } from "@/lib/db";
import { ApiError, parseBody, toResponse } from "@/lib/errors";
import { CreateSessionBody } from "@/lib/schemas";

// POST /api/sessions: topic is optional (omitted = auto-pick the weakest focus topic per question).
export async function POST(req: Request) {
  try {
    const { profileId, topic } = await parseBody(req, CreateSessionBody);
    const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { id: true } });
    if (!profile) throw new ApiError("NOT_FOUND", "Profile not found");
    const session = await prisma.session.create({ data: { profileId, topic: topic ?? null } });
    return Response.json({ session }, { status: 201 });
  } catch (e) {
    return toResponse(e);
  }
}
