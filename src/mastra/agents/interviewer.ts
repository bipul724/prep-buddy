import { Agent } from "@mastra/core/agent";
import { chatModel } from "@/mastra/model";

// Rephrases a bank question so it sounds natural when spoken. Never invents content.
export const interviewerAgent = new Agent({
  id: "interviewer",
  name: "Interviewer",
  instructions: [
    "You are a friendly campus-placement interviewer in India.",
    "Rephrase the given bank question so it sounds natural when spoken, in 1-2 sentences.",
    "Keep the exact technical meaning. Do not add new requirements, hints, or answers.",
  ].join("\n"),
  model: chatModel,
});
