# Verification Report (planning phase, 2 Oct 2026)

What was actually **run** to check these docs, on this Mac (Apple M2, 8 GB, macOS, Node v24.3.0, npm, Docker CLI 29.5.3), using disposable copies of the project.

## Legend
✅ verified by running it · 📄 verified against official docs/registry · ⏳ not yet verifiable (needs Ollama/Docker running; first tasks in TASK.md)

## 1. Versions (npm registry / Docker Hub / GitHub, 2 Oct 2026) 📄

| Package | Pinned | Note |
|---|---|---|
| next / create-next-app | 16.3.8 | latest stable; template installs `typescript@^5`, `react@19.2.x` |
| @mastra/core | 1.74.0 | needs Node ≥ 22.13 |
| ollama-ai-provider-v2 | 4.0.1 | peer deps `ai@^7`, `zod@^4.0.16` |
| ai | 7.x | needed as a peer of the provider |
| ollama (JS) | 0.6.4 | |
| zod | 4.6.5 | |
| prisma / @prisma/client / @prisma/adapter-pg | 7.10.0 | ⚠️ npm `latest` tag = `8.0.0-rc.19`, so pin 7.10.0 |
| tsx | 4.23.15 | |
| vitest | 5.0.3 | needs `@types/node` ≥ 22 |
| shadcn | 4.21.1 | |
| pgvector image | `pgvector/pgvector:0.8.7-pg17` | |
| Ollama app | v0.35.0 (released 28 Sep 2026) | embeddinggemma needs ≥ 0.11.10 |

## 2. Checks that were run

