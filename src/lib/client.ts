// Browser-side helpers. No server imports here.

export const TOPIC_LABELS: Record<string, string> = {
  DSA: "DSA",
  CS_FUNDAMENTALS: "CS Fundamentals",
  DBMS: "DBMS",
  OS: "Operating Systems",
  CN: "Computer Networks",
  OOP: "OOP",
  HR: "HR",
};
export const TOPIC_KEYS = Object.keys(TOPIC_LABELS);

export class ClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** fetch JSON from our API; throws ClientError with the API's error message. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ClientError("NETWORK", "Cannot reach the Prep Buddy server. Is `npm run dev` running?", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } }).error;
    throw new ClientError(err?.code ?? "INTERNAL", err?.message ?? `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

const PROFILE_KEY = "prepbuddy.profileId";

export function getProfileId(): string | null {
  try {
    return localStorage.getItem(PROFILE_KEY);
  } catch {
    return null;
  }
}

export function setProfileId(id: string | null) {
  try {
    if (id) localStorage.setItem(PROFILE_KEY, id);
    else localStorage.removeItem(PROFILE_KEY);
  } catch {
    // storage unavailable: the dashboard falls back to the newest profile
  }
}

export const scoreTone = (score: number) => (score >= 8 ? "text-good" : score >= 5 ? "text-okay" : "text-weak");

/** Status for a 0–10 score: a word plus colour classes, so state is never shown by colour alone. */
export const scoreStatus = (score: number) =>
  score >= 8
    ? { label: "Strong", dot: "bg-good", fill: "bg-good", track: "bg-good-soft" }
    : score >= 5
      ? { label: "Okay", dot: "bg-okay", fill: "bg-okay", track: "bg-okay-soft" }
      : { label: "Needs work", dot: "bg-weak", fill: "bg-weak", track: "bg-weak-soft" };

// ---- API response types used by the pages ----
export type Profile = { id: string; name: string; targetRole: string; focusTopics: string[]; language: string };
export type QuestionView = { id: string; topic: string; difficulty: string; prompt: string };
export type Feedback = {
  score: number;
  verdict: "strong" | "okay" | "weak";
  strengths: string[];
  gaps: string[];
  idealAnswerOutline: string;
  followUpQuestion: string;
  weakTopics: string[];
};
export type SessionSummary = {
  overallScore: number;
  headline: string;
  bestTopic: string | null;
  weakestTopic: string | null;
  nextSteps: string[];
  encouragement: string;
};
export type SessionView = {
  id: string;
  profileId: string;
  topic: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  summary: SessionSummary | null;
  startedAt: string;
};
export type AttemptView = {
  id: string;
  questionId: string;
  answer: string;
  score: number | null;
  feedback: Feedback | null;
  question: QuestionView;
};

/** Model text cleanup for display: drop list numbering the UI already shows and Markdown emphasis marks. */
export const cleanText = (s: string) =>
  s
    .replace(/^\s*(?:\d+[.)]|[-*•])\s+/, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^\w*])\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, "$1$2")
    .trim();
