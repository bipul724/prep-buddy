# DEV Challenge Submission Guide

**Challenge**: [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)
**Deadline**: **Monday 5 Oct 2026, 12:29 PM IST** (06:59 UTC). Aim to publish by **Sunday night**.
**Prizes**: $2,450 across 17 winners. Overall $250 + DEV++ · 6 featured categories at $200 · 10 categories at $100 · a completion badge for every valid entry.

## 1. Rules checklist (from the official challenge text)
- [ ] You are **18+** (DEV Official Rules).
- [ ] It is a **new project built during the challenge window** (2–5 Oct). The repo's first commit should be on or after 2 Oct.
- [ ] **Open-source AI is at the core** (Gemma via Ollama ✅, Mastra ✅).
- [ ] Built for **one real friend or loved one** (`<FRIEND_NAME>`).
- [ ] **One entry** per person per challenge. Teams of up to 4 are allowed: one member publishes and lists teammates' DEV usernames in the body.
- [ ] Post uses the **submission template**, with tags `devchallenge, weekendchallenge, hf26challenge` (the template pre-fills them).
- [ ] Includes **what you built + who it's for, a demo, the code, and why open matters**.
- [ ] Optional bonus: you **handed it to your friend** and quote their reaction.
- [ ] Optional: a coding-session embed via DevRelay.

## 2. Judging criteria and how this project scores
1. **Writing quality (weighted most heavily)**: tell a human story first (your friend, their 11 PM practice problem), use short sections and screenshots, and be honest about limits.
2. **Relevance**: Gemma runs locally, which is the whole product. Say clearly "open-source AI is the core: without Gemma running locally there is no app".
3. **Creativity**: weak-topic memory with vector search, plus fully offline practice for hostel Wi-Fi.
4. **Technical execution**: schema-constrained JSON, idempotent submits, health checks, and a clean README.
5. **Partner tech (optional)**: entering **Best Use of Gemma ($200)** and **Best Use of Mastra ($100)**. Both are free and used meaningfully. Do not claim categories you don't use.

## 3. The official template (copy into DEV; it was extracted from the challenge page)

```markdown
---
title: Prep Buddy: an offline AI interview coach I built for <FRIEND_NAME>
published: false
tags: devchallenge, weekendchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built
<!-- What does it do, and who is the friend or loved one you built it for?  What problem does it solve for them? -->

## Demo
<!-- Share a deployed link or a video demo. -->

## Code
<!-- Show us the code!  You can embed a GitHub repo directly into your post. -->

## How I Built It
<!-- Which open-source AI did you use (open-weight models, agent harnesses, frameworks, local inference), and how is your project built around it? -->

## Why Does Open Innovation Matter?
<!-- Why does open innovation matter for what you built?  What did it make possible that a closed API wouldn't? -->

## My Agent Session
<!-- Optional, but judges love it.  Save your session with DevRelay and embed it with the agent_session tag (see the challenge page), or link to it. -->

## Prize Categories
<!-- Which partner categories are you entering?  List every one that applies, or remove this section. -->
```

## 4. What to write in each section (your notes, then write it in your own voice)

**What I Built**: 2–3 short paragraphs. Who `<FRIEND_NAME>` is, the problem (no practice partner at night, paid tools, bad hostel Wi-Fi, privacy), and what Prep Buddy does in one sentence. Add 1 screenshot of a feedback card.

**Demo**: a 60–120 s screen recording (Cmd+Shift+5 → upload to YouTube unlisted or embed a GIF). Show: the status badge (offline, local models) → a question → an answer → feedback → summary → the weak-topic dashboard. Mention "Wi-Fi is off" on screen.

**Code**: `{% github bipul724/prep-buddy %}` (DEV's GitHub embed). Make sure the repo is public, has the README, and has the MIT LICENSE.

**How I Built It**: the stack table, the architecture diagram (GitHub renders the Mermaid diagrams in docs/ARCHITECTURE.md; take a screenshot of it and paste the image into the DEV post), and 3 interesting decisions:
1. Schema-constrained JSON instead of tool calling for a 4B model.
2. EmbeddingGemma + pgvector to target weak topics.
3. Idempotent submits so a double-click never grades twice.

**Why Does Open Innovation Matter?**: use the table from PRD §3 (free, offline, private, swappable). Add an honest comparison: "A bigger closed model gives richer feedback, but my friend can't use it in the hostel at 11 PM for free."

**My Agent Session**: optional. If you build with an AI coding agent and save the session with DevRelay, embed it here; otherwise delete this section.

**Prize Categories**: "Best Use of Gemma, Best Use of Mastra." Say one line on how each is used.

Also add **your friend's reaction** (a quote) and **real numbers** from TESTING.md §6 (latency, model size).

## 5. Pre-publish checklist
- [ ] Repo public, README complete, MIT LICENSE, no `.env` committed
- [ ] Demo video plays without sign-in
- [ ] All links work; screenshots are readable
- [ ] Spell-check done; the title is specific and friendly
- [ ] `published: true` only when you are ready (DEV will publish immediately)
- [ ] Published **before Mon 5 Oct, 12:29 PM IST**. Then check that it appears under the challenge tag `#hf26challenge`

## 6. After publishing
- Share it on LinkedIn/X with the post link.
- Hacktoberfest stickers: the DEV Challenge submission earns one; connect your DEV account at hacktoberfest.com/my.
- Week 1 of the challenge starts **Mon 5 Oct, 12:30 PM IST** with a new theme. Each round needs a **new project** built in its own window.
