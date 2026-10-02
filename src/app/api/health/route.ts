import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { modelStatus } from "@/lib/ollama";

// GET /api/health: DB + Ollama + models pulled. 503 if anything is missing.
export async function GET() {
  const [db, ollama] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(
      () => "up" as const,
      () => "down" as const,
    ),
    modelStatus(),
  ]);
  const ok = db === "up" && ollama.up && ollama.chat && ollama.embed;
  // `models` tells the status badge which `ollama pull` command to show.
  return Response.json(
    { ok, db, ollama, models: { chat: env.CHAT_MODEL, embed: env.EMBED_MODEL } },
    { status: ok ? 200 : 503 },
  );
}
