import { describe, expect, it } from "vitest";
import { CreateProfileBody, Feedback, SubmitAttemptBody } from "./schemas";

describe("SubmitAttemptBody", () => {
  it("rejects an empty or whitespace-only answer", () => {
    expect(SubmitAttemptBody.safeParse({ questionId: "q", answer: "" }).success).toBe(false);
    expect(SubmitAttemptBody.safeParse({ questionId: "q", answer: "   \n " }).success).toBe(false);
  });
  it("rejects an answer longer than 4,000 chars", () => {
    expect(SubmitAttemptBody.safeParse({ questionId: "q", answer: "a".repeat(4001) }).success).toBe(false);
    expect(SubmitAttemptBody.safeParse({ questionId: "q", answer: "a".repeat(4000) }).success).toBe(true);
  });
  it("rejects a missing questionId", () => {
    expect(SubmitAttemptBody.safeParse({ answer: "hi" }).success).toBe(false);
  });
});

describe("CreateProfileBody", () => {
  it("rejects empty and duplicate focus topics", () => {
    expect(CreateProfileBody.safeParse({ name: "A", targetRole: "SDE", focusTopics: [] }).success).toBe(false);
    expect(CreateProfileBody.safeParse({ name: "A", targetRole: "SDE", focusTopics: ["OS", "OS"] }).success).toBe(false);
  });
  it("defaults language to en", () => {
    const r = CreateProfileBody.parse({ name: "A", targetRole: "SDE", focusTopics: ["OS"] });
    expect(r.language).toBe("en");
  });
});

describe("Feedback", () => {
  it("rejects scores outside 0-10 and non-integers", () => {
    const base = { verdict: "okay", strengths: [], gaps: [], idealAnswerOutline: "", followUpQuestion: "", weakTopics: [] };
    expect(Feedback.safeParse({ ...base, score: 11 }).success).toBe(false);
    expect(Feedback.safeParse({ ...base, score: 6.5 }).success).toBe(false);
    expect(Feedback.safeParse({ ...base, score: 6 }).success).toBe(true);
  });
});
