# Prep Buddy

**An offline, private mock-interview coach for campus placements, powered by Google Gemma running on your own laptop.**

Built for Siddhant Singh for the [DEV Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01).

> ₹0 to run · no API keys · works with Wi-Fi off · your answers never leave your laptop

<!-- Add a screenshot or GIF here: docs/screenshot-feedback.png -->

## What it does
1. Asks you placement interview questions (DSA, CS fundamentals, DBMS, OS, CN, OOP, HR) in a friendly interviewer tone.
2. Grades your typed answer with a score, strengths, gaps, an ideal-answer outline and a follow-up question.
3. Remembers your **weak topics** and picks the next question to target them (EmbeddingGemma + pgvector).
4. Ends each session with a short summary and **3 concrete next steps**.

## Why open-source AI
| | Prep Buddy (Gemma via Ollama) | A typical closed AI API |
|---|---|---|
| Cost | Free | Pay per use |
| Internet | Not needed after setup | Required |
| Privacy | Stays on your laptop | Sent to a third-party server |
| Model choice | Swap with one env var | Vendor-locked |

## Tech stack
Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Mastra 1.74 (agents) · Ollama + **Gemma 3 4B** · **EmbeddingGemma** · PostgreSQL 17 + pgvector 0.8.7 · Prisma 7.10 · Zod 4 · Vitest 5

## Quick start (macOS)

**Requirements**: Node ≥ 22.18 · Docker Desktop · [Ollama](https://ollama.com/download) · about 5 GB of free disk space · 8 GB+ RAM

```bash
# 1. Models (one-time, needs internet)
ollama pull gemma3:4b
ollama pull embeddinggemma

# 2. Database (Postgres + pgvector on port 5433)
docker compose up -d

# 3. App
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev            # → http://localhost:3000
```
Check that everything is ready: `curl -s localhost:3000/api/health` should return `"ok": true`.

Low on RAM? Set `CHAT_MODEL="gemma3:1b"` in `.env` and run `ollama pull gemma3:1b`.

## Documentation
| Doc | What's inside |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Problem, users, user stories, requirements, risks |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrams, data model, flows, vector search, decisions |
| [docs/API.md](docs/API.md) | Every endpoint with request/response examples |
| [docs/AI_DESIGN.md](docs/AI_DESIGN.md) | Agents, prompts, Zod schemas, model choices |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Setup, run, share a demo, troubleshooting |
| [docs/TESTING.md](docs/TESTING.md) | Unit, API, model-quality and manual QA plans |
| [docs/SUBMISSION.md](docs/SUBMISSION.md) | DEV challenge rules + post template |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | What was tested during planning, and how |
| [TASK.md](TASK.md) | Step-by-step build plan with checks |

## Project status
🚧 Being built during the challenge window (2–5 Oct 2026). Progress is tracked in [TASK.md](TASK.md).

## License
Code: [MIT](LICENSE) © 2026 Bipul Chamoli.
Gemma models are provided by Google under the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
