import { describe, expect, it } from "vitest";
import { meanScore, nextAverage, pickDifficulty, pickWeakestTopic } from "./difficulty";

describe("pickDifficulty", () => {
  it("starts at EASY with no stats", () => expect(pickDifficulty(undefined)).toBe("EASY"));
  it("moves up at 7 and 8.5", () => {
    expect(pickDifficulty(6.9)).toBe("EASY");
    expect(pickDifficulty(7)).toBe("MEDIUM");
    expect(pickDifficulty(8.5)).toBe("HARD");
  });
});

describe("nextAverage", () => {
  it("matches the SQL upsert (6, 8, 4 -> 6)", () => {
    let avg = 0;
    [6, 8, 4].forEach((s, i) => (avg = nextAverage(avg, i, s)));
    expect(avg).toBe(6);
  });
});

describe("pickWeakestTopic", () => {
  it("returns the first untried focus topic", () => {
    expect(pickWeakestTopic(["DSA", "DBMS"], [{ topic: "DSA", attempts: 2, avgScore: 3 }])).toBe("DBMS");
  });
  it("picks the lowest average, ties broken by fewer attempts", () => {
    const stats = [
      { topic: "DSA", attempts: 4, avgScore: 5 },
      { topic: "OS", attempts: 2, avgScore: 5 },
      { topic: "DBMS", attempts: 1, avgScore: 7 },
    ];
    expect(pickWeakestTopic(["DSA", "OS", "DBMS"], stats)).toBe("OS");
  });
  it("ignores stats for topics outside the focus list", () => {
    expect(pickWeakestTopic(["DSA"], [{ topic: "DSA", attempts: 1, avgScore: 9 }, { topic: "HR", attempts: 1, avgScore: 1 }])).toBe("DSA");
  });
  it("returns undefined with no focus topics", () => expect(pickWeakestTopic([], [])).toBeUndefined());
});

describe("meanScore", () => {
  it("rounds to one decimal", () => expect(meanScore([6, 7, 7])).toBe(6.7));
  it("is 0 for no scores", () => expect(meanScore([])).toBe(0));
});
