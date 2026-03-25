

# Bloomr

**AI-powered adaptive study companion with a 3D gamified garden.**

*Learn it. Grow it. Own it.*

## What is Bloomr?

Bloomr turns any study material into a personalised learning experience — then makes mastering it feel like earning something.

Upload a lecture PDF, paste your notes, photograph a whiteboard, record yourself explaining a concept, or drop a YouTube link. Bloomr reads it, structures it into focused study units, adapts the content to how you learn, and quizzes you on it with AI-graded short answers.

Every topic you master becomes a flower in your 3D garden. Every flower is permanently, uniquely yours — a randomly assigned pot, a randomly generated colour, a rarity tier from Common to Legendary. Your garden is a history of everything you've conquered.

Built for the students that standard tools forget: ESL learners who need simpler language without losing accuracy, students with ADHD who need structured short bursts, and visual learners who need diagrams not walls of text.

---

## Features

### 5 Ways to Get Your Material In

| Input | How it works |
|---|---|
| **PDF Upload** | Drag and drop — Gemini reads the full document |
| **Text Paste** | Paste raw notes, copied slides, anything |
| **Image + OCR** | Upload a photo of handwritten notes — Tesseract.js extracts the text client-side, no API cost |
| **Voice Input** | Hit the mic, speak your notes — Web Speech API transcribes live in the browser |
| **YouTube Link** | Paste any YouTube URL — we pull the transcript server-side via `youtube-transcript` |

All five converge at the same pipeline — extracted text → OpenAI → structured units, quizzes, and concept maps.

---

### Adaptive Learning Engine

On signup, Bloomr asks three questions. Every piece of AI-generated content is shaped by the answers for the life of your account.

- **ESL Learner** → simplified vocabulary, inline term definitions, shorter sentences, no idioms
- **Visual Learner** → auto-generated Mermaid concept maps on every unit, visual-first layout
- **ADHD / Focus** → content chunked into 5-minute sections, frequent inline knowledge checks, minimal clutter

The learner profile is injected into every OpenAI prompt. The AI doesn't forget who you are.

---

### Study Units

Each upload generates 3–5 focused study units containing:

- Structured text content with **inline key term tooltips** (hover for definition)
- **Auto-generated concept map** (Mermaid.js) showing relationships between ideas
- **Vocabulary grid** with all key terms and definitions
- **Natural voice audio** (ElevenLabs `eleven_turbo_v2`) — listen while commuting, cached to Supabase Storage after first generation so it never re-generates
- Previous / Next navigation with unit progress indicator

---

### Quiz Engine

- **Multiple choice** with instant per-question feedback and correct/wrong animation
- **Short answer** graded by OpenAI — returns a score (0–1) and a written explanation of what was missing
- **80% pass threshold** — must pass to grow the flower
- **KaTeX math mode** for STEM subjects
- Full results breakdown per question after submission
- Retry on fail

---

### Weak Areas — Remediation System

After every quiz attempt, Bloomr analyses which questions you got wrong and extracts the specific concepts they tested.

- **"Where You're Struggling"** section surfaces on the results page whenever you fail or score below 60% on any question
- Each weak area is shown as a tagged chip — concept name + which unit it came from
- **"Practice These Topics"** generates a targeted remediation quiz on just those concepts
- Practice quizzes are clearly labelled — no marks, no growth stage effect, no pressure. Just learning.
- Weak areas accumulate across attempts — repeat misses get surfaced more prominently
- The flower detail page shows an **aggregated "Areas to Review"** panel across all units

---

### AI Tutor

A persistent chat panel lives on the right side of every flower detail page.

- Full context of the topic and all unit content — answers from *your material*, not the internet
- Scoped per flower — context never bleeds between topics
- Ask anything about the lecture. Get answers grounded in what you uploaded.

---

### 3D Garden & Flower System

- **React Three Fiber** scene — procedurally generated flowers at grid coordinates
- **10×10 garden grid** with fencing, ambient + directional lighting
- **Drag-and-drop repositioning** with collision detection and snap-to-grid
- **5 growth stages** — Seed (0) → Sprout → Bud → Opening → Full Bloom (4)
- Growth stage increments live on quiz pass — no page refresh
- **5 flower types**, each with unique geometry and petal structure
- **5 rarity tiers** — Common (60%), Uncommon (25%), Rare (10%), Epic (3%), Legendary (2%)
- **5 camo types** — Solid, Stripes, Polka Dots, Drip, Flames — procedurally applied via canvas-generated textures
- **Camo pattern offsets** (the CSGO skin mechanic) — `pattern_offset_x` and `pattern_offset_y` are random floats seeded at flower creation, stored permanently, applied as UV transforms in R3F. Every flower is visually unique even with the same type and camo.
- Rarity is deterministic from the offsets — permanent, never re-rolled

---

### Mastery Test & Gacha

- Final exam pulls 7–10 random questions across all units of the flower
- Same quiz interface, higher difficulty mix
- On pass: **gacha pot-drop animation** (40-item spinning reel, 4.2s) reveals the pot rarity
- Pot colour is randomly generated — hex code stored in DB and displayed on the flower detail page
- Sets `growth_stage = 4`, `status = bloomed`
- Flower moves to garden in full bloom

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL + RLS |
| Storage | Supabase Storage |
| AI — Content & Grading | OpenAI GPT-4o |
| AI — TTS | ElevenLabs (`eleven_turbo_v2`) |
| OCR | Tesseract.js (client-side) |
| Voice Input | Web Speech API (native browser) |
| YouTube Transcripts | `youtube-transcript` (server-side) |
| Concept Maps | Mermaid.js |
| Math Rendering | KaTeX |
| 3D Garden | React Three Fiber 9 + @react-three/drei 10 + Three.js 0.169 |
| Animations | GSAP 3 |
| State | Zustand 5 |
| Hosting | Vercel |
| Package Manager | pnpm |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Supabase account (free tier)
- OpenAI API key
- ElevenLabs API key

### 1. Clone and install

```bash
git clone https://github.com/your-username/bloomr.git
cd bloomr
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id
```

### 3. Set up the database

Run the SQL migrations in `/supabase/migrations` against your Supabase project, or use the Supabase CLI:

```bash
npx supabase db push
```

### 4. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---


## Designed For

- **ESL students** — content simplified without losing technical accuracy
- **Students with ADHD** — short focused chunks, frequent checks, minimal noise
- **Visual learners** — concept maps on every unit, diagram-first layout
- **Commuters** — natural voice audio for hands-free studying
- **Any student** — with any material, in any format



