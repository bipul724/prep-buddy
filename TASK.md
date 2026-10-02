# TASK.md — Prep Buddy build plan

**Deadline: Mon 5 Oct 2026, 12:29 PM IST.** Target: publish the DEV post **Sun 4 Oct night**.
Every task has a **✅ Verify** step. Don't tick the box until the check passes.
Commands marked 🔬 were run and passed during planning on 2 Oct 2026 (see docs/VERIFICATION.md).
🛠️ = code is committed but the ✅ Verify step has not been run yet (needs Ollama + DB).

Legend: **P0** must-have · **P1** nice-to-have · **P2** only if time is left · ⏱ estimate

---

## Phase 0 — Setup (Fri 2 Oct, evening · ⏱ 2 h)

- [x] **T00 · P0 · Pick your friend** (⏱ 15 min)
  Choose ONE real person preparing for placements. Ask them: "Which topics scare you? When do you practise? Is your internet reliable?" Replace `<FRIEND_NAME>` in README.md, docs/PRD.md and docs/SUBMISSION.md.
  ✅ Verify: `grep -rn "<FRIEND_NAME>" README.md docs/` returns nothing.

- [ ] **T01 · P0 · Install Ollama + pull models** (⏱ 20 min, ~3.9 GB download)
  Download from https://ollama.com/download (or `brew install ollama && brew services start ollama`), then:
  ```bash
  ollama pull gemma3:4b
  ollama pull embeddinggemma
  ```
  ✅ Verify: `ollama list` shows both; `curl -s localhost:11434/api/version` prints a version ≥ 0.11.10; `ollama run gemma3:4b "Say hi"` answers.

- [ ] **T02 · P0 · Start the database** (⏱ 10 min)
  ```bash
  open -a Docker            # wait until Docker Desktop is running
  cd ~/Desktop/prep-buddy
  docker compose up -d      # 🔬 compose file validated
  ```
  ✅ Verify: `docker compose ps` shows `prepbuddy-db` as **healthy**. The port is **5433** because PostgreSQL 18 already uses 5432.

- [x] **T03 · P0 · Scaffold Next.js 16 into this folder** (⏱ 5 min) 🔬
  `create-next-app` refuses non-empty folders, so scaffold into a temp folder and merge it in without overwriting our files:
  ```bash
  cd ~/Desktop/capgemin
  npx create-next-app@16.3.8 prep-buddy-scaffold --ts --tailwind --eslint --app --src-dir \
    --import-alias "@/*" --use-npm --skip-install --disable-git --no-react-compiler --yes
  rsync -a --ignore-existing prep-buddy-scaffold/ prep-buddy/
  rm -rf prep-buddy-scaffold
  cd prep-buddy
  ```
  ✅ Verify: `ls src/app` shows `page.tsx`; `head -1 README.md` still says `# Prep Buddy` (ours, not Next's).

- [x] **T04 · P0 · Install dependencies (exact, verified versions)** (⏱ 5 min) 🔬
  ```bash
  npm install
  npm install @mastra/core@1.74.0 ollama-ai-provider-v2@4.0.1 ai@7 ollama@0.6.4 zod@4.6.5 \
    @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg dotenv
  npm install -D @types/node@^22 prisma@7.10.0 tsx@4.23.15 @types/pg vitest@5
  ```
  ⚠️ Do **not** use `prisma@latest` (it currently resolves to 8.0.0-rc). `@types/node@^22` is required, because the template's `^20` conflicts with Vitest 5 (ERESOLVE).
  ✅ Verify: `npm ls prisma @mastra/core zod --depth=0` shows 7.10.0 / 1.74.0 / 4.6.5, with no errors.

- [x] **T05 · P0 · Scripts and engines** (⏱ 5 min) 🔬
  ```bash
  npm pkg set scripts.dev="next dev -H 127.0.0.1" scripts.start="next start -H 127.0.0.1" \
    scripts.test="vitest run" scripts.typecheck="next typegen && tsc --noEmit" scripts.postinstall="prisma generate" \
    scripts.db:up="docker compose up -d" scripts.db:migrate="prisma migrate dev" scripts.db:seed="prisma db seed" \
    engines.node=">=22.18"
  ```
  (Next binds to `0.0.0.0` by default; `-H 127.0.0.1` keeps the app private to your laptop.)
  `.gitignore` and `.dockerignore` are already in the repo, and T03's `rsync --ignore-existing` keeps them, so there is nothing to append. Our `.gitignore` extends the Next template with `!.env.example` (the template's `.env*` rule would hide it), `/src/generated/`, and Mastra/editor/media files.
  ✅ Verify: `npm pkg get scripts`; after T06's `git init`: `git check-ignore .env.example` prints nothing (tracked), and `git check-ignore .env src/generated/prisma/client.ts` prints both paths (ignored).

