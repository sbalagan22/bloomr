# Bloomr — Project Timeline

> Deadline: **March 25, 2026 @ 12:00 PM EST**
> Current date: March 23, 2026
> Time remaining: ~36–40 hours
> Strategy: Nail the core loop. Ship a working demo. Polish last.

---

## Critical Path (Non-Negotiable)

```
Upload PDF → Gemini chunks content → Unit viewer → Quiz → Growth stage increments → Flower renders
```

If this loop doesn't work end-to-end, nothing else matters. Build this first. Everything else is polish.

---

## Phase 0 — Setup (2–3 hours) `[Day 1 Morning]`

### Goals
Get the skeleton up and running. No features yet, just infrastructure.

### Tasks
- [ ] `pnpm create next-app bloomr --typescript --tailwind --app`
- [ ] Install core deps: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `@google/generative-ai`, `@react-three/fiber`, `@react-three/drei`, `three`, `gsap`, `mermaid`, `zustand`
- [ ] Set up Supabase project via Supabase MCP
- [ ] Create all DB tables + RLS policies (use `supabase-developer` skill)
- [ ] Set up Supabase Auth (email/password) using `nextjs-supabase-auth` skill
- [ ] Configure Next.js middleware for protected routes
- [ ] Set up Vercel project + connect GitHub repo via Vercel MCP
- [ ] Add all env vars to Vercel + `.env.local`
- [ ] Scaffold shadcn/ui components via shadcn MCP: Button, Card, Input, Textarea, Progress, Tabs, Badge
- [ ] Commit: `chore: project scaffold`

### Skills to Read First
- `nextjs-supabase-auth`
- `supabase-developer`
- `nextjs-turbopack`

---

## Phase 1 — Upload + AI Pipeline (4–5 hours) `[Day 1 Midday]`

### Goals
Student uploads a PDF/PPT → Gemini processes it → Units stored in DB.

### Tasks
- [ ] Build `/upload` page — drag-and-drop PDF/PPT, flower type selector (5 options), topic name input
- [ ] Upload file to Supabase Storage (`uploads` bucket)
- [ ] Create `/api/gemini/process` route handler:
  - Send file to Gemini 2.5 Flash via File API
  - Prompt: extract N units, each with title + content + key terms + a Mermaid diagram + 3 MC questions + 1 short answer question
  - Parse structured JSON response
  - Store units, quizzes in DB
- [ ] Seed flower record with random `pattern_id` + `pattern_offset_x/y`
- [ ] Inject learner profile into every Gemini prompt (read from `learner_profiles` table)
- [ ] Redirect to `/flower/[id]` on success
- [ ] Error states: file too large, Gemini failure, parse failure

### Skills to Read First
- `google-gemini/gemini-api-dev`
- `documentation-lookup` (activate before writing Gemini API calls)
- `api-design`

---

## Phase 2 — Unit Viewer + Audio (3–4 hours) `[Day 1 Afternoon]`

### Goals
Student can read their generated unit, hear it read aloud, and see the concept diagram.

### Tasks
- [ ] Build `/flower/[id]/units/[unitId]` page
- [ ] Unit content renderer — formatted text with highlighted key terms (click → tooltip definition)
- [ ] Mermaid.js diagram render — parse `diagram_mermaid` field, render inline
- [ ] Audio player component:
  - Play button triggers `/api/tts` route
  - `/api/tts` calls Google Cloud TTS, returns audio buffer
  - Cache audio URL in Supabase Storage after first generation
  - Fallback to `window.speechSynthesis` on quota error
- [ ] Unit navigation — prev/next, progress bar
- [ ] "Start Quiz" CTA at end of unit

### Skills to Read First
- `frontend-design`
- `frontend-patterns`
- `react-ui-patterns`

---

## Phase 3 — Quiz Engine (3–4 hours) `[Day 1 Evening]`

### Goals
MC quiz works. Short answer quiz works with AI grading. Growth stage increments on pass.

### Tasks
- [ ] Build `/flower/[id]/quiz/[quizId]` page
- [ ] Multiple choice component — 4 options, instant feedback on submit, correct/wrong animation
- [ ] Short answer component — textarea, submit → `/api/grade`
- [ ] `/api/grade` route: send student answer + correct answer to Gemini, return score (0–1) + feedback string
- [ ] Store `quiz_attempt` record on every submission
- [ ] Pass threshold: 70% score to count as passed
- [ ] On unit completion (all quizzes passed): increment `growth_stage` on flower record
- [ ] Results page — score, AI feedback per question, "Continue" button

### Skills to Read First
- `backend-patterns`
- `api-design`
- `tdd-workflow` (write quiz grading tests first)

---

## Phase 4 — 3D Flower (4–5 hours) `[Day 1 Night / Day 2 Morning]`

