# Bloomr — Design System

> Read the `frontend-design` skill before building any page or component.
> Brand assets (logos, icons) are in the `/design` folder.

---

## Brand Identity

| Property | Value |
|---|---|
| **App Name** | Bloomr |
| **Tagline** | Learn it. Grow it. Own it. |
| **Primary Color** | `#39AB54` |
| **Aesthetic Direction** | Organic / Natural / Playful-Refined |
| **Logo files** | `/design/logo.svg`, `/design/logo-dark.svg`, `/design/logo-mark.svg` |
| **Icon files** | `/design/icon-*.svg` (flower type icons, UI icons) |
| **Favicon** | `/design/favicon.ico` |

---

## Color Palette

```css
:root {
  /* Primary — Growth Green */
  --color-primary:        #39AB54;
  --color-primary-light:  #5CC873;
  --color-primary-dark:   #2A8040;
  --color-primary-muted:  #C8EDCF;

  /* Neutrals — Soil + Paper */
  --color-soil:           #3D2B1F;   /* rich dark brown — headings, text */
  --color-bark:           #6B4C35;   /* medium brown — secondary text */
  --color-parchment:      #F7F2EA;   /* warm off-white — page background */
  --color-cream:          #EDE8DE;   /* slightly darker — card backgrounds */
  --color-stone:          #C4BAA8;   /* borders, dividers */

  /* Accent — Bloom */
  --color-bloom-rose:     #E8637A;   /* rose flower type */
  --color-bloom-tulip:    #F4A44E;   /* tulip flower type */
  --color-bloom-sunflower:#F5D03B;   /* sunflower flower type */
  --color-bloom-daisy:    #A8D8EA;   /* daisy flower type */
  --color-bloom-lavender: #B09FD8;   /* lavender flower type */

  /* Semantic */
  --color-success:        #39AB54;
  --color-warning:        #F4A44E;
  --color-error:          #E8637A;
  --color-info:           #A8D8EA;

  /* Dark Mode */
  --color-bg-dark:        #1A2318;   /* deep forest green-black */
  --color-surface-dark:   #243020;   /* slightly lighter for cards */
  --color-text-dark:      #E8F5EB;   /* near-white with green tint */
}
```

---

## Typography

> the logo font is poppins light, Never use Inter, Roboto, or Arial. These are banned. The font choices must feel organic, natural, and slightly playful — like a premium nature journal.

### Recommended Pairing

```css
/* Display / Headings — Earthy, organic serif or soft rounded sans */
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap');

/* Body — Clean, warm, readable */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

/* Monospace — For key terms, quiz answers */
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
```

```css
:root {
  --font-display: 'Lora', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'DM Mono', monospace;
}
```

### Type Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-hero` | 3.5rem / 56px | 700 | Landing page hero |
| `--text-h1` | 2.25rem / 36px | 700 | Page titles |
| `--text-h2` | 1.75rem / 28px | 600 | Section headers |
| `--text-h3` | 1.375rem / 22px | 600 | Card titles, unit titles |
| `--text-body` | 1rem / 16px | 400 | Body copy |
| `--text-small` | 0.875rem / 14px | 400 | Captions, labels |
| `--text-xs` | 0.75rem / 12px | 500 | Badges, tags |

---

## Component Design Language

### Cards
- Background: `--color-cream` (light) / `--color-surface-dark` (dark)
- Border: `1px solid var(--color-stone)`
- Border-radius: `16px` (organic, not sharp)
- Shadow: `0 2px 12px rgba(61, 43, 31, 0.08)` — subtle, warm
- Hover: lift `translateY(-2px)` + slightly deeper shadow

### Buttons

```css
/* Primary */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border-radius: 999px;  /* pill shape — soft, organic */
  font-weight: 500;
  padding: 0.625rem 1.5rem;
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1.5px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 999px;
}
```

### Quiz Components
- Correct answer: `--color-primary-muted` background + `--color-primary` border
- Wrong answer: `#FFE8EC` background + `--color-bloom-rose` border
- Pending: `--color-cream` background + `--color-stone` border
- Use subtle spring animation on answer selection (GSAP or Framer Motion)

### Progress Bar
- Track: `--color-cream`
- Fill: `--color-primary` with gradient: `linear-gradient(90deg, #2A8040, #39AB54, #5CC873)`
- Animated fill: GSAP tweening on progress update

### Key Term Chips
- Background: `--color-primary-muted`
- Text: `--color-primary-dark`
- Border-radius: `6px`
- On hover: tooltip with definition pops up (shadcn Tooltip)

---

## 3D Garden Design

### Flower Type → Color Mapping