- [x] **T06 · P0 · Git + GitHub** (⏱ 10 min)
  ```bash
  git init && git add -A && git commit -m "chore: scaffold Prep Buddy (docs, schema, Next 16)"
  ```
  Create a **public** repo `prep-buddy` at https://github.com/new (no README/license; we have them), then:
  ```bash
  git remote add origin https://github.com/bipul724/prep-buddy.git
  git branch -M main && git push -u origin main
  ```
  ✅ Verify: the repo page shows README, LICENSE and docs/; `.env` is **not** there.

## Phase 1 — Data layer (Fri night · ⏱ 2 h)

- [ ] **T07 · P0 · Environment + migration** (⏱ 10 min)
  ```bash
  cp .env.example .env
  npx prisma migrate dev --name init     # 🔬 generated SQL includes CREATE EXTENSION "vector" + vector(768)
  ```
  ✅ Verify: `prisma/migrations/*_init/migration.sql` exists and
  `docker compose exec db psql -U prep -d prepbuddy -c '\dx'` lists `vector`.

- [ ] **T08 · P0 · Grow the question bank to ~60** (⏱ 60 min)
  Add ≥ 8 questions per topic to `data/questions.json` (14 starters included). **Write them in your own words.** Each has 2–6 key points.
  ✅ Verify: `npx prisma db seed` passes Zod validation (it stops with a clear error if any entry is wrong).

- [ ] **T09 · P0 · Seed + embed** (⏱ 5 min) 🔬 (`prisma/seed.ts` type-checks; `questions.json` validates)
  ```bash
  npx prisma db seed
  ```
  ✅ Verify:
  `docker compose exec db psql -U prep -d prepbuddy -c 'SELECT count(*) total, count(embedding) embedded FROM "Question";'` → both numbers are equal.

- [x] **T10 · P0 · Core lib files** (⏱ 30 min) 🔬
  Create `src/lib/env.ts`, `db.ts`, `ollama.ts`, `schemas.ts`, `vector.ts`, `errors.ts` (code in docs/ARCHITECTURE.md §6 and docs/AI_DESIGN.md §3–4, §6).
  ✅ Verify: `npm run typecheck` has 0 errors. (Plain `npx tsc --noEmit` fails on a fresh Next 16 app with `Cannot find name 'LayoutProps'` until `next typegen` has generated the route types; the script does both.)

## Phase 2 — AI layer (Sat 3 Oct, morning · ⏱ 2.5 h)

- [x] **T11 · P0 · Mastra model + 3 agents** (⏱ 45 min) 🔬
  `src/mastra/model.ts`, `agents/interviewer.ts`, `agents/evaluator.ts`, `agents/coach.ts`, `index.ts` (AI_DESIGN.md §3, §5).
  ✅ Verify: `npm run build` succeeds. A "No `storage` configured on Mastra" warning is expected.

- [x] **T12 · P0 · `services/ai.ts` (structured call + retry + error mapping)** (⏱ 30 min) 🔬
  ✅ Verify: with Ollama **quit**, a tsx script calling `generateObject` prints `MODEL_UNAVAILABLE`.

- [ ] **T13 · P0 · First real grading** 🛠️ *code written, verify pending* (⏱ 30 min)
  Write `scripts/try-eval.ts` that grades one DBMS answer:
  ```bash
  npx tsx --tsconfig tsconfig.json scripts/try-eval.ts
  ```
  ✅ Verify: the output parses as `Feedback` (score 0–10, ≤3 gaps). Note the time taken (cold vs warm).

- [ ] **T14 · P1 · Prompt tuning** (⏱ 45 min)
  Run 3 answers (good, average, wrong) for 2 questions; tweak the scoring guide until the order is correct.
  ✅ Verify: excellent > average > wrong for both.

## Phase 3 — API (Sat afternoon · ⏱ 3 h)

- [ ] **T15 · P0 · `GET /api/health`** 🛠️ *code written, verify pending* 🔬 ✅ Verify: 200 with everything up; 503 `{"ok":false,…}` with Ollama quit.
- [ ] **T16 · P0 · Profiles** 🛠️ *code written, verify pending*: `POST/GET /api/profiles`, `GET /api/profiles/[id]`, `GET …/progress`. ✅ Verify: smoke rows 3 and 4 (TESTING.md §3).
- [ ] **T17 · P0 · Sessions + next question** 🛠️ *code written, verify pending*: `services/selection.ts` (ARCHITECTURE.md §5) + `POST /api/sessions`, `GET /api/sessions/[id]`, `POST …/questions/next`. ✅ Verify: 15 calls on a 14-question bank → the 15th is 409 `BANK_EXHAUSTED`.
- [ ] **T18 · P0 · Submit answer (idempotent + transaction)** 🛠️ *code written, verify pending*: `POST …/attempts` with `Idempotency-Key`, Attempt insert + TopicStat upsert in one `prisma.$transaction` (ARCHITECTURE.md §7). 🔬 (SQL verified) ✅ Verify: the same key twice → `replayed:true`, 1 DB row.
- [x] **T19 · P0 · Complete session**: coach summary; `overallScore` computed in code. ✅ Verify: exactly 3 `nextSteps`; 0 attempts → `ABANDONED`.
- [x] **T20 · P1 · Questions list + similar + add** (API.md "Questions"). ✅ Verify: `similar` results are sorted by `distance` ascending.
- [x] **T21 · P0 · Smoke script**: save the cURL block from docs/API.md as `scripts/smoke.sh`. ✅ Verify: it runs end to end without errors.

