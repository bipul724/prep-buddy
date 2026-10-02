// Zod schemas: request bodies + model outputs (docs/AI_DESIGN.md §4, docs/API.md).
import { z } from "zod";

export const TOPICS = ["DSA", "CS_FUNDAMENTALS", "DBMS", "OS", "CN", "OOP", "HR"] as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export const TopicEnum = z.enum(TOPICS);
export const DifficultyEnum = z.enum(DIFFICULTIES);

// ---- Model outputs ----

export const InterviewerTurn = z.object({
  spoken: z.string().min(5).max(400),
});
export type InterviewerTurn = z.infer<typeof InterviewerTurn>;

export const Feedback = z.object({
  score: z.number().int().min(0).max(10),
  verdict: z.enum(["strong", "okay", "weak"]),
  strengths: z.array(z.string()).max(3),
  gaps: z.array(z.string()).max(3),
  idealAnswerOutline: z.string(),
  followUpQuestion: z.string(),
  weakTopics: z.array(z.string()).max(3),
});
export type Feedback = z.infer<typeof Feedback>;

export const SessionSummary = z.object({
  overallScore: z.number().min(0).max(10),
  headline: z.string().max(120),
  bestTopic: TopicEnum.nullable(),
  weakestTopic: TopicEnum.nullable(),
  nextSteps: z.array(z.string()).length(3),
  encouragement: z.string().max(200),
});
export type SessionSummary = z.infer<typeof SessionSummary>;

// ---- Request bodies ----

export const CreateProfileBody = z.object({
  name: z.string().trim().min(1).max(60),
  targetRole: z.string().trim().min(1).max(60),
  focusTopics: z
    .array(TopicEnum)
    .min(1)
    .max(7)
    .refine((t) => new Set(t).size === t.length, "focusTopics must be unique"),
  language: z.enum(["en", "hi"]).default("en"),
});

export const CreateSessionBody = z.object({
  profileId: z.string().min(1),
  topic: TopicEnum.optional(),
});

export const makeSubmitAttemptBody = (maxChars: number) =>
  z.object({
    questionId: z.string().min(1),
    answer: z.string().trim().min(1).max(maxChars),
  });
export const SubmitAttemptBody = makeSubmitAttemptBody(4000);

export const QuestionsQuery = z.object({
  topic: TopicEnum.optional(),
  difficulty: DifficultyEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SimilarQuery = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const CreateQuestionBody = z.object({
  topic: TopicEnum,
  difficulty: DifficultyEnum,
  prompt: z.string().trim().min(10).max(500),
  keyPoints: z.array(z.string().trim().min(2).max(120)).min(2).max(6),
});

export const IdempotencyKey = z.string().trim().min(8).max(200);
