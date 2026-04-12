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