| # | Check | Result |
|---|---|---|
| 1 | Mastra `Agent` accepts an `ollama-ai-provider-v2` model **instance** (docs pages disagreed) | ✅ Mastra 1.74 types: `MastraModelConfig = LanguageModelV1…V4 \| ModelRouterModelId \| OpenAICompatibleConfig \| …`; spike type-checks |
| 2 | `agent.generate(…, { structuredOutput: { schema } })` returns typed `res.object` | ✅ type-check |
| 3 | Provider sends the Zod JSON schema to Ollama `format` (constrained decoding) and calls `POST /api/chat` | ✅ read in provider source (`format: responseFormat.schema`, `path: "/chat"`) |
| 4 | Everything imports and runs on Node 24; with Ollama off → `ECONNREFUSED` | ✅ runtime |
| 5 | `generateObject()` maps Ollama-down to `MODEL_UNAVAILABLE` | ✅ runtime: `ERR MODEL_UNAVAILABLE - Ollama is not running…` |
| 6 | `prisma/schema.prisma` validates with Prisma 7.10 | ✅ after adding `previewFeatures = ["postgresqlExtensions"]` (without it: **P1012**) |
| 7 | `prisma.config.ts` is picked up | ✅ CLI logs "Loaded Prisma config from prisma.config.ts" |
| 8 | Migration SQL creates the `vector` extension + `vector(768)` column | ✅ `prisma migrate diff --from-empty --to-schema … --script` |
| 9 | Migration applies to real Postgres + pgvector; nearest-question query with exclusions; TopicStat running average; HNSW index | ✅ on PGlite (Postgres in WASM + pgvector): order correct, 6,8,4 → avg 6 |
| 10 | `TopicStat.updatedAt` has no DB default, so raw SQL must set `now()` | ✅ seen in migration SQL |
| 11 | Seed runner | ✅ `tsx` works; ❌ `node --experimental-strip-types` cannot load the generated client, so the config uses `tsx` |
| 12 | `prisma/seed.ts` type-checks; `data/questions.json` passes the seed's Zod schema | ✅ 14 questions, 2 per topic |
| 13 | `docker-compose.yml` is valid | ✅ `docker compose config --quiet` |
| 14 | Port clash | ✅ found PostgreSQL 18 (EDB) running on 5432 **without** pgvector, so compose uses 5433 |
| 15 | TASK.md T03 (scaffold into temp + `rsync --ignore-existing`) keeps our README | ✅ replayed verbatim |
| 16 | TASK.md T04 dependency commands | ✅ replayed verbatim. Found & fixed: ERESOLVE with `@types/node@^20` vs Vitest 5, so T04 uses `@types/node@^22` |
| 17 | `.gitignore` (Next 16 template + project rules) survives T03 and works | ✅ 24/24 `git check-ignore` cases: `.env*`, `src/generated/`, `.next`, `node_modules`, `.mastra`, `*.db`, media ignored; `.env.example`, docs, prisma, data, src tracked |
| 17b | `.dockerignore` | ✅ 24/24 cases with `@balena/dockerignore` (Docker's matching rules): secrets, node_modules, .next, generated client, .git, docs excluded; app source, prisma, data, package files, `.env.example`, README sent. Not tested with a real `docker build`: no Dockerfile yet and Docker Desktop was off |
| 18 | Code blocks in AI_DESIGN.md / ARCHITECTURE.md / TESTING.md compile | ✅ extracted programmatically from the markdown into a fresh project: `npm run typecheck` passes |
| 19 | Fresh Next 16 `tsc --noEmit` | ❌ fails with `Cannot find name 'LayoutProps'` until `next typegen` runs, so the `typecheck` script runs both ✅ |
| 20 | Production build with Mastra + Prisma + Zod + routes | ✅ `next build` passes (warning "No storage configured on Mastra" is expected) |
| 21 | Built app at runtime with DB + Ollama off | ✅ `/api/health` → 503 `{"ok":false,"db":"down","ollama":{"up":false}}`; bad body → 400 `VALIDATION_ERROR` |
| 22 | Unit tests | ✅ Vitest 3/3 passing |
| 23 | shadcn/ui on Next 16 + Tailwind 4 | ✅ `init --defaults` + 7 components; build still passes |
| 24 | `next dev`/`next start` default host | ✅ `0.0.0.0` (LAN-visible), so scripts use `-H 127.0.0.1` |
| 25 | `prisma db seed` runs through `tsx` | ✅ starts, then stops at the DB call (no DB running during planning) |
| 26 | Gemma models | 📄 `gemma3:4b` 3.3 GB, `gemma3:1b` 815 MB, `gemma4:e2b` 4.6 GB; `embeddinggemma` 622 MB, 768 dims (Matryoshka 512/256/128), 2K context, prompt prefixes from the model card |
| 27 | Tool calling on Gemma 3 | 📄 not advertised on the Ollama page, hence ADR-2 (no tool calling) |
| 28 | Licenses | 📄 Mastra core Apache-2.0 (`ee/` folders excluded); Ollama MIT; Gemma Terms of Use |
| 29 | DEV challenge rules + exact submission template | 📄 DEV Events API `full_details` + the challenge page's template link |
| 30 | All external links in these docs | ✅ HTTP 200 (see §4) |

## 3. Not yet verified (do these first, they are in TASK.md)
| What | Why not | Task |
|---|---|---|
| Real Gemma responses + latency on the M2 | Ollama not installed yet | T01, T13, TESTING.md §6 |
| `prisma migrate dev` + seed against the Docker DB | Docker Desktop was not running | T02, T07, T09 |
| Gemma's JSON quality on real answers | Needs Ollama | T14, T29 |

## 4. Link check
Every external link in README.md, TASK.md and docs/*.md was requested with `curl` on 2 Oct 2026:

| Link | Result |
|---|---|
| https://ai.google.dev/gemma/terms | ✅ 200 |
| https://dev.to/challenges/hacktoberfest-weekend-2026-10-01 | ✅ 200 |
| https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/ | ✅ 200 |
| https://github.com/new | ✅ 200 |
| https://ollama.com/download | ✅ 200 |
| https://github.com/bipul724/prep-buddy.git | ⏳ 404 (expected: you create this repo in TASK T06) |

All relative links between the docs (e.g. `docs/API.md`, `TASK.md`, `LICENSE`) resolve to existing files.