### Goals
The flower renders in 3D. Growth stages are visible. Pattern offset makes it unique. Garden view works.

### Tasks
- [ ] Source GLTF/GLB models: find free low-poly plant models on Sketchfab (CC0 license) — need 4–5 growth stages OR use a single model with scale/morph animation
- [ ] Optimize models: run `gltf-transform optimize input.glb output.glb --compress draco` (use `3d-web-experience` skill)
- [ ] Build `<FlowerScene />` R3F component:
  - Load model with `useGLTF`
  - Switch model/scale based on `growth_stage`
  - Apply texture with UV offset from `pattern_offset_x/y` (the camo mechanic)
  - Ambient + spot lighting
  - OrbitControls for rotation
- [ ] Build `<GardenView />` — grid of all user's flowers, each as a small R3F canvas or instanced mesh
- [ ] GSAP bloom animation: when `growth_stage` increments, animate scale + particle burst
- [ ] Loading state: spinning seed while model loads
- [ ] Mobile performance: cap pixel ratio, reduce geometry on mobile (use `react-three-fiber` skill mobile guidance)

### Skills to Read First
- `react-three-fiber` (EnzeD — read FIRST, Claude Code has stale R3F patterns)
- `3d-web-experience` (haniakrim21 — GLTF pipeline)
- `core-3d-animation` (GSAP bloom animation)

---

## Phase 5 — Polish + Onboarding (2 hours) `[Day 2 Morning]`

### Goals
App looks good. Onboarding captures learner profile. First-run experience is smooth.

### Tasks
- [ ] Learner profile modal on first login — 3 questions: primary language, learning preference (ADHD/dyslexia/none/prefer not to say), content style (visual/audio/text)
- [ ] Landing/splash page with elevator pitch + "Get Started"
- [ ] Garden empty state: "Plant your first flower" CTA
- [ ] Apply brand: `#39AB54` primary, use logos from `/design` folder
- [ ] Typography: pick a distinctive font pairing (NOT Inter) — something organic/natural that fits the garden theme
- [ ] Dark mode support (optional but recommended)
- [ ] Mobile layout pass — ensure upload, unit viewer, quiz, garden all work on 375px width

### Skills to Read First
- `frontend-design` (read every time you open a new page to style)

---

## Phase 6 — Testing + Security (1–2 hours) `[Day 2 Midday]`

### Goals
Critical path is tested. No obvious security holes. App deploys cleanly.

### Tasks
- [ ] Write Playwright E2E test: signup → upload PDF → view unit → complete quiz → verify growth stage incremented (use `e2e-testing` skill)
- [ ] Run `/security-scan` — fix any CRITICAL findings
- [ ] Verify RLS: try accessing another user's flowers via Supabase client — should return empty
- [ ] Check all env vars are in Vercel (use Vercel MCP)
- [ ] Final deploy + smoke test on production URL
- [ ] Record 4-minute video demo

### Skills to Read First
- `e2e-testing`
- `security-review`
- `verification-loop`

---

## Feature Priority Matrix

| Feature | Priority | Cut if time runs out? |
|---|---|---|
| Upload → Gemini → Units | P0 | Never |
| MC Quiz | P0 | Never |
| Growth stage increment | P0 | Never |
| 3D Flower (basic) | P0 | Never |
| Short answer + AI grading | P1 | Keep if possible |
| Audio TTS | P1 | Keep if possible |
| Mermaid diagrams | P1 | Keep if possible |
| Camo/pattern offset (unique flowers) | P1 | Keep — it's the demo wow moment |
| Garden view | P1 | Keep — needed for the narrative |
| Learner profile adaptation | P1 | Keep — it's the core differentiator |
| Dark mode | P2 | Cut |
| Final exam (harder test) | P2 | Cut |
| Mobile polish | P2 | Basic pass only |
| Flashcard mode | P3 | Cut |

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Gemini API rate limit / quota | Medium | Cache all generated content in DB. Never regenerate. |
| GLTF models look bad / hard to find | High | Fallback: CSS 3D transform with emoji flower. Keep R3F as enhancement. |
| R3F performance on mobile | Medium | Cap pixel ratio. Use `PerformanceMonitor` from drei. |
| Short answer grading prompt is unreliable | Medium | Add confidence score. If score < 0.3 or > 0.7, trust it. Grey zone = ask Gemini to re-evaluate once. |
| Vercel build fails | Low | Run `pnpm build` locally before every push. |
| Time runs out | High | Ship Phase 0–3 minimum. The 3D garden is a bonus. A working AI study tool that grades answers already wins. |

---

## Submission Checklist

- [ ] GitHub repo with commits after competition start date
- [ ] All commits are meaningful (not "fix stuff")
- [ ] Vercel production URL is live and accessible
- [ ] 4-minute video demo recorded and uploaded
- [ ] Google Form submitted before March 25 @ 12:00 PM EST
