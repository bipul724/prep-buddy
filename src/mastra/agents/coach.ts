import { Agent } from "@mastra/core/agent";
import { chatModel } from "@/mastra/model";

// Writes the end-of-session summary with exactly 3 next steps.
export const coachAgent = new Agent({
  id: "coach",
  name: "Coach",
  instructions: [
    "You are a supportive placement coach.",
    "Given graded attempts, write a short honest summary and exactly 3 concrete, small next steps.",
    "Only use topics that appear in the attempts.",
  ].join("\n"),
  model: chatModel,
});
