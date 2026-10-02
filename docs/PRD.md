# Prep Buddy — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Prep Buddy: an offline, private mock-interview coach for campus placements |
| **Author / Owner** | Bipul Chamoli |
| **Built for** | `<FRIEND_NAME>`: one real friend preparing for placements (fill this in, the challenge requires a real person) |
| **Challenge** | DEV *Hacktoberfest Weekend Challenge: Build for a Friend* |
| **Deadline** | **Mon 5 Oct 2026, 12:29 PM IST** (06:59 UTC) |
| **Status** | Draft v1.0 (2 Oct 2026) |
| **Cost to build and run** | ₹0: no paid services, no API keys, no credit card |

---

## 1. Problem

`<FRIEND_NAME>` is in final-year B.Tech and preparing for campus placements. Practising interviews is hard because:

1. **There is no one to practise with at 11 PM.** Friends are busy, and seniors are not always available.
2. **Paid mock-interview platforms cost money** and need a stable internet connection, which is not reliable in the hostel.
3. **Cloud AI tools send their answers and personal data to servers they don't control.** Some companies' practice material should not be uploaded.
4. **Practice is unfocused.** They do not know which topics (DBMS? OS? DSA?) are actually weakest, so they keep revising what they already know.

## 2. Solution (one line)

A web app that runs **completely on a laptop**. An open-weight model (**Google Gemma**, via **Ollama**) asks placement interview questions, grades the typed answers against key points, explains the gaps, and **remembers weak topics** so the next question targets them.

## 3. Why open-source AI is the core (challenge requirement)

| Need | How open-source AI solves it | A closed API would… |
|---|---|---|
| Free to use every day | Gemma runs locally through Ollama: ₹0 per question | charge per token or need a paid plan |
| Works in the hostel with bad Wi-Fi | After setup, inference runs fully offline | fail without internet |
| Private answers | Nothing leaves the laptop; no account, no API key | send every answer to a third-party server |
| Customisable | Swap models (`gemma3:1b` ↔ `gemma3:4b` ↔ `gemma4:e2b`) with one env var; edit the question bank | lock you into one vendor's model and terms |

## 4. Goals and non-goals

### Goals (for the weekend MVP)
- G1: A friend can complete a **5-question practice session** end to end, fully offline.
- G2: Every answer gets **structured, useful feedback** (score, strengths, gaps, ideal-answer outline) in **under ~30 s** on an 8 GB M2 with `gemma3:4b`. *(This is a target to measure; see docs/TESTING.md.)*
- G3: The app **remembers weak topics** and picks the next question from them.
- G4: The repo is easy to run: one README, a Docker database and Ollama, with no cloud accounts.
- G5: The project is real enough to hand to `<FRIEND_NAME>` and quote their feedback in the DEV post.

