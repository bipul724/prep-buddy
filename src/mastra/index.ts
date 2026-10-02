import { Mastra } from "@mastra/core";
import { coachAgent } from "@/mastra/agents/coach";
import { evaluatorAgent } from "@/mastra/agents/evaluator";
import { interviewerAgent } from "@/mastra/agents/interviewer";

// No storage on purpose: app data lives in our Postgres (ADR-4). The build-time
// "No `storage` configured on Mastra" warning is expected.
export const mastra = new Mastra({ agents: { interviewerAgent, evaluatorAgent, coachAgent } });
