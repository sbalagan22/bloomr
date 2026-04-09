# Bloomr — Product Overview

> Transform lectures, PDFs, and notes into a living 3D botanical garden.
> The more you study, the more it grows.

---

## What Is Bloomr?

Bloomr is an AI-powered adaptive study companion. Students upload their learning material — PDFs, YouTube links, voice recordings, or images — and the AI breaks it down into structured study units. Every topic becomes a **flower** in a personal 3D garden. Completing quizzes and study sessions grows the flower from seed to full bloom. The garden is a visual representation of everything you've mastered.

---

## Core Concept

| Stage | What Happens |
|---|---|
| **Plant** | Upload a PDF, YouTube link, voice note, or image |
| **Germinate** | AI breaks content into bite-sized study units with notes, key terms, and quizzes |
| **Water** | Study units, answer quizzes, chat with Flowy (AI tutor) |
| **Bloom** | Flower reaches full bloom when you pass the mastery exam |

Each flower is **permanently unique** — a random flower type, color pattern, and UV texture offset is assigned at creation. No two flowers look alike.

---

## Features

### Study Tools
- **AI Study Notes** — content condensed into structured units with key terms highlighted
- **Concept Maps** — Mermaid.js diagrams auto-generated per unit
- **MC Quizzes** — multiple-choice questions generated from your material
- **Short Answer Grading** — Gemini grades free-text answers with AI feedback
- **Audio Recaps** — ElevenLabs TTS narrates each unit; cached in Supabase Storage
- **Weak Areas Analysis** — identifies which units need more attention
- **Practice Mode** — re-attempt any unit's quiz at any time

### AI Tutor — Flowy
- Chat interface embedded in every flower's study view
- Context-aware: Flowy knows your study material
- Free: 10 messages/day per flower
- Pro: unlimited messages

### 3D Garden
- React Three Fiber scene with draggable, repositionable flowers
- 5 flower types: rose, tulip, sunflower, daisy, lavender
- Growth stages 0–4: Seed → Sprout → Bud → Opening → Full Bloom
- Collectible pots (gacha system) with rarity tiers: Common, Uncommon, Rare, Epic, Legendary
- Layout editor mode to rearrange the garden

### Gamification
- Pot Drops awarded on flower creation
- Rarity system for pots (color + style variants)
- Visual bloom animation on mastery completion

---

## Plans

| Feature | Free | Pro |
|---|---|---|
| Seeds (flowers/week) | 3 | Unlimited |
| Flowy messages | 10/day/flower | Unlimited |
| PDF uploads | ✓ | ✓ |
| All study units & quizzes | ✓ | ✓ |
| Audio recaps | ✓ | ✓ |
| Concept maps | ✓ | ✓ |
| Voice input uploads | ✗ | ✓ |
| Image uploads (AI analysis) | ✗ | ✓ |
| YouTube link uploads | ✗ | ✓ |
| Export notes as PDF | ✗ | ✓ |
| Price | $0 | $5.99/month |

Seed count resets every **Saturday at 00:00 UTC**.

---

## Home Page (`/`)

The landing page is a single long-scroll page with a floating frosted-glass navbar and a green footer CTA.

### Navbar (floating pill)
- Bloomr logo + wordmark (left)
- Nav links: How it Works · Features · Pricing (center, desktop only)
- Sign In link + "Start Free" green pill button (right)

### Hero Section
- **Left**: Large bold headline — "Learn it / Own it / Grow it" with an animated shimmer gradient on "Grow it"
- **Right**: Interactive 3D flower (`HeroFlower`) — drag to rotate, ambient glow pulse animation
- Floating "Drag to interact" badge on the 3D canvas
- "Start Growing Free" CTA button

### How It Works — The Growth Cycle
- 4-step horizontal timeline (desktop) / vertical (mobile)
- Connected by a gradient line (green → yellow)
- Steps: Plant → Germinate → Water → Bloom, each with a numbered circle and icon

### Features Grid
- 6 feature cards in a 3-column grid (1-col mobile, 2-col tablet)
- Cards: AI-Curated Quizzes, Smart Study Notes, Personalized Flower, Pot Drops (Gacha), Audio Recaps, AI Tutor Chatbot
- Each card has a colored icon, title, and description
- Hover: border highlight, subtle lift, icon scale+rotate

### Pricing Section
- Two-column card layout
- **Free card**: neutral white, `$0/forever`, feature list with lock icons for Pro-only items
- **Pro card**: green gradient (`#39AB54 → #1a6830`), "Most Popular" badge, glow shadow, `$5.99/month`
- Pro card CTA: white button → triggers Stripe checkout (redirects to login if not authenticated)

### Footer (full green `#39AB54`)
- Top: "Ready to plant your first seed?" CTA with white button
- Bottom: Bloomr logo + tagline, copyright line

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL (RLS on all tables) |
| File Storage | Supabase Storage |
| AI | Gemini 2.5 Flash (content gen, grading) |
| TTS | ElevenLabs (`eleven_turbo_v2`) |
| Diagrams | Mermaid.js |
| 3D | React Three Fiber + @react-three/drei |
| Payments | Stripe (subscriptions) |
| Hosting | Vercel |

---

## Key Database Tables

| Table | Purpose |
|---|---|
| `gardens` | One per user — the garden container |
| `flowers` | Each topic/subject; holds growth stage, flower type, pattern offsets |
| `units` | Study units within a flower (AI-generated) |
| `quizzes` | MC and short-answer questions per unit |
| `quiz_attempts` | User answers, scores, AI feedback |
| `learner_profiles` | Onboarding data — language, learning style, subjects |
| `subscriptions` | Stripe plan status (free/pro), customer ID, period end |
| `flowy_usage` | Daily Flowy message counts per user per flower |

---

## Auth Flow

1. `/signup` → onboarding (`/onboarding`) → `/garden`
2. `/login` → `/garden` (or `?redirect` destination)
3. Middleware protects all routes under `/(protected)/`
4. Authenticated users visiting `/login` or `/signup` are redirected to `/garden`