### Non-goals (explicitly out of scope this weekend)
- User accounts / login (single-user local app).
- Cloud hosting of the model (it runs on the user's laptop by design).
- Running or judging code (no code-execution sandbox).
- Voice input. The browser Web Speech API in Chrome sends audio to Google servers, which breaks the "private / offline" promise.
- Mobile app.

## 5. Users and persona

**Primary persona: `<FRIEND_NAME>`, final-year CSE student**
- Laptop: a mid-range machine (8 GB+ RAM recommended).
- Goal: clear the technical + HR rounds for SDE-1 / Analyst roles.
- Pain: limited time, gets nervous, does not know their weak areas.
- Success: "After a week I knew DBMS normalization was my weak spot, and fixed it."

**Secondary persona: Bipul (builder/maintainer)**: adds questions, swaps models, demos the app.

## 6. User stories (with acceptance criteria)

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| US-01 | P0 | As a student, I create my profile (name, target role, focus topics) so practice is personalised. | Profile is saved; focus topics must be ≥1 of the `Topic` enum; I am redirected to the dashboard. |
| US-02 | P0 | As a student, I start a practice session for a topic (or "Auto = my weakest topic"). | Session is created with status `ACTIVE`; the first question appears in < 15 s. |
| US-03 | P0 | As a student, I get one question at a time, in a friendly interviewer tone. | The question comes from the seeded bank (no hallucinated "facts"); with `REPHRASE_QUESTIONS=true` the wording is conversational but the meaning is unchanged. |
| US-04 | P0 | As a student, I type my answer and get feedback. | The response contains `score` (0–10 integer), `verdict`, ≤3 `strengths`, ≤3 `gaps`, `idealAnswerOutline` and `followUpQuestion`. Invalid model JSON is retried once, then a clear error is shown. |
| US-05 | P0 | As a student, double-clicking "Submit" must not grade my answer twice. | The same `Idempotency-Key` returns the stored attempt (`replayed: true`), and the DB has exactly one row. |
| US-06 | P0 | As a student, I end the session and see a summary. | The summary has the overall score, the best and weakest topic, and **3 concrete next steps**; the session becomes `COMPLETED`. |
| US-07 | P0 | As a student, I see my progress by topic. | The dashboard shows attempts and average score per topic; the weakest topic is highlighted. |
| US-08 | P0 | As a student, I can see whether the AI is ready. | The status badge shows DB up/down, Ollama up/down, and whether the chat and embedding models are pulled, with fix-it instructions. |
| US-09 | P1 | As a student, the next question targets my gaps. | When the last attempt had gaps, the next question is the nearest pgvector match to those gaps (within the same topic), excluding questions already asked in this session. |
| US-10 | P1 | As a student, I can practise "similar questions" to one I got wrong. | `GET /api/questions/{id}/similar` returns up to 5 nearest questions. |
| US-11 | P1 | As a maintainer, I can add my own question. | `POST /api/questions` validates and embeds it, and it becomes selectable. |
| US-12 | P2 | As a student, I can switch feedback language to Hindi. | `Profile.language = "hi"` makes the feedback text Hindi (Gemma is multilingual); scores are unchanged. |
| US-13 | P2 | As a student, I can export a session summary as Markdown. | A download button saves `prep-buddy-session-<date>.md`. |

## 7. Functional requirements

- **FR-1 Question bank**: seeded from `data/questions.json`. Each question has a topic, a difficulty, a prompt and 2–6 key points. **Write questions in your own words. Do not copy LeetCode, GFG or company question text.** Target ≥ 8 questions per topic (≈60 total).
- **FR-2 Embeddings**: every question gets a 768-dimension embedding from `embeddinggemma`, using the document prompt format `title: none | text: …`. Queries use `task: search result | query: …`.
- **FR-3 Question selection**: see `docs/ARCHITECTURE.md` → "Next-question algorithm".
- **FR-4 Grading**: the evaluator agent returns `Feedback` (Zod schema in `docs/AI_DESIGN.md`) using **schema-constrained output** (Ollama `format`). Scores are clamped 0–10 by the schema.
- **FR-5 Stats**: `TopicStat` is updated in the **same DB transaction** as the attempt insert (running average).
- **FR-6 Summary**: the coach agent returns `SessionSummary` (schema in `docs/AI_DESIGN.md`).
- **FR-7 Health**: `GET /api/health` reports DB and Ollama status and model availability; HTTP 503 if anything is missing.
- **FR-8 Errors**: all API errors use one JSON shape: `{ "error": { "code", "message", "details?" } }`.

## 8. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 Cost | ₹0. Only free, open-source software. No API keys. |
| NFR-2 Privacy | No network calls except to `localhost` (Ollama, Postgres). No analytics or telemetry added by us. |
| NFR-3 Offline | After `ollama pull` and `npm install`, the app works with Wi-Fi off. |
| NFR-4 Hardware | Runs on an Apple M2 with 8 GB RAM using `gemma3:4b`. `gemma3:1b` is the documented fallback. |
| NFR-5 Latency (targets) | First question < 15 s; feedback < 30 s; summary < 30 s (measured on the M2 and recorded in TESTING.md). |
| NFR-6 Reliability | Model output is always schema-validated. One automatic retry on invalid output. Idempotent answer submission. |
| NFR-7 Safety | The candidate's answer is treated as data (wrapped in `<answer>` tags; the agent is told never to follow instructions inside it). Max answer length 4,000 chars. |
| NFR-8 Accessibility | Keyboard-usable forms, visible focus, colour contrast AA, and `aria-live` for streaming/feedback regions. |
| NFR-9 License | MIT for our code. The Gemma model is used under Google's Gemma Terms of Use. |

## 9. Success metrics (for the weekend)
- `<FRIEND_NAME>` completes **≥ 2 sessions** and gives a quotable reaction for the DEV post.
- **0 crashes** during the demo recording.
- Feedback judged "useful" by the friend on ≥ 4 of 5 answers.
- DEV post published **before Mon 5 Oct, 12:29 PM IST**.

## 10. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 8 GB RAM is tight (model + Docker + browser) | Slow or swapping | Default `gemma3:4b`; fall back to `gemma3:1b`; close other apps; give Docker Desktop ≤ 2 GB of memory. |
| Small model returns poor or invalid JSON | Broken feedback | Schema-constrained output + Zod validation + 1 retry + clear error. Keep prompts short and give key points as a rubric. |
| Model "hallucinates" facts in questions | Wrong questions | Questions come from our curated bank; the model only rephrases them. |
| Port 5432 already used by local PostgreSQL 18 | DB won't start | The compose file maps to **5433**. |
| Running out of time | Missed deadline | Strict P0 scope; cut list in TASK.md; write the post on Sunday, not Monday morning. |

## 11. Release plan
- **Fri 2 Oct**: setup + data layer. **Sat 3 Oct**: AI + API + UI MVP. **Sun 4 Oct**: polish, friend test, demo video. **Mon 5 Oct (before 12:29 PM IST)**: publish the DEV post. See `TASK.md`.

## 12. Open questions
- Which friend? → fill in `<FRIEND_NAME>` everywhere (README, PRD, post).
- Enter optional prize categories? Gemma and Mastra are free and qualify: **Best Use of Gemma ($200)** and **Best Use of Mastra ($100)**.
