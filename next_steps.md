# Bloomr — Next Steps

Work through these tasks in order. Do not skip ahead. Mark each `[ ]` as `[x]` when complete.

---

## 1. Remake 3D Flower Models
- [ ] Use the `generate-3d-model` skill
- [ ] Reference images are in `/design/flowers`
- [ ] There are 5 new flower types — generate one model per flower
- [ ] Replace all existing flower models with the new ones
- [ ] Update all references to flower type names/models throughout the codebase

---

## 2. Remake 3D Pot Models
- [ ] Use the `generate-3d-model` skill
- [ ] Reference images are in `/design/pots`
- [ ] Generate one model per pot design shown in the reference images
- [ ] Replace all existing pot models with the new ones

---

## 3. AI Tutor Chat Box in Flower Section
- [ ] Add a persistent chat panel on the right side of the flower detail page (`/flower/[id]`)
- [ ] The tutor has full context of the flower's topic and all unit content
- [ ] Users can ask any question about the lecture/topic and receive answers grounded in the uploaded material
- [ ] Chat is scoped per flower — context does not bleed between different flowers

---

## 4. Improve Onboarding — Learner Profile
- [ ] The onboarding flow runs immediately after a user signs up for the first time
- [ ] It must identify:
  - Whether the user is a **Visual Learner** — increases emphasis on Mermaid diagrams and visual aids in generated content
  - Whether the user is an **ESL Learner** — simplifies language, reduces complexity, avoids idioms in all AI-generated content
- [ ] Learner profile answers must be stored and injected into every OpenAI content generation prompt
- [ ] Existing onboarding steps should be reviewed and consolidated with these new requirements — remove redundancy

---
## 5. Switch LLM from Gemini to OpenAI
- [ ] Replace all Gemini API calls with OpenAI equivalents
- [ ] The OpenAI API key is already set in `.env.local`
- [ ] Update `POST /api/gemini/process` — rename route and replace implementation
- [ ] Update `POST /api/grade` — replace Gemini grading with OpenAI
- [ ] Remove all Gemini SDK imports and dependencies
- [ ] Update `CLAUDE.md` and any references to Gemini in the codebase

---

## 6. Fix: Quiz Growth Stage Updates Immediately
- [ ] The flower `growth_stage` must update in the UI the moment a quiz is passed — no page refresh required
- [ ] Remove the "Your flower grew" notification that appears after quiz completion
- [ ] Growth stage change should be reflected live in all relevant UI (flower detail, garden)

---

## 7. Fix: Gacha Animation Accuracy
- [ ] The gacha pot-drop animation on mastery completion must accurately reflect the actual rarity that was rolled
- [ ] The revealed rarity must match what is stored in the DB for that flower
- [ ] Improve the visual quality and feel of the gacha animation sequence

---

## 8. Random Pot Color + Hex Display
- [ ] When a pot is assigned to a flower, its color is randomly generated
- [ ] The hex code of the assigned pot color is stored in the `flowers` table
- [ ] The hex code is displayed visibly in the flower detail section
- [ ] change the offset thingy for pot rarity, no, make it strreamlined and just use random number generatore, the new odds for each rarity (50% - common, 25% - uncommon, 15% - rare, 9% - epic, 1% - legendary)
