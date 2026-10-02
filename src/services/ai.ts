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

// Small models sometimes loop on a token ("0} 0} 0} ...") until the context fills, which takes minutes.
// Cap the output and the wall time so a bad generation fails fast instead of hanging the request.
// num_predict is the only cap Ollama honours here: the provider sends maxOutputTokens as max_output_tokens, which /api/chat ignores.
const MAX_OUTPUT_TOKENS = 800;
const CALL_TIMEOUT_MS = 60_000;

export async function generateObject<T>(
  agentId: "interviewer" | "evaluator" | "coach",
  prompt: string,
  schema: ZodType<T>,
): Promise<T> {
  const agent = mastra.getAgentById(agentId);
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const signal = AbortSignal.timeout(CALL_TIMEOUT_MS);
    try {
      const res = await agent.generate([{ role: "user", content: prompt }], {
        structuredOutput: { schema, errorStrategy: "strict" },
        providerOptions: { ollama: { options: { num_predict: MAX_OUTPUT_TOKENS } } },
        abortSignal: signal,
      });
      // Validate again ourselves: never show half-broken JSON to the user.
      return schema.parse(res.object);
    } catch (e) {
      const unavailable = toModelUnavailable(e, env.CHAT_MODEL);
      if (unavailable) throw unavailable;
      // A second slow attempt would just double the wait.
      if (signal.aborted) {
        throw new ModelError("MODEL_OUTPUT_INVALID", `Model took longer than ${CALL_TIMEOUT_MS / 1000}s. Try again.`);
      }
      lastError = e;
    }
  }
  throw new ModelError("MODEL_OUTPUT_INVALID", `Model output failed validation twice: ${String(lastError)}`);
}
