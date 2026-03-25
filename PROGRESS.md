# Bloomr — Build Progress

> AI-powered adaptive study companion with a 3D gamified garden.
> **Tagline:** Learn it. Grow it. Own it.

---

## Pages & Routes

### Public
| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page — hero, growth cycle explainer, feature cards, testimonials, CTAs |
| `/login` | `src/app/(auth)/login/page.tsx` | Email/password login, links to signup |
| `/signup` | `src/app/(auth)/signup/page.tsx` | Registration with validation, redirects to onboarding |

### Protected (auth required)
| Route | File | Description |
|---|---|---|
| `/onboarding` | `src/app/(protected)/onboarding/page.tsx` | 3-step learner profile: language, learning style, content style |
| `/garden` | `src/app/(protected)/garden/page.tsx` | 3D garden — 10x10 grid, draggable flowers, editor mode |
| `/upload` | `src/app/(protected)/upload/page.tsx` | PDF upload with 3D flower preview, rarity preview, loading steps |
| `/flower/[id]` | `src/app/(protected)/flower/[id]/page.tsx` | Flower detail — units list, growth progress, mastery CTA, delete |
| `/flower/[id]/units/[unitId]` | `src/app/(protected)/flower/[id]/units/[unitId]/page.tsx` | Study viewer — content, TTS audio, key terms, Mermaid diagram, vocab |
| `/flower/[id]/quiz/[unitId]` | `src/app/(protected)/flower/[id]/quiz/[unitId]/page.tsx` | Unit quiz — MC + short answer, AI grading, 80% pass threshold, growth notification |
| `/flower/[id]/mastery` | `src/app/(protected)/flower/[id]/mastery/page.tsx` | Final mastery exam — 7-10 random Qs, gacha pot drop on pass, full bloom trigger |
| `/auth/callback` | `src/app/auth/callback/route.ts` | OAuth/magic-link callback, exchanges code for session |

---

## API Routes

| Endpoint | File | Description |
|---|---|---|
| `POST /api/gemini/process` | `src/app/api/gemini/process/route.ts` | Downloads PDF → Gemini 2.5 Flash → generates 3-5 units + quizzes, inserts into DB |
| `POST /api/grade` | `src/app/api/grade/route.ts` | AI grades short-answer questions via Gemini, saves quiz_attempt, returns score + feedback |
| `POST /api/tts` | `src/app/api/tts/route.ts` | ElevenLabs TTS (`eleven_turbo_v2`), fallback voice on 402, truncates to 5000 chars |

---

## Components

### Custom
| Component | File | Description |
|---|---|---|
| `Flower3D` | `src/components/flower-3d.tsx` | R3F procedural flowers — camo texture generators, UV offset system, growth stages, rarity styling |
| `FlowerIcons` | `src/components/flower-icons.tsx` | Icon map for each flower type |
| `GachaOpener` | `src/components/gacha-opener.tsx` | Spinning reel animation (40 items, 4.2s) reveals rarity on mastery pass |
| `AudioPlayer` | `src/components/audio-player.tsx` | Calls `/api/tts`, falls back to `window.speechSynthesis`, animated sound bars |
| `MermaidDiagram` | `src/components/mermaid-diagram.tsx` | Renders Mermaid concept maps, auto-fixes broken nodes, Bloomr theme vars |
| `NavBar` | `src/components/nav-bar.tsx` | Garden / Upload / Profile links + logout |

### shadcn/ui (pre-built)
`badge`, `button`, `card`, `dialog`, `input`, `label`, `progress`, `select`, `separator`, `tabs`, `textarea`, `tooltip`

---

## Lib & Utilities

| File | Description |
|---|---|
| `src/lib/rarity.ts` | Rarity system — weighted roll (common 60% → legendary 2%), deterministic rarity from pattern offsets, camo type map |
| `src/lib/store.ts` | Zustand global state — Flower, Unit, Quiz, LearnerProfile interfaces, `updateFlowerGrowth()` action |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server-side Supabase client |
| `src/lib/supabase/middleware.ts` | Session refresh on every request |
| `src/lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |
| `src/middleware.ts` | Protects all routes except static assets |

---

## Database Schema

```sql
users              -- Supabase Auth managed
gardens            -- id, user_id, created_at
flowers            -- id, garden_id, topic_name, flower_type (sunflower|tulip|lily|hydrangea|magnolia)
                      pattern_id (1-5), pattern_offset_x FLOAT, pattern_offset_y FLOAT,
                      growth_stage INT (0-4), status (growing|bloomed),
                      pos_x INT, pos_z INT, created_at
