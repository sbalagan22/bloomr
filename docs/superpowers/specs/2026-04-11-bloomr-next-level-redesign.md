# Bloomr — "Next-Level" Redesign Spec
**Date:** 2026-04-11  
**Status:** Approved  
**Approach:** Option A (Hybrid — CSS sky on 2D pages, Three.js `<Sky>` on Garden)

---

## Overview

A comprehensive, production-grade overhaul of Bloomr across five phases:
1. Landing page — "Dreamland" sky aesthetic, university marquee, section redesigns
2. Garden — world-class 3D environment, terrain, fog, editor bird's-eye, frosted list
3. Flower Detail & Upload Preview — sky landscape behind every 3D view
4. Rarity rename, pity system, multi-variant pots, flower emoji icons
5. Frosted pill navbar with profile/avatar dropdown + Stripe portal

### Shared Aesthetic (all surfaces)
Sky gradient: `white (top) → #BDE0F5 (cloud zone) → #5AB4E5 (mid sky) → #3E9FD5 (horizon)`.  
Two cloud image layers (`clouds_1.png`, `clouds_2.png`) animate horizontally at different speeds.  
Bottom: grassy SVG hill silhouette in `#39AB54`.  
Every surface must feel like one continuous world.

---

## Phase 1 — Landing Page

### 1.1 Background
- Remove parchment (`bg-parchment`) and ambient blob divs entirely.
- Apply sky gradient as the root `<div>` background: `background: linear-gradient(to bottom, #FFFFFF 0%, #BDE0F5 25%, #5AB4E5 55%, #3E9FD5 80%, #4CAF60 100%)`.
- Layer `clouds_1.png` as a `fixed` element (z-1), animated: `@keyframes drift-slow { from { transform: translateX(0) } to { transform: translateX(-50%) } }` — 60s linear infinite. Width `200%` so it loops seamlessly.
- Layer `clouds_2.png` same technique at 90s (faster drift layer, higher opacity).
- SVG hill strip at the bottom of the hero section: a gentle arc from left edge to right edge, filled `#39AB54`, overlapping the content start.

### 1.2 Hero Section
- **Background integration:** The `HeroFlower` canvas gets `style={{ background: 'transparent' }}` and the rounded box container (`rounded-[3rem]`) is removed. The flower floats directly in the sky world.
- **Idle spin + drag:** Already implemented — no changes to `hero-flower.tsx` or `flower-3d.tsx` interactive logic.
- **Layout:** Keep existing left-text / right-flower split. Left text stays unchanged (motto + CTA). Remove the glow-pulse rounded box around the canvas.
- **Hint badge:** Keep the "Drag to interact" badge anchored bottom-right of the canvas.

### 1.3 Growth Cycle Redesign
- Replace the horizontal-line timeline with an S-curve organic flow on desktop.
- Each of the 4 steps becomes a card: large colored circular icon (watercolor-style `bg-opacity-20` circle in step color), bold step number, title, description.
- Desktop: steps 1 & 3 sit slightly higher (`translateY(-20px)`), steps 2 & 4 slightly lower (`translateY(20px)`), connected by a subtle curved SVG path in the brand green.
- Mobile: vertical stack with a straight line connector.

### 1.4 What's Included Cards
- Existing 3-column grid kept.
- Add micro-animations on `group-hover`: icon floats `-translate-y-1`, card gets `rotate-1`, colored `ring-2` border glow in the feature's accent color.
- No additional libraries.

### 1.5 Pricing Section
- Two-card layout kept.
- Pro card border gets a `shimmer` keyframe animation cycling a white highlight around the border.
- Free card CTA: add `hover:shadow-lg` with green tint.
- Add a subtle "Cancel anytime" reassurance line below the Pro CTA (already present — keep).

### 1.6 University Marquee (NEW)
**Component:** `src/components/university-marquee.tsx`  
**Placement:** Between `<PricingSection />` and the footer `<CTA section>`.