## Phase 4 — UI (Sat evening · ⏱ 3 h)

- [ ] **T22 · P1 · shadcn/ui** 🔬 ⏭️ *skipped: plain Tailwind (cut list #2)*
  ```bash
  npx shadcn@4.21.1 init --defaults --yes
  npx shadcn@4.21.1 add button card textarea badge select progress sonner --yes
  ```
  ✅ Verify: `src/components/ui/` has 7 files; `npm run build` passes. (Plain Tailwind is fine if you are short on time.)
- [ ] **T23 · P0 · StatusBadge** 🛠️ *code written, verify pending* (polls `/api/health`; shows the fix-it command when red).
- [ ] **T24 · P0 · Onboarding page** 🛠️ *code written, verify pending* `/onboarding` → creates a profile.
- [ ] **T25 · P0 · Dashboard** 🛠️ *code written, verify pending* `/`: per-topic averages, weakest topic, "Start practice" (topic select incl. Auto).
- [ ] **T26 · P0 · Session page** 🛠️ *code written, verify pending* `/session/[id]`: question → textarea → submit (new `crypto.randomUUID()` per click, button disabled while loading) → FeedbackCard → "Next question" / "End session".
- [ ] **T27 · P0 · Summary page** 🛠️ *code written, verify pending* `/session/[id]/summary`.
  ✅ Verify (T23–T27): the manual QA checklist in TESTING.md §5 passes up to "Dashboard shows updated averages".

## Phase 5 — Quality (Sun 4 Oct, morning · ⏱ 2.5 h)

- [x] **T28 · P0 · Unit tests** 🔬 (sample 3/3 passing) — `npm test`. ✅ Verify: all green.
- [x] **T29 · P0 · Golden answers + prompt-injection test** (TESTING.md §4). ✅ Verify: ≥ 4/5 correct order; injection answer scores ≤ 2.
- [ ] **T30 · P0 · Full manual QA incl. Wi-Fi OFF** (TESTING.md §5). ✅ Verify: every box ticked.
- [ ] **T31 · P1 · Performance log** (TESTING.md §6). ✅ Verify: the table is filled with real numbers.

## Phase 6 — Ship & submit (Sun afternoon → night · ⏱ 4 h)

- [ ] **T32 · P0 · Hand it to your friend** (sit with them for 15 minutes). Write down their exact reaction. ✅ Verify: you have a quote.
- [ ] **T33 · P0 · Final README**: friend name, screenshots, real numbers. ✅ Verify: a fresh clone + the README steps work (ask a friend, or redo them in a new folder).
- [ ] **T34 · P0 · Demo video** (60–120 s, `npm run build && npm run start`, Wi-Fi off on screen). ✅ Verify: it plays in a private/incognito window.
- [ ] **T35 · P0 · Push the final code**. ✅ Verify: GitHub shows the latest commit; no `.env`; LICENSE present.
- [ ] **T36 · P0 · Write + publish the DEV post** (docs/SUBMISSION.md). ✅ Verify: it is published, has the 3 tags, and appears under `#hf26challenge`, **before Mon 5 Oct 12:29 PM IST**.

---

## Cut list (if you are behind schedule, cut in this order)
1. T20 (similar/add questions) → 2. T22 shadcn (use plain Tailwind) → 3. T14 prompt tuning → 4. P1 targeted pgvector pick (use random unasked) → 5. `REPHRASE_QUESTIONS=false`.
**Never cut**: T29 injection test, T30 QA, T32 friend test, T34 demo, T36 publish.

## Time check
| When (IST) | You should be done with |
|---|---|
| Fri 2 Oct, midnight | Phase 0 + T07–T09 |
| Sat 3 Oct, 6 PM | Phase 2 + Phase 3 |
| Sat 3 Oct, midnight | Phase 4 |
| Sun 4 Oct, 2 PM | Phase 5 |
| Sun 4 Oct, 11 PM | **Post published** |
| Mon 5 Oct, 12:29 PM | Hard deadline (do not rely on this) |
