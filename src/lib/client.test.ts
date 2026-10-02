import { describe, expect, it } from "vitest";
import { cleanText, realGaps } from "./client";

describe("cleanText", () => {
  it("drops leading list numbers and bullets", () => {
    expect(cleanText("1. Revise 1NF")).toBe("Revise 1NF");
    expect(cleanText("2) Practise")).toBe("Practise");
    expect(cleanText("- Do this")).toBe("Do this");
  });
  it("removes Markdown emphasis but keeps maths", () => {
    expect(cleanText("explain *why* you chose **this**")).toBe("explain why you chose this");
    expect(cleanText("O(n * log n) and 2*3")).toBe("O(n * log n) and 2*3");
  });
  it("keeps numbers that are not list markers", () => {
    expect(cleanText("15-20 minutes on indexes")).toBe("15-20 minutes on indexes");
    expect(cleanText("1NF to 3NF")).toBe("1NF to 3NF");
  });
  it("drops a list number the model wrapped in bold", () => {
    expect(cleanText("**1. Practice Process Scheduling Scenarios:** Work through 2-3 more")).toBe(
      "Practice Process Scheduling Scenarios: Work through 2-3 more",
    );
    expect(cleanText("- **Review** deadlocks")).toBe("Review deadlocks");
  });
});

describe("realGaps", () => {
  it("drops placeholder gaps and keeps real ones", () => {
    expect(realGaps(["None."])).toEqual([]);
    expect(realGaps(["none", "N/A", "Nothing missing.", "No gaps"])).toEqual([]);
    expect(realGaps(["None of the normal forms were named."])).toEqual(["None of the normal forms were named."]);
    expect(realGaps(["Missed the convoy effect", "None."])).toEqual(["Missed the convoy effect"]);
  });
});
