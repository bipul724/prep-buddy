// Ollama JS client: embeddings + model status. Chat goes through Mastra (src/mastra/model.ts).
import { Ollama } from "ollama";
import { env } from "@/lib/env";

export const ollamaClient = new Ollama({ host: env.OLLAMA_BASE_URL });

// EmbeddingGemma prompt formats (from the official model card)
export const asQuery = (text: string) => `task: search result | query: ${text}`;
export const asDocument = (text: string, title = "none") => `title: ${title} | text: ${text}`;

export async function embed(inputs: string[]): Promise<number[][]> {
  const res = await ollamaClient.embed({ model: env.EMBED_MODEL, input: inputs });
  return res.embeddings; // each vector has 768 numbers
}

// "gemma3:4b" matches "gemma3:4b"; "embeddinggemma" matches "embeddinggemma:latest".
export const hasModel = (installed: string[], wanted: string) =>
  installed.some((name) => name === wanted || name === `${wanted}:latest`);

export type ModelStatus =
  | { up: true; chat: boolean; embed: boolean; installed: string[] }
  | { up: false };

export async function modelStatus(): Promise<ModelStatus> {
  try {
    const { models } = await ollamaClient.list();
    const installed = models.map((m) => m.name);
    return {
      up: true,
      chat: hasModel(installed, env.CHAT_MODEL),
      embed: hasModel(installed, env.EMBED_MODEL),
      installed,
    };
  } catch {
    return { up: false };
  }
}
