// T13: grade one DBMS answer with the evaluator agent and time it.
// Run: npx tsx --tsconfig tsconfig.json scripts/try-eval.ts ["your answer"]
// Needs Ollama running with the chat model pulled (no database needed).
import "dotenv/config";
import { Feedback } from "@/lib/schemas";
import { generateObject, ModelError } from "@/services/ai";
import { buildEvaluatorPrompt } from "@/services/prompts";

const question = {
  topic: "DBMS",
  difficulty: "EASY",
  prompt: "What is normalization in databases and why is it useful?",
  keyPoints: ["reduces redundancy", "avoids insert, update and delete anomalies", "normal forms 1NF, 2NF, 3NF", "trade-off: more joins"],
};
const answer = process.argv[2] ?? "Normalization splits tables so the same data is not stored twice. It reduces redundancy.";

async function main() {
  const t0 = performance.now();
  try {
    const fb = await generateObject("evaluator", buildEvaluatorPrompt(question, answer, "en"), Feedback);
    console.log(JSON.stringify(fb, null, 2));
    console.log(`OK: parsed as Feedback in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  } catch (e) {
    if (e instanceof ModelError) console.error(`ERR ${e.code} - ${e.message}`);
    else console.error(e);
    process.exitCode = 1;
  }
}

main();
