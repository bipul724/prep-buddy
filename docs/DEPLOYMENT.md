# Prep Buddy — Setup & Deployment (100% free, local)

"Deployment" here means **running on your own laptop**. The model is too large for free cloud hosting, and running locally is the point of the project (private, free, offline). A free way to share a live demo link is in §5.

Written for and checked on **this machine**: Apple M2, 8 GB RAM, macOS, Node v24.3.0, Docker 29.5.3, Homebrew installed, **PostgreSQL 18 already running on port 5432**.

## 1. Prerequisites

| Tool | Needed version | Check | Install (free) |
|---|---|---|---|
| Node.js | ≥ 22.18 (Mastra/Prisma) | `node -v` → v24.3.0 ✅ | already installed |
| npm | comes with Node | `npm -v` | — |
| Docker Desktop | any recent | `docker --version` → 29.5.3 ✅ | already installed. **Open the Docker app** before running compose |
| Ollama | ≥ 0.11.10 (for embeddinggemma); latest is v0.35.0 | `ollama -v` | ❌ not installed yet: download from https://ollama.com/download **or** `brew install ollama` |
| jq (optional) | any | `jq --version` | `brew install jq` |

## 2. One-time setup

```bash
# 2.1 Ollama: start it and pull the models (≈3.9 GB download, needs internet ONCE)
#   If you installed the Ollama app: just open it (the menu-bar icon means the server is running).
#   If you used Homebrew:           brew services start ollama    (or run `ollama serve` in its own terminal)
ollama pull gemma3:4b
ollama pull embeddinggemma
ollama list                      # both models should be listed
curl http://localhost:11434/api/version   # prints the Ollama version as JSON

# Quick smoke test of the model (should answer in a few seconds after loading)
ollama run gemma3:4b "In one sentence, what is a primary key?"

# 2.2 Database: Postgres 17 + pgvector in Docker on host port 5433
open -a Docker                   # wait until Docker Desktop says "running"
cd ~/Desktop/prep-buddy
docker compose up -d
docker compose ps                # STATUS should become "healthy"

# 2.3 App
cp .env.example .env
npm install
npx prisma migrate dev --name init   # creates tables + the vector extension
npx prisma db seed                   # loads data/questions.json and embeds each question (Ollama must be running)
npm run dev                          # open http://localhost:3000 (script binds to 127.0.0.1)
curl -s localhost:3000/api/health    # {"ok":true,...}
```

> **Privacy note (verified):** `next dev` and `next start` listen on **all network interfaces (`0.0.0.0`) by default**, so anyone on the same Wi-Fi could open the app. Add `-H 127.0.0.1` to keep it on your laptop only. The `dev` and `start` scripts in TASK.md already do this.

> **Why port 5433?** Your Mac already runs PostgreSQL 18 on 5432 (it has no pgvector). Using 5433 for the Docker DB avoids a clash, so don't change it back to 5432.

## 3. Daily start / stop

```bash
# start
open -a Ollama          # or: brew services start ollama
open -a Docker && docker compose up -d
npm run dev              # script uses -H 127.0.0.1

# stop (frees RAM)
# Ctrl+C in the npm terminal
docker compose stop
# quit Ollama from the menu bar (or: brew services stop ollama)
```

## 4. Local production run (faster than dev mode, use for the demo video)
```bash
npm run build
npm run start            # http://localhost:3000 (script uses -H 127.0.0.1)
```
Building is safe without the DB or Ollama running. Verified: `next build` succeeds even when both are down, because DB and model calls happen only at request time.

## 5. Sharing a live demo with your friend (free, optional)

The app has **no login**. Share it only while you're demoing, then stop it.

**Option A: same Wi-Fi (simplest)**
```bash
npm run build && npx next start -H 0.0.0.0 -p 3000   # 0.0.0.0 = reachable from your LAN
ipconfig getifaddr en0          # e.g. 192.168.1.23 → friend opens http://192.168.1.23:3000
```

**Option B: anywhere, via Cloudflare Quick Tunnel (free, no account)**
```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
# prints a random https://<words>.trycloudflare.com URL; stop it with Ctrl+C after the demo
```
Docs: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/ (quick tunnels are meant for testing, not production).

**Option C: just record a video.** The DEV template accepts "a deployed link **or** a video demo". A 1–2 minute screen recording (Cmd+Shift+5 on macOS) is enough and the safest choice.

## 6. Environment variables

| Name | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | `postgresql://prep:prep@localhost:5433/prepbuddy?schema=public` | Docker DB (host port 5433) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server. The code appends `/api` for the AI SDK provider |
| `CHAT_MODEL` | `gemma3:4b` | Any pulled Ollama chat model |
| `EMBED_MODEL` | `embeddinggemma` | Must output 768 dims (matches `vector(768)`) |
| `EMBED_DIMENSIONS` | `768` | Sanity check in the seed script |
| `REPHRASE_QUESTIONS` | `true` | `false` = one model call fewer per question |
| `MAX_ANSWER_CHARS` | `4000` | Answer length limit |

All values are validated at startup by `src/lib/env.ts` (Zod). A wrong value fails fast with a clear message.

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `/api/health` → `"db":"down"` | Docker not running / container not healthy | `open -a Docker`, `docker compose up -d`, `docker compose logs db` |
| `docker compose up` fails: port already allocated | Something else is on 5433 | `lsof -nP -iTCP:5433 -sTCP:LISTEN`; change the left port in docker-compose.yml **and** in `.env` |
| `failed to connect to the docker API … docker.sock` | Docker Desktop is closed | `open -a Docker` and wait ~30 s |
| `"ollama":{"up":false}` / `MODEL_UNAVAILABLE` | Ollama not running | Open the Ollama app or `ollama serve` |
| `"chat":false` or `"embed":false` | Model not pulled | `ollama pull gemma3:4b` / `ollama pull embeddinggemma` |
| Prisma `P1012 … postgresqlExtensions` | Preview flag missing | Keep `previewFeatures = ["postgresqlExtensions"]` in schema.prisma |
| `type "vector" does not exist` | Wrong DB (the native PG18 on 5432) | Check `DATABASE_URL` uses port **5433** |
| `expected 768 dimensions, not N` | Changed `EMBED_MODEL` | Use embeddinggemma, or change `vector(768)` + migrate + re-seed |
| Seed fails with module errors under `node` | Node type-stripping can't load the generated client | Use `tsx` (already set in prisma.config.ts) |
| `npm i` ERESOLVE `@types/node` with vitest | Template pins `@types/node@^20` | `npm i -D @types/node@^22` |
| Very slow answers / Mac freezing | 8 GB RAM pressure | Close apps, Docker memory 2 GB, `REPHRASE_QUESTIONS=false`, `CHAT_MODEL=gemma3:1b` |
| `MODEL_OUTPUT_INVALID` | Small model broke the schema twice | Retry; shorten prompts; try `jsonPromptInjection: true` (AI_DESIGN.md §3) |

## 8. Reset everything
```bash
docker compose down -v        # deletes the DB volume (all practice data!)
docker compose up -d && npx prisma migrate dev && npx prisma db seed
```

## 9. Optional: use your existing PostgreSQL 18 instead of Docker
Possible but **not recommended this weekend**: PG18 on this Mac was installed by the EnterpriseDB installer and **does not have pgvector** (no `vector.control` in `/Library/PostgreSQL/18/share/postgresql/extension`). Homebrew's `pgvector` formula targets Homebrew's PostgreSQL, not EDB's, so you would need to compile pgvector against `/Library/PostgreSQL/18/bin/pg_config`. Docker is simpler.
