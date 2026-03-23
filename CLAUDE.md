# CLAUDE.md — Bloomr

> AI-powered adaptive study companion with a 3D gamified garden. Students upload lecture content, AI transforms it into personalized learning units, and completing quizzes grows a unique 3D flower. Every flower is theirs forever.

>Elevator Pitch: You upload your lecture slides. Our AI breaks them down into bite-sized learning units, adapts the language to how you learn — whether you're ESL, ADHD, or just need to hear it out loud — and turns your study session into growing a flower. Every quiz you pass waters it. Every unit you complete feeds it sunlight. Finish the final exam, it blooms — and every flower is uniquely yours, like a skin you earned. Open your garden and every flower is a topic you've mastered. That's your semester. That's your proof.

---
## Project Identity

- **App name:** Bloomr
- **Brand color:** `#39AB54` (primary green)
- **Logo/icons:** Located in `/design` folder
- **Tagline:** Learn it. Grow it. Own it.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Server components, route handlers |
| Language | TypeScript | Strict mode on |
| Styling | Tailwind CSS + shadcn/ui | shadcn via MCP (see below) |
| Auth | Supabase Auth | Email/password + magic link |
| Database | Supabase PostgreSQL | RLS enabled on all tables |
| File Storage | Supabase Storage | PDFs/PPTs in `uploads` bucket |
| AI | Gemini 2.5 Flash | PDF parsing, content generation, quiz grading |
| TTS | ElevenLabs API | Natural-sounding AI speech for auditory learning |
| Diagrams | Mermaid.js | Auto-generated concept diagrams per unit |
| 3D Garden | React Three Fiber + @react-three/drei | Flower models, UV camo offset mechanic |
| Animations | GSAP | Flower bloom/growth stage transitions |
| Hosting | Vercel | Free tier, auto-deploy from main |
| Package Manager | pnpm | Preferred |

---

## MCP Servers Available

Claude Code has access to the following MCP servers. **Always prefer these over manual CLI operations.**

| MCP | When to Use |
|---|---|
| **Supabase MCP** | Creating tables, writing migrations, managing RLS policies, querying data, managing storage buckets |
| **Vercel MCP** | Deploying, checking build logs, managing environment variables, viewing runtime errors |
| **shadcn/ui MCP** | Scaffolding UI components — always use this instead of writing shadcn components from scratch |

---

## Database Schema

```sql
-- Core tables (implement in this order)
users           -- managed by Supabase Auth
gardens         -- id, user_id, created_at
flowers         -- id, garden_id, topic_name, flower_type (rose|tulip|sunflower|daisy|lavender),
                --   pattern_id (1-5), pattern_offset_x FLOAT, pattern_offset_y FLOAT,
                --   growth_stage INT (0-4), status (growing|bloomed), created_at
units           -- id, flower_id, title, order_index, content_json, diagram_mermaid
quizzes         -- id, unit_id, type (mc|short), question, options_json, correct_answer
quiz_attempts   -- id, user_id, quiz_id, answer, score, ai_feedback, created_at
learner_profiles -- id, user_id, primary_language, learning_style, preferences_json
```

**RLS Policy rule:** Every table must have `auth.uid() = user_id` row-level security. Never skip this.

---

## Skills Reference Table

> Read the relevant SKILL.md **before** starting any task in that domain. Skills are in `.claude/skills/`.

| Skill | Domain | When to Use |
|---|---|---|
| `frontend-design` | UI/UX | Every time you build a new page, component, or layout. Prevents generic AI aesthetics. Enforces bold, intentional design. |
| `frontend-patterns` | React/Next.js | Writing React components, hooks, state management, App Router patterns. Auto-activates on UI work. |
| `react-ui-patterns` | Async UI | Loading states, error boundaries, empty states. Never ship a spinner that shows when data exists. |
| `nextjs-supabase-auth` | Auth | Setting up Supabase Auth with Next.js App Router, middleware, protected routes. Use at project init. |
| `supabase-developer` | Backend | All Supabase operations — DB CRUD, storage uploads, RLS, edge functions. 6-phase implementation guide. |
| `postgres-patterns` | DB | Complex queries, RLS policy patterns, index optimization. Use when writing migrations. |
| `react-three-fiber` (EnzeD) | 3D | R3F scene setup, GLTF model loading, UV texture offsets (camo mechanic), growth stage animations. Critical — Claude Code has stale R3F patterns without this. |
| `3d-web-experience` (haniakrim21) | 3D/Assets | GLTF/GLB pipeline, Draco compression, Spline vs R3F decision tree, scroll-driven 3D. Use when working on flower models. |
| `core-3d-animation` bundle | Animations | GSAP for bloom/growth animations. Three.js + Framer Motion patterns. Use for all transition animations. |
| `google-gemini/gemini-api-dev` | AI | Gemini 2.5 Flash file upload API, multimodal inputs, prompt patterns. Use whenever writing Gemini API calls. |
| `documentation-lookup` | API Refs | Fetches live docs via Context7 MCP. **Always activate before writing Gemini or Google TTS API code** — SDK patterns change. |
| `api-design` | API Routes | RESTful conventions, error response shapes, input validation. Use when creating `/api/*` route handlers. |
| `backend-patterns` | Server | Caching, request patterns, error handling in Next.js API routes. |
| `e2e-testing` | Testing | Playwright E2E tests. Run on the critical path: upload → unit → quiz → growth stage change → bloom. Run before every submission. |
| `tdd-workflow` | Testing | Write tests before implementation. Activate at the start of every new feature. |
| `verification-loop` | Quality | Confirms tasks are actually complete before moving on. Prevents false "done" states. |
| `security-review` | Security | OWASP Top 10 audit. Run `/security-scan` once before final submission. Check for exposed API keys, missing RLS. |
| `nextjs-turbopack` | DX | Next.js 16+ Turbopack config for faster dev builds. Use at project setup. |
| `mcp-server-patterns` | MCP | If building internal tool wrappers for Gemini or TTS as MCP servers. |
| `subagent-driven-development` (superpowers) | Workflow | Dispatches independent subagents per task with review checkpoints. Use for parallel work: Gemini pipeline + UI + DB simultaneously. |
| `brainstorming` (superpowers) | Planning | Structured spec-writing before any implementation. Run once per major feature to produce a locked design doc. |
| `writing-plans` (superpowers) | Planning | Generates checkbox implementation plans from specs. Feed into subagent-driven-development. |
| `supabase-automation` (ComposioHQ) | Automation | Slash commands for repetitive Supabase operations. Faster than writing raw SQL every time. |
| `vercel-automation` (ComposioHQ) | Automation | Manage Vercel deploys, env vars, and logs from Claude Code without switching context. |

