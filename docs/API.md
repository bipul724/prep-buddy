# Prep Buddy — API Reference

- **Base URL**: `http://localhost:3000/api`
- **Format**: JSON in, JSON out (`Content-Type: application/json`)
- **Auth**: none (single-user local app)
- **Implementation**: Next.js 16 Route Handlers in `src/app/api/**/route.ts`. Dynamic params are a Promise in Next 15+:
  `export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) { const { id } = await ctx.params; … }`
- **Slow endpoints**: endpoints marked 🤖 call the local model and can take 5–30 s on an 8 GB M2. Show a loading state in the UI.

## Error format (all endpoints)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid body", "details": [ /* Zod issues */ ] } }
```

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body or query failed Zod validation |
| 404 | `NOT_FOUND` | Unknown id |
| 409 | `SESSION_NOT_ACTIVE` | Session already completed or abandoned |
| 409 | `BANK_EXHAUSTED` | No unasked questions left |
| 502 | `MODEL_OUTPUT_INVALID` | Model JSON failed the schema twice |
| 503 | `MODEL_UNAVAILABLE` | Ollama not running or model not pulled |
| 503 | `DB_UNAVAILABLE` | Postgres not reachable |
| 500 | `INTERNAL` | Unexpected error |

## Shared types

```ts
type Topic = "DSA" | "CS_FUNDAMENTALS" | "DBMS" | "OS" | "CN" | "OOP" | "HR";
type Difficulty = "EASY" | "MEDIUM" | "HARD";
type SessionStatus = "ACTIVE" | "COMPLETED" | "ABANDONED";

type Feedback = {            // from the evaluator agent (docs/AI_DESIGN.md)
  score: number;             // integer 0–10
  verdict: "strong" | "okay" | "weak";
  strengths: string[];       // ≤ 3
  gaps: string[];            // ≤ 3
  idealAnswerOutline: string;
  followUpQuestion: string;
  weakTopics: string[];      // ≤ 3
};

type SessionSummary = {      // from the coach agent
  overallScore: number;      // 0–10, one decimal
  headline: string;
  bestTopic: Topic | null;
  weakestTopic: Topic | null;
  nextSteps: string[];       // exactly 3
  encouragement: string;
};
```

---

## Health

### `GET /api/health`
Checks the DB, Ollama, and whether the configured models are pulled. Used by the status badge.

**200** (everything ready)
```json
{ "ok": true, "db": "up",
  "ollama": { "up": true, "chat": true, "embed": true, "installed": ["gemma3:4b", "embeddinggemma:latest"] } }
