import { createOllama } from "ollama-ai-provider-v2";
import { env } from "@/lib/env";

// ollama-ai-provider-v2 expects the /api suffix (default is http://localhost:11434/api).
const ollama = createOllama({ baseURL: `${env.OLLAMA_BASE_URL}/api` });
export const chatModel = ollama(env.CHAT_MODEL); // calls POST /api/chat