**Logos (official CDN URLs, grayscale → color on hover):**
| University | Logo URL |
|---|---|
| University of Toronto | `https://www.utoronto.ca/sites/default/files/UofT_Logo.svg` |
| University of Waterloo | `https://uwaterloo.ca/brand/sites/ca.brand/files/uploads/images/universityofwaterloo_logo_horiz_rgb.png` |
| UBC | `https://brand.ubc.ca/files/2018/09/UBC-logo-2018-crest-only-blue-rgb72.png` |
| McGill | `https://www.mcgill.ca/files/mcgill-logo.png` |
| Harvard | `https://www.harvard.edu/wp-content/uploads/2022/01/harvard-logo.svg` |
| MIT | `https://web.mit.edu/graphicidentity/images/mit-logo.svg` |
| Caltech | `https://www.caltech.edu/sites/default/files/2021-01/caltech-logo.svg` |
| Stanford | `https://identity.stanford.edu/wp-content/uploads/sites/3/2020/07/block-s-right.png` |
| Carnegie Mellon | `https://www.cmu.edu/marcom/brand-standards/images/logos-colors-type/wordmark_660x80.png` |
| Oxford | `https://www.ox.ac.uk/sites/files/oxford/styles/ow_medium_feature/s3/field/field_image_main/oxford-logo.png` |

**Implementation:**
- Duplicate the logo row to create a seamless loop: `[logos] [logos]`.
- CSS animation: `@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }` at 30s linear infinite.
- Each logo: `<Image>` or `<img>`, height 28px, `filter: grayscale(100%)`, transition to `filter: grayscale(0%)` on hover.
- Section header: `"Trusted by students at top schools"` — small all-caps tracking-widest label above the strip.

---

## Phase 2 — Garden View

### 2.1 Sky & Atmosphere
- Set `<Canvas>` background to transparent; root container background uses the CSS sky gradient.
- Inside the Canvas, add `<Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />` from `@react-three/drei`.
- Add `<fog attach="fog" args={['#BDE0F5', 20, 60]} />` for atmospheric depth haze.
- Add `<ambientLight intensity={1.0} />` and `<directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />`.
- Add 3–4 `<Cloud>` components from drei at varying positions (y=12–18, scattered x/z) for 3D cloud puffs.

### 2.2 Terrain
- Replace flat grass `<planeGeometry args={[30, 30]} />` with `<planeGeometry args={[80, 80, 50, 50]} />` (subdivided).
- Apply `onUpdate={(geom) => { /* vertex displacement shader */ }}` — iterate vertices, apply `Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.3` height offset for organic undulation.
- Material: `<meshStandardMaterial color="#4CAF60" roughness={1} />`.
- Remove outer grey pavement plane entirely.

### 2.3 Perimeter (Hedges)
- Remove all box-geometry fence meshes (`FencePerimeter` component).
- Replace with `<HedgePerimeter>`: 4 sides, each a row of `<mesh>` with `<boxGeometry args={[2, 1.2 + random*0.3, 1.2]} />`, material `<meshStandardMaterial color="#1A6830" roughness={0.9} />`, spaced every 2 units.
- Slight Y-rotation variation per hedge unit for an organic hedge feel.

### 2.4 Editor Mode — Bird's Eye Camera
- Add a `useRef<THREE.PerspectiveCamera>` for the camera.
- On `isEditorMode` toggle, use `useFrame` to lerp `camera.position` to `[0, 28, 0.1]` over ~40 frames (smooth transition, not instant).
- `OrbitControls` in editor mode: `enableRotate={false}`, `enablePan={true}`, `maxPolarAngle={Math.PI / 6}` (locks overhead).
- On editor mode exit, lerp camera back to `[0, 10, 20]`.
- Implement via a `<CameraController isEditorMode={isEditorMode} />` child component inside the Canvas.

### 2.5 List View Redesign
- Replace `bg-white/95` panel with `bg-white/10 backdrop-blur-2xl border border-white/30 ring-1 ring-white/20`.
- Header: `font-heading` flower name in white, muted white/70 subtitle.
- Each flower row: frosted card `bg-white/15 hover:bg-white/25`, species emoji + name + growth pill.
- Status indicator: green pulsing dot `animate-pulse bg-[#39AB54]` for bloomed, grey dot for growing.
- Remove the `bg-[#faf8f4]/50` scrollable area background — let backdrop-blur show through.

---

## Phase 3 — Flower Detail & Upload Preview

### 3.1 Flower Detail Page (`/flower/[id]`)
- Add a full-bleed `<Canvas>` fixed background (positioned `absolute inset-0 z-0`).
- Inside: `<Sky>` + `<fog>` + small grass plane `<planeGeometry args={[20, 20]} />` at y=-0.6 + the flower's `<FlowerModel>` centered at origin.
- `<OrbitControls enableRotate autoRotate autoRotateSpeed={0.8} enableZoom={false} enablePan={false} />` — gentle auto-spin, no user control (purely ambient).
- All existing 2D panels (units list, weak areas, chat tutor) become glassmorphism cards: `bg-white/15 backdrop-blur-2xl border border-white/25 rounded-3xl`.
- The page background color changes from whatever it is currently to `transparent` (canvas shows through).