```
**503** (something missing). This is the real response captured from the verified build with both services off:
```json
{ "ok": false, "db": "down", "ollama": { "up": false } }
```

---

## Profiles

### `POST /api/profiles`
```json
{ "name": "Aman", "targetRole": "SDE-1", "focusTopics": ["DSA", "DBMS", "OS"], "language": "en" }
```
Validation: `name` 1–60 chars; `targetRole` 1–60 chars; `focusTopics` 1–7 unique `Topic` values; `language` is `"en"` or `"hi"` (default `"en"`).

**201** → `{ "profile": { "id": "cm…", "name": "Aman", "targetRole": "SDE-1", "focusTopics": ["DSA","DBMS","OS"], "language": "en", "createdAt": "…" } }`

### `GET /api/profiles`
**200** → `{ "profiles": [ Profile ] }` (newest first)

### `GET /api/profiles/{profileId}`
**200** → `{ "profile": Profile }` · **404** `NOT_FOUND`

### `GET /api/profiles/{profileId}/progress`
**200**
```json
{
  "topics": [
    { "topic": "DBMS", "attempts": 6, "avgScore": 4.8 },
    { "topic": "DSA",  "attempts": 9, "avgScore": 7.1 }
  ],
  "weakestTopic": "DBMS",
  "totalAttempts": 15,
  "recentSessions": [ { "id": "cm…", "status": "COMPLETED", "startedAt": "…", "overallScore": 6.2 } ]
}
```

---

## Sessions

### `POST /api/sessions`
```json
{ "profileId": "cm…", "topic": "DBMS" }
```
`topic` is optional. If omitted, the app auto-picks the weakest focus topic for each question.

**201** → `{ "session": { "id": "cm…", "profileId": "cm…", "topic": "DBMS", "status": "ACTIVE", "startedAt": "…" } }`

### `GET /api/sessions/{sessionId}`
**200** → `{ "session": Session, "attempts": [ Attempt & { question: { id, prompt, topic, difficulty } } ], "currentQuestion": Question | null }`
`currentQuestion` is the last served question if it has not been answered yet, so the UI can resume after a reload.

### `POST /api/sessions/{sessionId}/questions/next` 🤖 (only when `REPHRASE_QUESTIONS=true`)
No body. Runs the next-question algorithm (docs/ARCHITECTURE.md §5).

**200**
```json
{
  "question": { "id": "cm…", "topic": "DBMS", "difficulty": "EASY", "prompt": "What is normalization and why do we need it?" },
  "spoken": "Let's start with databases. Can you explain what normalization is, and why a team would bother doing it?",
  "reason": "targeted"
}
```
`reason`: `"targeted"` (nearest to your last gaps), `"weakest-topic"`, `"random"` or `"fallback"`.
**409** `SESSION_NOT_ACTIVE` or `BANK_EXHAUSTED`.

### `POST /api/sessions/{sessionId}/attempts` 🤖
Grade an answer.

Headers: `Idempotency-Key: <uuid>`. Recommended: generate one with `crypto.randomUUID()` per **submit click**.

```json
{ "questionId": "cm…", "answer": "Normalization organises tables to reduce redundancy…" }
```
Validation: `answer` is trimmed, 1–`MAX_ANSWER_CHARS` (default 4,000).

**201** (new)
```json
{
  "attempt": { "id": "cm…", "sessionId": "cm…", "questionId": "cm…", "score": 6, "createdAt": "…" },
  "feedback": {
    "score": 6, "verdict": "okay",
    "strengths": ["Correctly said it reduces redundancy"],
    "gaps": ["Did not mention update/insert/delete anomalies", "No normal forms (1NF–3NF) explained"],
    "idealAnswerOutline": "Define normalization → anomalies it prevents → 1NF, 2NF, 3NF with a tiny example → trade-off with joins.",
    "followUpQuestion": "Can you give an example of a 2NF violation?",
    "weakTopics": ["normal forms"]
  }
}
```
**200** (same `Idempotency-Key` sent again) → `{ "attempt": {…}, "feedback": {…}, "replayed": true }`. No second model call, no second DB row.
**400** `VALIDATION_ERROR` (real example from the verified build: missing `questionId` → `"Invalid input: expected string, received undefined"`; also when the question was not served in this session or was already answered) · **404** · **409** `SESSION_NOT_ACTIVE` · **502** · **503**

### `POST /api/sessions/{sessionId}/complete` 🤖
No body. Generates the summary and marks the session `COMPLETED`. If there are 0 attempts, it marks the session `ABANDONED` and skips the model call.

**200**
```json
{
  "session": { "id": "cm…", "status": "COMPLETED", "endedAt": "…" },
  "summary": {
    "overallScore": 6.4,
    "headline": "Solid basics, but explain the 'why' more.",
    "bestTopic": "DSA", "weakestTopic": "DBMS",
    "nextSteps": ["Revise 1NF–3NF with one example each", "Practise 3 DBMS questions tomorrow", "Use the STAR format for HR answers"],
    "encouragement": "You improved on every follow-up. Keep going!"
  }
}
```

---

## Questions

### `GET /api/questions?topic=DBMS&difficulty=EASY&limit=20`
All query params are optional; `limit` is 1–100 (default 20). **200** → `{ "questions": [ { id, topic, difficulty, prompt, keyPoints } ] }`

### `GET /api/questions/{questionId}/similar?limit=5` (P1)
Nearest questions by cosine distance in the same topic, excluding the question itself.
**200** → `{ "questions": [ { "id": "cm…", "prompt": "…", "distance": 0.21 } ] }` · **404**

### `POST /api/questions` 🤖 (P1, embeds the question)
```json
{ "topic": "OS", "difficulty": "MEDIUM", "prompt": "What is a deadlock and how can it be prevented?",
  "keyPoints": ["four Coffman conditions", "prevention vs avoidance", "Banker's algorithm idea"] }
```
Validation: `prompt` 10–500 chars; `keyPoints` 2–6 items, each 2–120 chars.
**201** → `{ "question": {…} }`

---

## cURL quick test (after `npm run dev`)

```bash
curl -s localhost:3000/api/health | jq

PROFILE=$(curl -s -X POST localhost:3000/api/profiles -H 'Content-Type: application/json' \
  -d '{"name":"Aman","targetRole":"SDE-1","focusTopics":["DBMS","OS"]}' | jq -r .profile.id)

SESSION=$(curl -s -X POST localhost:3000/api/sessions -H 'Content-Type: application/json' \
  -d "{\"profileId\":\"$PROFILE\",\"topic\":\"DBMS\"}" | jq -r .session.id)

Q=$(curl -s -X POST localhost:3000/api/sessions/$SESSION/questions/next | jq -r .question.id)

KEY=$(uuidgen)
curl -s -X POST localhost:3000/api/sessions/$SESSION/attempts -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $KEY" -d "{\"questionId\":\"$Q\",\"answer\":\"It reduces redundancy in tables.\"}" | jq
# Run the same command again: it must return "replayed": true
curl -s -X POST localhost:3000/api/sessions/$SESSION/complete | jq
```
`jq` is optional (`brew install jq`). `uuidgen` ships with macOS.
