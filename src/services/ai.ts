// One structured call, one retry, clear errors (docs/AI_DESIGN.md §3).
import type { ZodType } from "zod";
import { env } from "@/lib/env";
import { ModelError } from "@/lib/errors";
import { mastra } from "@/mastra";

export { ModelError };

const errorText = (e: unknown) => {
  try {
    return JSON.stringify(e, Object.getOwnPropertyNames(e as object)) + String(e);
  } catch {
    return String(e);
  }
};

const isConnRefused = (e: unknown) =>
  errorText(e).includes("ECONNREFUSED") ||
  String((e as { cause?: { code?: string } })?.cause?.code) === "ECONNREFUSED";

// Ollama answers 404 "model 'x' not found, try pulling it first" when a model is missing.
const isModelMissing = (e: unknown) => /model ['"]?[^'"]*['"]? not found/i.test(errorText(e));

/** Maps connection / missing-model failures (chat or embeddings) to MODEL_UNAVAILABLE. Returns null otherwise. */
export function toModelUnavailable(e: unknown, model: string): ModelError | null {
  if (isConnRefused(e)) {
    return new ModelError("MODEL_UNAVAILABLE", "Ollama is not running. Open the Ollama app or run `ollama serve`.");
  }
  if (isModelMissing(e)) {
    return new ModelError("MODEL_UNAVAILABLE", `Model "${model}" is not pulled. Run \`ollama pull ${model}\`.`);
  }
  return null;
}

export async function generateObject<T>(
  agentId: "interviewer" | "evaluator" | "coach",
  prompt: string,
  schema: ZodType<T>,
): Promise<T> {
  const agent = mastra.getAgentById(agentId);
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await agent.generate([{ role: "user", content: prompt }], {
        structuredOutput: { schema, errorStrategy: "strict" },
      });
      // Validate again ourselves: never show half-broken JSON to the user.
      return schema.parse(res.object);
    } catch (e) {
      const unavailable = toModelUnavailable(e, env.CHAT_MODEL);
      if (unavailable) throw unavailable;
      lastError = e;
    }
  }
  throw new ModelError("MODEL_OUTPUT_INVALID", `Model output failed validation twice: ${String(lastError)}`);
}