### 3.2 Upload Preview (`/upload`)
- The existing `<Flower3D>` canvas (right panel) gets a sky gradient background via inline `style` on its wrapper div: `background: linear-gradient(to bottom, #BDE0F5, #5AB4E5)`.
- Inside the canvas, add a simple grass plane `<mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.6,0]}><planeGeometry args={[10,10]} /><meshStandardMaterial color="#4CAF60" roughness={1} /></mesh>`.
- **Pot variant arrows (NEW):** Below the rarity selector tabs, add a `<PotVariantSelector>` strip: `← [Pot Name / variant X of N] →`. Left/right `<button>` arrows cycle `previewVariant` state (1-indexed, clamped to max variants for that rarity). The Flower3D component receives `potVariant={previewVariant}` and builds the GLB URL dynamically.

---

## Phase 4 — Rarity, Pity, Pots & Icons

### 4.1 Rarity Rename

**New type:**
```ts
export type Rarity = "basic" | "vintage" | "rare" | "antique" | "relic";
```

**New RARITIES map:**
| Key | Display Name | Drop Rate | Color |
|---|---|---|---|
| basic | Basic | 40% | #9CA3AF (grey) |
| vintage | Vintage | 30% | #3B82F6 (blue) |
| rare | Rare | 15% | #8B5CF6 (purple) |
| antique | Antique | 10% | #EC4899 (pink) |
| relic | Relic | 5% | #F59E0B (amber) |

**DB migration (via Supabase MCP):**
```sql
UPDATE flowers 
SET pot_rarity = CASE 
  WHEN pot_rarity = 'common'    THEN 'basic'
  WHEN pot_rarity = 'uncommon'  THEN 'vintage'
  WHEN pot_rarity = 'rare'      THEN 'rare'
  WHEN pot_rarity = 'epic'      THEN 'antique'
  WHEN pot_rarity = 'legendary' THEN 'relic'
  ELSE pot_rarity 
END
WHERE pot_rarity IN ('common','uncommon','rare','epic','legendary');
```

**Update all TypeScript references** across: `rarity.ts`, `flower-3d.tsx`, `gacha-opener.tsx`, `upload/page.tsx`, `garden/page.tsx`, `flower/[id]/page.tsx`, `api/process/route.ts`.

### 4.2 Pity System

**DB change:** Add `pity_count INT NOT NULL DEFAULT 0` to `learner_profiles` via migration.

**Server-side logic (in `/api/process/route.ts` where pot is rolled):**
```
1. Fetch learner_profile.pity_count for the user
2. Roll rarity using rollRarity()
3. If pity_count >= 9 (10th plant) AND result is not 'antique' or 'relic':
   → Override result = 'antique'
   → SET pity_count = 0
4. Else if result IS 'antique' or 'relic':
   → SET pity_count = 0
5. Else:
   → SET pity_count = pity_count + 1
6. Save updated pity_count to learner_profiles
```

### 4.3 Diverse Pots

**DB change:** Add `pot_variant INT NOT NULL DEFAULT 1` to `flowers`.

**Variants per rarity:**
| Rarity | Variants | GLB files |
|---|---|---|
| basic | 1 | pot_common_1.glb |
| vintage | 1 | pot_uncommon_1.glb |
| rare | 2 | pot_rare_1.glb, pot_rare_2.glb |
| antique | 2 | pot_epic_1.glb, pot_epic_2.glb |
| relic | 3 | pot_legendary_1.glb, pot_legendary_2.glb, pot_legendary_3.glb |

**GLB URL mapping (in `flower-3d.tsx`):**
```ts
const POT_RARITY_FILE_PREFIX: Record<Rarity, string> = {
  basic:   "pot_common",
  vintage: "pot_uncommon",
  rare:    "pot_rare",
  antique: "pot_epic",
  relic:   "pot_legendary",
};
// URL: `/models/pots/${POT_RARITY_FILE_PREFIX[rarity]}_${variant}.glb`
```

**Random variant assignment on roll (in `/api/process/route.ts`):**
```ts
const VARIANT_COUNTS: Record<Rarity, number> = {
  basic: 1, vintage: 1, rare: 2, antique: 2, relic: 3
};
const variant = Math.floor(Math.random() * VARIANT_COUNTS[rarity]) + 1;
```

