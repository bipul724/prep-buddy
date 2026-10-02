// T29: grade any bank question from the terminal (golden answers + prompt-injection checks).
// Run: npx tsx --tsconfig tsconfig.json scripts/golden.ts "<topic>" "<question prompt>" "<answer>"
//  or: npm run golden -- "<topic>" "<question prompt>" "<answer>"
// The question must match a prompt in data/questions.json exactly, so the evaluator gets its key points.
// Needs Ollama running with the chat model pulled (no database needed).
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Feedback } from "@/lib/schemas";
import { generateObject, ModelError } from "@/services/ai";
import { buildEvaluatorPrompt } from "@/services/prompts";

type BankQuestion = { topic: string; difficulty: string; prompt: string; keyPoints: string[] };

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main() {
  const [topicArg, promptArg, answer] = process.argv.slice(2);
  if (!topicArg || !promptArg || answer === undefined) {
    fail('Usage: npx tsx --tsconfig tsconfig.json scripts/golden.ts "<topic>" "<question prompt>" "<answer>"');
  }

  const topic = topicArg.trim().toUpperCase();
  const bank: BankQuestion[] = JSON.parse(readFileSync("data/questions.json", "utf8"));
  const inTopic = bank.filter((q) => q.topic === topic);
  if (inTopic.length === 0) {
    fail(`ERR unknown topic "${topicArg}". Topics: ${[...new Set(bank.map((q) => q.topic))].join(", ")}`);
  }
  const question = inTopic.find((q) => q.prompt === promptArg.trim());
  if (!question) {
    fail(`ERR no ${topic} question with that exact prompt. ${topic} prompts:\n${inTopic.map((q) => `  - ${q.prompt}`).join("\n")}`);
  }

  try {
    const fb = await generateObject("evaluator", buildEvaluatorPrompt(question, answer, "en"), Feedback);
    console.log(`Topic: ${question.topic}\nQuestion: ${question.prompt}\nScore: ${fb.score}\nVerdict: ${fb.verdict}`);
  } catch (e) {
    fail(e instanceof ModelError ? `ERR ${e.code} - ${e.message}` : String(e));
  }
}

main();
