import { prisma } from "@/lib/db";
import { parseBody, toResponse } from "@/lib/errors";
import { CreateProfileBody } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, CreateProfileBody);
    const profile = await prisma.profile.create({ data: body });
    return Response.json({ profile }, { status: 201 });
  } catch (e) {
    return toResponse(e);
  }
}

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ profiles });
  } catch (e) {
    return toResponse(e);
  }
}