**`FlowerModel` / `Flower3D` props:** Add `potVariant?: number` (default 1).  
**`FlowerModel` in garden:** reads `flower.pot_variant` from DB.  
**Upload preview:** `previewVariant` state, controlled by arrows.

### 4.4 Flower Emoji Icons

Replace custom SVG components in `flower-icons.tsx` with a simple emoji string map:

```ts
export const FLOWER_EMOJI_MAP: Record<string, string> = {
  rose:      "🌹",
  tulip:     "🌷",
  sunflower: "🌻",
  daisy:     "🌼",
  lily:      "🌸",
  lavender:  "🪻",
};
```

Keep `FLOWER_ICON_MAP` as a backward-compat alias that returns a `<span>` wrapper around the emoji.

**Update usages:**
- Upload species selector grid: use emoji in the selection button.
- Garden list view: use emoji as the flower icon.
- Any other reference to `SunflowerIcon`, `TulipIcon`, etc.

---

## Phase 5 — Navbar & Profile Dropdown

### 5.1 Navbar Visual Refinements
- `backdrop-blur-xl` → `backdrop-blur-2xl`
- `border border-white/50` → `border border-white/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]`
- `py-3` → `py-3.5` on the nav pill inner padding
- Add `hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]` for lift effect on scroll/hover

### 5.2 Profile Avatar Button
- **Placement:** Rightmost item in the nav, replacing the inline sign-out button.
- **Avatar:** Fetch user from `supabase.auth.getUser()`. If user has `user_metadata.avatar_url`, show `<Image>` circle. Otherwise show the user's initial in a styled `<span>` (`bg-[#39AB54] text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm`).
- **Component:** Uses `shadcn/ui` `<DropdownMenu>` (already scaffolded at `src/components/ui/dropdown-menu.tsx`) and `<Avatar>` (`src/components/ui/avatar.tsx`).

### 5.3 Dropdown Menu Items
```
[Avatar trigger]
  ↓
[Dropdown portal]
  ├── [user email — muted, non-interactive]  
  ├── ─────────────────────
  ├── Sign out  (existing handleSignOut logic)
  └── Manage subscription  (only shown if plan === 'pro')
       → GET /api/stripe/portal → redirects to Stripe Customer Portal URL
```

**Manage subscription implementation:**
```ts
async function handleManageSubscription() {
  const res = await fetch('/api/stripe/portal');
  const { url } = await res.json();
  window.location.href = url;
}
```
The `/api/stripe/portal` route already exists — verify it returns `{ url }`.

---

## Data Model Changes Summary

| Table | Change |
|---|---|
| `flowers` | Add `pot_variant INT NOT NULL DEFAULT 1` |
| `learner_profiles` | Add `pity_count INT NOT NULL DEFAULT 0` |
| `flowers.pot_rarity` | Migrate values: common→basic, uncommon→vintage, epic→antique, legendary→relic |

---

## File Change Map

| File | Change |
|---|---|
| `src/app/page.tsx` | Sky BG, remove blobs, add cloud layers, hill SVG, university marquee |
| `src/components/university-marquee.tsx` | NEW — marquee component |
| `src/app/(protected)/garden/page.tsx` | Sky Canvas setup, terrain, hedges, CameraController, list redesign |
| `src/app/(protected)/flower/[id]/page.tsx` | Canvas BG, glassmorphism panels |
| `src/app/(protected)/upload/page.tsx` | Sky canvas wrapper, PotVariantSelector arrows |
| `src/components/flower-3d.tsx` | Dynamic GLB URL with variant, accept potVariant prop |
| `src/components/nav-bar.tsx` | Avatar + DropdownMenu, remove inline sign-out |
| `src/components/flower-icons.tsx` | Replace SVGs with emoji map |
| `src/lib/rarity.ts` | New type, new names, new drop rates |
| `src/app/api/process/route.ts` | Pity logic, variant roll, new rarity keys |
| DB migration | pot_variant, pity_count columns + rarity value rename |

---

## Constraints & Non-Goals
- Do not touch quiz logic, unit content generation, TTS, or Mermaid diagram rendering.
- Do not change the auth flow, onboarding, or mastery page.
- Mobile-first: every new component must be tested at 375px width.
- No new npm packages unless strictly necessary (drei's `<Sky>` and `<Cloud>` are already available).