| Flower | Primary Petal Color | Accent |
|---|---|---|
| Rose | `#E8637A` | `#C2334F` |
| Tulip | `#F4A44E` | `#D4722A` |
| Sunflower | `#F5D03B` | `#39AB54` |
| Daisy | `#FFFFFF` | `#F5D03B` |
| Lavender | `#B09FD8` | `#7B6CB5` |

### Growth Stage Visual Language

| Stage | Description | Model Scale | Bloom % |
|---|---|---|---|
| 0 — Seed | Small brown mound in soil | 0.3 | 0% |
| 1 — Sprout | Tiny green shoot, two leaves | 0.5 | 0% |
| 2 — Bud | Stem visible, bud forming | 0.75 | 30% |
| 3 — Opening | Petals just starting to open | 0.9 | 70% |
| 4 — Full Bloom | Fully open, glowing, particles | 1.0 | 100% |

### Camo Pattern System (CSGO Mechanic)
- 5 texture patterns per flower type, stored as UV maps
- `pattern_offset_x` and `pattern_offset_y` are float values (0.0–1.0) stored in DB at flower creation
- Applied as UV transforms in R3F via `useTexture` + custom shader uniform
- Values are permanent — never regenerated after creation
- Result: every flower has a unique skin even with same type + pattern

### Garden Scene
- Background: soft gradient sky — `#D4EED8` → `#F7F2EA` (day) / `#1A2318` → `#243020` (night)
- Ground: flat plane with grass texture
- Lighting: `ambientLight` (soft, `intensity: 0.4`) + `directionalLight` (sun angle, `intensity: 0.8`)
- Camera: slightly above, angled down — isometric feel
- Flowers arranged in a 3×4 grid, each with slight random Y rotation for natural look

---

## Page-by-Page Design Direction

### Landing Page
- Hero: large Lora serif headline over a soft animated gradient mesh (green tones)
- Show a bloomed 3D flower (canvas) rotating slowly in the hero
- CTA button: "Plant Your First Flower" — primary green pill
- Minimal — let the 3D flower do the talking

### Upload Page (`/upload`)
- Card-based layout, centered
- Drag-and-drop zone with a dashed border and seed icon
- Flower type selector: 5 cards with preview of each flower type (small 3D or illustrated)
- Topic name input + "Choose your seed" metaphor in copy

### Unit Viewer (`/flower/[id]/units/[unitId]`)
- Left panel: unit content (text, highlighted terms, Mermaid diagram)
- Right panel (or bottom on mobile): audio player + key terms list
- Progress indicator at top: unit N of N
- "Start Quiz" sticky CTA at bottom

### Quiz Page (`/flower/[id]/quiz/[quizId]`)
- Clean, focused — one question at a time
- MC: 4 option cards in a 2×2 grid
- Short answer: large textarea with character count
- Growth progress bar visible at top (shows how close to next stage)
- Confetti / particle burst on correct answer

### Garden View (`/garden`)
- Full-width R3F canvas
- Isometric grid of all flowers
- Click a flower → card popup with topic name, score stats, "Resume studying" CTA
- Empty state: single seed in soil, "Upload your first lecture" CTA

---

## Animation Principles

1. **Growth stage transition** — GSAP scale tween (0.8 → 1.0) + particle burst emitting from flower center on stage up
2. **Quiz correct answer** — spring bounce on the correct card + green fill sweep
3. **Page transitions** — fade in (opacity 0 → 1, 200ms) with slight upward drift (translateY 8px → 0)
4. **Hover states** — subtle lift (translateY -2px) on all interactive cards, 150ms ease
5. **Audio waveform** — animated bars while TTS plays (CSS keyframe, 3 bars)
6. **Bloom celebration** — full-screen particle overlay when flower reaches Stage 4, hold for 2s

---

## Accessibility

- All interactive elements must have `aria-label`
- Color contrast: minimum 4.5:1 for body text, 3:1 for large text
- Keyboard navigable: Tab order logical through upload → unit → quiz
- Alt text on all images and 3D canvas: `aria-label="3D model of [flower type] at growth stage [N]"`
- Audio player has accessible controls (play/pause/scrub)
- Quiz answers are keyboard selectable (Enter to confirm)

---

## Design Anti-Patterns (DO NOT)

- ❌ Purple gradients on white backgrounds
- ❌ Inter or Roboto as the primary font
- ❌ Generic card grid with no visual hierarchy
- ❌ Blue primary action buttons (this is Bloomr, it's green)
- ❌ Sharp corners (border-radius: 0 or 4px) — use organic rounding
- ❌ Dense information without breathing room — generous padding always
- ❌ Placeholder 3D that doesn't animate — even a slow rotation matters
