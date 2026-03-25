# Antigravity Changelog
*A comprehensive record of all systems, features, and engine upgrades implemented by Antigravity since the initial Claude codebase handoff.*

---

## 🚀 Native AI Integrations

### 1. **Gemini API PDF Processor (`/api/gemini/process/route.ts`)**
- Wired up `gemini-2.5-flash` to accept uploaded PDFs and parse them into highly structured JSON schemas.
- The AI dynamically chunks content based on lecture length, assigning proportional unit counts (1-10) and multiple-choice/short-answer questions.
- Automatically detects and wraps mathematics in native `$LaTeX$` strings for frontend rendering.
- Reads the active user's `learner_profile` (language, ADHD preferences, etc.) and injects it into the system prompt to natively tailor the curriculum phrasing.

### 2. **Gemini Essay Auto-Grader (`/api/grade/route.ts`)**
- Built an instantaneous AI grading engine for Short Answer quizzes.
- Gemini receives the source text and the user's raw string answer, strictly comparing conceptual understanding over exact keyword matching.
- Returns a boolean pass/fail and a 2-sentence encouraging feedback string natively displayed in the UI.

### 3. **ElevenLabs TTS Engine (`/api/tts/route.ts`)**
- Integrated high-fidelity ElevenLabs API streams.
- Built a custom `<AudioPlayer />` component that plays localized narrations of the AI's parsed lecture notes.

---

## 🎨 3D Engine & Physics (React-Three-Fiber)

### 1. **10x10 Physics Garden (`/garden`)**
- Scrapped the free-falling physics model. Built a strict **10x10 invisible mathematical snapping grid** to strictly control garden placement.
- Added strict overlap prevention: dragging a flower over an occupied grid tile instantly rejects the drop and bounces the flower back.
- Built procedural wooden perimeter fencing spanning the 10x10 bounds to box in the interactive grass plane.
- Dropped a massive flat pebble/stone pavement plane beneath the garden to lock in the aesthetics.

### 2. **Procedural Flower Geometry & CS:GO Pots**
- Migrated 3D handling to accept standard `.glb` mesh models.
- **Stage Drops:** Implemented the Stage 4 "Full Bloom" ceramic Pot mechanic. The pot mesh is hidden natively during growth stages 0-3.
- **CS:GO Pattern Overlays:** Rebuilt the `Flower3D` fragment material. Pots receive a mathematically unique pattern-offset drop (Common, Uncommon, Rare, Legendary) that dynamically moves the texture wrapping over the pot natively on spawn. 

### 3. **Grid Spawning Automation**
- Wrote algorithms that natively scan the user's garden database during the Gemini Upload phase. New flowers actively seek out the first completely empty `[pos_x, pos_z]` coordinate nearest to `[0,0]` and assign themselves there to guarantee zero overlap on generation.

---

## 💻 UI / UX Rebuilds

### 1. **Interactive Pot Upload Previews (`/upload`)**
- Overhauled the Upload screen sequence logic. 
- Integrated a live **Pot Drops Preview** interactive dashboard. Users can click on different rarities (e.g. "Legendary CSGO") to instantly live-preview the exact offset mathematics applied directly to the 3D model in real time.

### 2. **Dedicated Math Mode (`/flower/[id]/quiz/[unitId]`)**
- Added a `react-katex` math engine inside the short-answer quiz form.
- Brought in a toggleable `Math Mode` button that slides down a real-time live preview window. Any `$LaTeX$` code a user types (e.g., `\frac{1}{2}`) is instantly rendered beautifully underneath before they hit submit!

### 3. **Fluid Study Layout (`/flower/[id]/units/[unitId]`)**
- Scrapped the generic 2-column sidebar UI.
- Built a highly optimized purely vertical "Scrolling Read" layout flow:
  1. `Top:` Lesson text and Audio Player
  2. `Middle:` Massive edge-to-edge interactive Mermaid.js Concept Map diagram
  3. `Bottom:` Responsive Horizontal grid flow for Vocabulary Key Terms.
- Switched UI indexing from boring "Unit 1, Unit 2" labels to contextual `Chapter 1: [Topic]` rich names on the sidebars.

### 4. **Cascading Architecture Fixes**
- Unblocked major Supabase SQL database foreign key constraints.
- Wrote robust client-side `handleDelete` multi-step cascades. If a user deletes a flower, the codebase silently scrubs the `quizzes` table and the `units` table mapping *before* completing the flower deletion perfectly cleanly.
- Downgraded `three` to v0.169.0 flawlessly fixing terminal warnings across the build.
- Achieved a perfectly clean `npm run lint` typescript status.
