// Pure logic, no imports: unit-tested in difficulty.test.ts.
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export function pickDifficulty(avgScore: number | undefined): Difficulty {
  if (avgScore === undefined) return "EASY";
  if (avgScore >= 8.5) return "HARD";
  if (avgScore >= 7) return "MEDIUM";
  return "EASY";
}

/** Same maths as the TopicStat SQL upsert. */
export function nextAverage(prevAvg: number, prevCount: number, score: number): number {
  return (prevAvg * prevCount + score) / (prevCount + 1);
}

/**
 * Auto topic: the focus topic with the lowest avgScore.
 * Ties → fewer attempts. A focus topic with no stats yet counts as untried and wins first.
 */
export function pickWeakestTopic<T extends string>(
  focusTopics: T[],
  stats: { topic: T; attempts: number; avgScore: number }[],
): T | undefined {
  if (focusTopics.length === 0) return undefined;
  const byTopic = new Map(stats.map((s) => [s.topic, s]));
  const untried = focusTopics.find((t) => !byTopic.has(t));
  if (untried) return untried;
  return [...focusTopics].sort((a, b) => {
    const sa = byTopic.get(a)!;
    const sb = byTopic.get(b)!;
    return sa.avgScore - sb.avgScore || sa.attempts - sb.attempts;
  })[0];
}

/** Mean rounded to one decimal. Computed in code, never by the model. */
export function meanScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}