units              -- id, flower_id, title, order_index, content_json, diagram_mermaid, completed
quizzes            -- id, unit_id, type (mc|short), question, options_json, correct_answer
quiz_attempts      -- id, user_id, quiz_id, answer, score, ai_feedback, created_at
learner_profiles   -- id, user_id, primary_language, learning_style, preferences_json
```

RLS enabled on all tables (`auth.uid() = user_id`).

---

## Features Implemented

### Auth & Onboarding
- [x] Email/password signup & login
- [x] Supabase Auth session management
- [x] Protected routes via Next.js middleware
- [x] 3-step learner profile collection (language, learning style, content style)
- [x] Garden created on onboarding completion

### Upload & AI Pipeline
- [x] Drag-and-drop PDF upload to Supabase Storage
- [x] Gemini 2.5 Flash content extraction from PDFs
- [x] Generates 3-5 study units per topic
- [x] Per-unit: title, content, key terms + definitions, Mermaid diagram, MC questions, short-answer questions
- [x] Learner profile injected into every Gemini prompt (language simplification, ADHD formatting)
- [x] Multi-step loading overlay ("Uploading" → "Reading" → "Building units" → "Growing flower")

### Study Units
- [x] Text content with inline key term tooltips (hover for definition)
- [x] TTS audio via ElevenLabs (`eleven_turbo_v2`)
- [x] Browser `speechSynthesis` fallback if TTS fails
- [x] Concept map rendering (Mermaid)
- [x] Vocabulary grid section
- [x] Previous / Next unit navigation

### Quizzes
- [x] Multiple choice with instant per-question feedback
- [x] Short answer with AI grading (Gemini) + written feedback
- [x] KaTeX math mode toggle for LaTeX input
- [x] 80% pass threshold
- [x] Results summary (score, per-question breakdown, pass/fail)
- [x] Growth stage increment on pass
- [x] Retry on fail

### Mastery Test & Gacha
- [x] Final exam pulls 7-10 random questions across all units
- [x] Same quiz interface
- [x] Gacha pot-drop animation on pass (40-item spinning reel, 4.2s)
- [x] Rarity reveal (common → legendary) based on stored pattern offsets
- [x] Sets `growth_stage = 4`, `status = bloomed`

### 3D Garden
- [x] React Three Fiber scene
- [x] 10x10 procedural grid with fencing
- [x] Flower placement at `pos_x / pos_z` grid coords
- [x] Drag-and-drop repositioning with collision detection & snap-to-grid
- [x] Editor mode toggle
- [x] Empty state CTA
- [x] Real-time Supabase subscriptions for live updates

### Flower & Rarity System
- [x] 5 growth stages (0 Seed → 4 Full Bloom)
- [x] 5 camo types: solid, stripes, polka dots, drip, flames
- [x] 5 rarity tiers: common (60%), uncommon (25%), rare (10%), epic (3%), legendary (2%)
- [x] Deterministic rarity from `pattern_offset_x / pattern_offset_y` (permanent, never re-rolled)
- [x] Procedural canvas-generated camo textures in R3F
- [x] Rarity-specific glow / pot styling in 3D scene

### Design System
- [x] Botanical theme (grain texture, glass morphism, pebble shadows)
- [x] Custom color palette — primary green `#39AB54`, surface palette, bloom colors
- [x] Tailwind 4 with CSS variable design tokens
- [x] Mobile-first responsive layout
- [x] Animations: fade-in-up, fade-in-down, scale-in, GSAP-ready

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL + RLS |
| Storage | Supabase Storage (`uploads` bucket) |
| AI | Gemini 2.5 Flash (content generation + grading) |
| TTS | ElevenLabs (`eleven_turbo_v2`) |
| Diagrams | Mermaid.js |
| Math | KaTeX |
| 3D | React Three Fiber 9 + @react-three/drei 10 + Three.js 0.169 |
| Animations | GSAP 3 |
| State | Zustand 5 |
| Hosting | Vercel |
| Package Manager | pnpm |

---

## Submission Checklist

- [x] Upload flow works end-to-end (PDF → units generated)
- [x] Learner profile collected on signup
- [x] Multiple choice quiz works
- [x] Short answer AI grading works
- [x] Growth stage increments on quiz pass
- [x] 3D flower renders with correct growth stage
- [x] Pattern offset applied (flowers look unique)
- [x] Garden view shows all flowers
- [x] Audio playback works on unit view (ElevenLabs + fallback)
- [x] Mermaid diagram renders on unit view
- [x] Auth (signup/login/protected routes) works
- [ ] TTS `.mp3` caching in Supabase Storage (`tts/{unit_id}.mp3`)
- [ ] Deployed to Vercel
- [ ] No exposed API keys (audit)
- [ ] RLS verified on all tables
- [ ] `/security-scan` passed
- [ ] E2E test covers critical path (Playwright)