---

## Key Architectural Decisions

### The Camo/Pattern Mechanic (CSGO Skin System)
- `pattern_id` (1–5) is randomly assigned at flower creation
- `pattern_offset_x` and `pattern_offset_y` are random floats (0.0–1.0) seeded at creation
- These values are stored in the DB and never regenerated — the flower is permanent
- In R3F, UV mapping is shifted by these offset values using a shader uniform or `useTexture` UV transform
- This makes every flower visually unique even with the same base model + pattern

### Learner Profile → Gemini Prompt Injection
Every Gemini content generation call must inject the learner profile:
```typescript
const learnerContext = `
  Student profile: primary_language=${profile.primary_language},
  learning_style=${profile.learning_style}.
  ${profile.primary_language !== 'English' ? 'Simplify vocabulary. Define technical terms inline. Keep sentences short.' : ''}
  ${profile.learning_style === 'ADHD' ? 'Break content into max 5-minute chunks. Use bullet points. Add frequent knowledge checks.' : ''}
`;
```

### Growth Stage Logic
- `growth_stage` goes 0 → 4 (seed → sprout → bud → bloom → full bloom)
- Each unit completion = +1 stage (capped at 3 until final exam passed)
- Final exam pass = stage 4 (full bloom), status → `bloomed`
- Number of stages scales with unit count: 1–3 units = 3 stages, 4+ units = 4 stages

### Audio (TTS) — ElevenLabs
- ElevenLabs API via `/api/tts` route handler — never expose the API key client-side
- Use model `eleven_turbo_v2` — fastest, lowest latency, lowest credit cost
- Cache returned `.mp3` in Supabase Storage after first generation — key: `tts/{unit_id}.mp3`. On cache hit: serve from Supabase, skip ElevenLabs entirely.
- Voice: set via `ELEVENLABS_VOICE_ID` env var (recommended: Rachel or Adam)
- Fallback: `window.speechSynthesis` if ElevenLabs errors or quota exceeded

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

---

## Development Rules

1. **Never hardcode secrets.** All API keys in `.env.local`, referenced via `process.env`.
2. **RLS on every table.** If you create a table, you add RLS. No exceptions.
3. **Read the skill before building.** Check the skills table above, find the relevant skill, read it.
4. **Test the critical path first.** Upload → unit view → quiz → growth stage. If this breaks, nothing else matters.
5. **Use shadcn MCP for components.** Don't hand-write shadcn components.
6. **Use Supabase MCP for DB operations.** Don't write raw SQL migrations by hand unless unavoidable.
7. **Mobile-first.** This is a student app. Most usage will be on phone.
8. **Design is not optional.** Read `frontend-design` skill before building any page. No purple gradients, no Inter font, no generic layouts.

---

## Submission Checklist

- [ ] Upload flow works end-to-end (PDF → units generated)
- [ ] Learner profile collected on signup
- [ ] At least one quiz type works (MC)
- [ ] Short answer grading via Gemini works
- [ ] Growth stage increments on quiz pass
- [ ] 3D flower renders with correct growth stage
- [ ] Pattern offset applied (flowers look unique)
- [ ] Garden view shows all flowers
- [ ] Audio playback works on at least one unit
- [ ] Mermaid diagram renders on at least one unit
- [ ] Auth (signup/login/protected routes) works
- [ ] Deployed to Vercel
- [ ] No exposed API keys
- [ ] RLS verified on all tables
- [ ] `/security-scan` passed
- [ ] E2E test covers critical path