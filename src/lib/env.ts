// Zod-validated environment variables. A wrong value fails fast with a clear message.
import { z } from "zod";

const boolString = z
  .enum(["true", "false"])
  .default("true")
  .transform((v) => v === "true");

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://prep:prep@localhost:5433/prepbuddy?schema=public"),
  OLLAMA_BASE_URL: z
    .string()
    .url()
    .default("http://localhost:11434")
    .transform((u) => u.replace(/\/+$/, "")),
  CHAT_MODEL: z.string().min(1).default("gemma3:4b"),
  EMBED_MODEL: z.string().min(1).default("embeddinggemma"),
  EMBED_DIMENSIONS: z.coerce.number().int().positive().default(768),
  REPHRASE_QUESTIONS: boolString,
  MAX_ANSWER_CHARS: z.coerce.number().int().min(100).max(20000).default(4000),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment variables (check .env):\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
