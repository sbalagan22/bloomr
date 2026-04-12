# Bloomr Next-Level Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Bloomr from a functional MVP into a premium, visually breathtaking app — unified sky-and-grass world across all surfaces, renamed rarity system with pity mechanic, multi-variant pots, emoji flower icons, and a polished navbar with profile dropdown.

**Architecture:** Hybrid CSS+Three.js sky — CSS gradient+cloud-image layers on 2D pages (Landing, Upload panel, Flower Detail layout), `@react-three/drei`'s `<Sky>` + `<Clouds>` inside the Garden Canvas. Rarity system is a full rename (common→basic etc.) across DB + TypeScript. Pity counter lives in `learner_profiles`, variant number in `flowers`.

**Tech Stack:** Next.js 16 App Router, React Three Fiber v9, @react-three/drei v10.7.7, Three.js v0.169, Tailwind v4, Supabase (DB + Storage), Stripe Customer Portal

---

## File Map

| File | Role |
|---|---|
| `src/lib/rarity.ts` | Rarity type, drop rates, roll function — ground truth |
| `src/components/flower-3d.tsx` | 3D flower+pot renderer — gets dynamic pot URL, showGround, background props |
| `src/components/flower-icons.tsx` | Species icons — replace SVGs with emoji |
| `src/components/nav-bar.tsx` | Protected navbar — add avatar dropdown |
| `src/components/university-marquee.tsx` | NEW — CSS marquee of university logos |
| `src/app/page.tsx` | Landing page — sky BG, cloud layers, sections, marquee |
| `src/app/(protected)/garden/page.tsx` | Garden 3D — Sky, terrain, hedges, CameraController |
| `src/app/(protected)/flower/[id]/layout.tsx` | Flower layout — sky CSS background, glassmorphism |
| `src/app/(protected)/upload/page.tsx` | Upload — sky canvas wrapper, pot variant arrows |
| `src/app/api/process/route.ts` | POST handler — pity logic + pot_variant roll |
| `src/components/gacha-opener.tsx` | Gacha reveal — update old rarity strings + flavor text |
| `src/app/(protected)/flower/[id]/mastery/page.tsx` | Mastery — update rarity fallback |
| `src/app/flower/demo/page.tsx` | Demo — update hardcoded rarity |
| `src/app/api/dev/auto-pass/route.ts` | Dev tool — update rarity references |
| `public/logos/` | NEW — self-hosted university logos (10 files) |

---

## Task 1: DB Migrations

**Files:**
- Modify: Supabase DB via MCP

### Step 1a: Add `pity_count` to `learner_profiles`

- [ ] Using Supabase MCP, run:
```sql
ALTER TABLE learner_profiles
ADD COLUMN IF NOT EXISTS pity_count INT NOT NULL DEFAULT 0;
```
Expected: migration applies without error.

### Step 1b: Add `pot_variant` to `flowers`

- [ ] Using Supabase MCP, run:
```sql
ALTER TABLE flowers
ADD COLUMN IF NOT EXISTS pot_variant INT NOT NULL DEFAULT 1;
```
Expected: migration applies without error.

### Step 1c: Rename rarity values in `flowers`

- [ ] Using Supabase MCP, run:
```sql
UPDATE flowers
SET pot_rarity = CASE
  WHEN pot_rarity = 'common'    THEN 'basic'
  WHEN pot_rarity = 'uncommon'  THEN 'vintage'
  WHEN pot_rarity = 'epic'      THEN 'antique'
  WHEN pot_rarity = 'legendary' THEN 'relic'
  ELSE pot_rarity
END
WHERE pot_rarity IN ('common','uncommon','epic','legendary');
```
Note: `'rare'` rows are intentionally left unchanged — the mid-tier key stays `'rare'`.

- [ ] Verify with a count query:
```sql
SELECT pot_rarity, COUNT(*) FROM flowers GROUP BY pot_rarity;
```
Expected: only `basic`, `vintage`, `rare`, `antique`, `relic` (and NULL) — no `common`, `uncommon`, `epic`, `legendary`.

- [ ] Commit: `git commit -m "feat: add pity_count, pot_variant columns; rename rarity values in DB"`

---

## Task 2: Rarity System — Core Type + All TypeScript References

**Files:**
- Modify: `src/lib/rarity.ts`
- Modify: `src/components/gacha-opener.tsx`
- Modify: `src/app/(protected)/flower/[id]/layout.tsx`
- Modify: `src/app/(protected)/flower/[id]/mastery/page.tsx`
- Modify: `src/components/hero-flower.tsx`
- Modify: `src/app/flower/demo/page.tsx`
- Modify: `src/app/api/dev/auto-pass/route.ts`

### Step 2a: Update `src/lib/rarity.ts`

- [ ] Replace the entire file content:
```typescript
export type Rarity = "basic" | "vintage" | "rare" | "antique" | "relic";

export interface RarityConfig {
  name: string;
  color: string;
  glowColor: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dropRate: number;
}

export const RARITIES: Record<Rarity, RarityConfig> = {
  basic: {
    name: "Basic",
    color: "#9CA3AF",
    glowColor: "#9CA3AF",
    bgClass: "bg-gray-100",
    borderClass: "border-gray-300",
    textClass: "text-gray-500",
    dropRate: 40,
  },
  vintage: {
    name: "Vintage",
    color: "#3B82F6",
    glowColor: "#60A5FA",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-500",
    dropRate: 30,
  },
  rare: {
    name: "Rare",
    color: "#8B5CF6",
    glowColor: "#A78BFA",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    textClass: "text-purple-600",
    dropRate: 15,
  },
  antique: {
    name: "Antique",
    color: "#EC4899",
    glowColor: "#F472B6",
    bgClass: "bg-pink-50",
    borderClass: "border-pink-200",
    textClass: "text-pink-500",
    dropRate: 10,
  },
  relic: {
    name: "Relic",
    color: "#F59E0B",
    glowColor: "#FBBF24",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-500",
    dropRate: 5,
  },
};

export const RARITY_ORDER: Rarity[] = [
  "basic",
  "vintage",
  "rare",
  "antique",
  "relic",
];

/** Roll a random rarity based on drop rates (40/30/15/10/5) */
export function rollRarity(): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += RARITIES[rarity].dropRate;
    if (roll < cumulative) return rarity;
  }
  return "basic";
}

/** Generate a random hex color string */
export function randomHexColor(): string {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}
```

### Step 2b: Update `gacha-opener.tsx`

- [ ] Change `useState<Rarity>("common")` → `useState<Rarity>("basic")`
- [ ] Update flavor text strings (the `finalRarity ===` comparisons):
  - `"legendary"` → `"relic"`
  - `"epic"` → `"antique"`
  - `"uncommon"` → `"vintage"`
  - Keep `"rare"` unchanged
  - New flavor text mapping:
    ```
    relic:   "UNBELIEVABLE! A mythical Relic appears!"
    antique: "Incredible Antique detail. What a lucky drop!"
    rare:    "A beautiful Rare pedestal-style pot!"
    vintage: "A lovely Vintage round belly pot."
    basic:   "Classic Basic terracotta style."
    ```
- [ ] In the glow condition (line ~145): `finalRarity === "legendary" || finalRarity === "epic"` → `finalRarity === "relic" || finalRarity === "antique"`

### Step 2c: Update `flower/[id]/layout.tsx`

- [ ] Replace the rarity cast on the `<Flower3D>` prop:
  ```tsx
  // Before:
  rarity={(flower.pot_rarity as "common" | "uncommon" | "rare" | "epic" | "legendary") ?? "common"}
  // After:
  rarity={(flower.pot_rarity as Rarity) ?? "basic"}
  ```
- [ ] Add import: `import { type Rarity } from "@/lib/rarity";`

### Step 2d: Update `flower/[id]/mastery/page.tsx`

- [ ] Find `?? "common"` rarity fallback → `?? "basic"`
- [ ] Find `as "common" | "uncommon" | "rare" | "epic" | "legendary"` → `as Rarity`
- [ ] Add `import { type Rarity } from "@/lib/rarity";` if not present

### Step 2e: Update `hero-flower.tsx`

- [ ] Change `rarity="epic"` → `rarity="antique"`

### Step 2f: Update `src/app/flower/demo/page.tsx`

- [ ] Change `pot_rarity: "legendary"` → `pot_rarity: "relic"`
- [ ] Update any other old rarity strings in the file

### Step 2g: Update `src/app/api/dev/auto-pass/route.ts`

- [ ] Find any `rollRarity()` calls or hardcoded rarity strings — these will automatically use the new values after rarity.ts update. Verify no hardcoded old strings.
- [ ] If any old strings exist (e.g. `"common"`, `"legendary"`), replace with new equivalents.

### Step 2h: TypeScript check

- [ ] Run: `npx tsc --noEmit`
- [ ] Expected: zero errors. Fix any remaining type errors.

### Step 2i: Commit

- [ ] `git commit -m "feat: rename rarity system — basic/vintage/rare/antique/relic, update all TS refs"`

---

## Task 3: Flower3D Component — Dynamic Pot URL, New Props

**Files:**
- Modify: `src/components/flower-3d.tsx`

### Step 3a: Replace `POT_GLB_URLS` with dynamic builder

- [ ] Remove the static `POT_GLB_URLS` constant.
- [ ] Add:
```typescript
const TINTABLE_RARITIES = new Set<Rarity>(["basic", "vintage", "rare"]);

const POT_RARITY_FILE_PREFIX: Record<Rarity, string> = {
  basic:   "pot_common",
  vintage: "pot_uncommon",
  rare:    "pot_rare",
  antique: "pot_epic",
  relic:   "pot_legendary",
};

const VARIANT_COUNTS: Record<Rarity, number> = {
  basic: 1, vintage: 1, rare: 2, antique: 2, relic: 3,
};

function getPotGLBUrl(rarity: Rarity, variant: number): string {
  const prefix = POT_RARITY_FILE_PREFIX[rarity];
  const clampedVariant = Math.max(1, Math.min(variant, VARIANT_COUNTS[rarity]));
  return `/models/pots/${prefix}_${clampedVariant}.glb`;
}
```

### Step 3b: Update `RarityPot` to use dynamic URL + variant

- [ ] Update `RarityPot` signature and implementation:
```typescript
function RarityPot({ rarity, potColor, potVariant = 1 }: { rarity: Rarity; potColor?: string; potVariant?: number }) {
  const url = getPotGLBUrl(rarity, potVariant);
  const colorOverride = TINTABLE_RARITIES.has(rarity) ? potColor : undefined;
  return (
    <Suspense fallback={null}>
      <PotGLBModel url={url} potColor={colorOverride} />
    </Suspense>
  );
}
```

### Step 3c: Update preload list to cover all variants

- [ ] Replace the static `forEach` preload with:
```typescript
// Preload all pot GLB variants
(["basic","vintage","rare","antique","relic"] as Rarity[]).forEach((rarity) => {
  for (let v = 1; v <= VARIANT_COUNTS[rarity]; v++) {
    useGLTF.preload(getPotGLBUrl(rarity, v));
  }
});
```

### Step 3d: Update `FlowerModel` props interface

- [ ] Add `potVariant?: number` to the `FlowerModelProps` interface (default `1`).
- [ ] Pass it through to `<RarityPot>`:
  ```tsx
  <RarityPot rarity={rarity} potColor={potColor} potVariant={potVariant ?? 1} />
  ```

### Step 3e: Update `Flower3D` wrapper props

- [ ] Add to `Flower3DProps`:
  ```typescript
  potVariant?: number;   // which pot variant to show (1-indexed)
  showGround?: boolean;  // render a grass plane inside the canvas
  background?: string;   // CSS background string for the canvas wrapper
  ```
- [ ] Pass `potVariant` through to `<FlowerModel>`.
- [ ] In the canvas wrapper `<div>`, apply `background` as inline style:
  ```tsx
  <div style={{ background: background ?? "transparent", width: ..., height: ... }}>
    <Canvas ...>
      ...
      {showGround && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#4CAF60" roughness={1} />
        </mesh>
      )}
    </Canvas>
  </div>
  ```

### Step 3f: Fix default rarity fallback

- [ ] Change any `rarity = "common"` or `?? "common"` defaults in `Flower3D`/`FlowerModel` to `"basic"`.

### Step 3g: TypeScript check + commit

- [ ] `npx tsc --noEmit` — zero errors expected.
- [ ] `git commit -m "feat: dynamic pot GLB URLs with variants, showGround/background props on Flower3D"`

---

## Task 4: Process API — Pity System + Variant Roll

**Files:**
- Modify: `src/app/api/process/route.ts`

### Step 4a: Fetch `pity_count` from learner profile

- [ ] The route already fetches `learner_profiles` around line 87–93. Extend the select to include `pity_count`:
```typescript
const { data: profile } = await supabase
  .from("learner_profiles")
  .select("primary_language, learning_style, preferences_json, pity_count")
  .eq("user_id", user.id)
  .single();
```

### Step 4b: Apply pity logic before flower insert

- [ ] Find the section around line 370 where `rollRarity()` is called. Replace it with:
```typescript
// --- Pity system + rarity roll ---
const currentPity = profile?.pity_count ?? 0;
let potRarity = rollRarity();

let newPity: number;
if (currentPity >= 9 && potRarity !== "antique" && potRarity !== "relic") {
  // Force antique on the 10th roll without a high-tier result
  potRarity = "antique";
  newPity = 0;
} else if (potRarity === "antique" || potRarity === "relic") {
  newPity = 0;
} else {
  newPity = currentPity + 1;
}

// Update pity_count if profile exists
if (profile) {
  await supabase
    .from("learner_profiles")
    .update({ pity_count: newPity })
    .eq("user_id", user.id);
}

// --- Variant roll ---
const VARIANT_COUNTS: Record<string, number> = {
  basic: 1, vintage: 1, rare: 2, antique: 2, relic: 3,
};
const potVariant = Math.floor(Math.random() * (VARIANT_COUNTS[potRarity] ?? 1)) + 1;
```

### Step 4c: Add `pot_variant` to the flower insert

- [ ] In the `flowers.insert({...})` call (around line 374–391), add:
```typescript
pot_variant: potVariant,
```

### Step 4d: Verify + commit

- [ ] `npx tsc --noEmit` — zero errors.
- [ ] `git commit -m "feat: pity system + pot_variant roll in process API"`

---

## Task 5: Navbar — Avatar Dropdown + Stripe Portal

**Files:**
- Modify: `src/components/nav-bar.tsx`
- Note: `src/components/ui/dropdown-menu.tsx` and `src/components/ui/avatar.tsx` already exist.

### Step 5a: Fetch user object for avatar

- [ ] Add a `useEffect` to load the user:
```typescript
const [user, setUser] = useState<{ email?: string; avatar_url?: string } | null>(null);

useEffect(() => {
  const supabase = createClient();
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      setUser({
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url,
      });
    }
  });
}, []);
```

### Step 5b: Add `handleManageSubscription`

- [ ] Add below `handleSignOut`:
```typescript
const handleManageSubscription = async () => {
  const res = await fetch('/api/stripe/portal', { method: 'POST' });
  const { url } = await res.json();
  if (url) window.location.href = url;
};
```

### Step 5c: Replace inline sign-out button with avatar dropdown

- [ ] Remove the existing `<button onClick={handleSignOut}>Sign out</button>` button.
- [ ] Add imports:
  ```typescript
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { PiUserBold } from "react-icons/pi";
  ```
- [ ] In place of the removed button, add:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="ml-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39AB54]">
      <Avatar className="w-9 h-9">
        {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Profile" />}
        <AvatarFallback className="bg-[#39AB54] text-white font-bold text-sm">
          {user?.email?.[0]?.toUpperCase() ?? <PiUserBold />}
        </AvatarFallback>
      </Avatar>
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-52">
    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
      {user?.email ?? "Account"}
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
      <PiSignOutBold className="mr-2 text-base" />
      Sign out
    </DropdownMenuItem>
    {plan === "pro" && (
      <DropdownMenuItem onClick={handleManageSubscription} className="cursor-pointer">
        <PiSparkle className="mr-2 text-base" />
        Manage subscription
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

### Step 5d: Navbar visual refinements

- [ ] On the `<nav>` element:
  - `backdrop-blur-xl` → `backdrop-blur-2xl`
  - `border border-white/50` → `border border-white/60`
  - Add class: `shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.35)]`
  - `py-3` → `py-3.5` (on the inner padding of the pill container)

### Step 5e: TypeScript check + commit

- [ ] `npx tsc --noEmit` — zero errors.
- [ ] Manual check: open the app, verify avatar shows, dropdown opens, sign out works.
- [ ] `git commit -m "feat: avatar profile dropdown with sign-out and manage subscription"`

---

## Task 6: Flower Icons — Emoji Replacement

**Files:**
- Modify: `src/components/flower-icons.tsx`

### Step 6a: Replace SVG components with emoji map

- [ ] Replace entire `flower-icons.tsx` content:
```typescript
/** Flower species emoji map and backward-compatible React component wrappers. */

interface IconProps {
  className?: string;
  color?: string;
}

export const FLOWER_EMOJI_MAP: Record<string, string> = {
  rose:      "🌹",
  tulip:     "🌷",
  sunflower: "🌻",
  daisy:     "🌼",
  lily:      "🌸",
  lavender:  "🪻",
};

/**
 * Backward-compatible map — each value is a React component function
 * so existing callsites using <IconComponent className="..." /> still work.
 */
export const FLOWER_ICON_MAP: Record<string, React.FC<IconProps>> = Object.fromEntries(
  Object.entries(FLOWER_EMOJI_MAP).map(([key, emoji]) => [
    key,
    function FlowerEmoji({ className = "w-10 h-10" }: IconProps) {
      return (
        <span
          className={`flex items-center justify-center leading-none select-none ${className}`}
          style={{ fontSize: "1.5em" }}
        >
          {emoji}
        </span>
      );
    },
  ])
);

// Named exports for any direct imports
export function RoseIcon(props: IconProps) { return FLOWER_ICON_MAP.rose(props); }
export function TulipIcon(props: IconProps) { return FLOWER_ICON_MAP.tulip(props); }
export function SunflowerIcon(props: IconProps) { return FLOWER_ICON_MAP.sunflower(props); }
export function DaisyIcon(props: IconProps) { return FLOWER_ICON_MAP.daisy(props); }
export function LilyIcon(props: IconProps) { return FLOWER_ICON_MAP.lily(props); }
```

### Step 6b: Update garden list view icons

- [ ] In `src/app/(protected)/garden/page.tsx`, find the list view where it renders `"🌸"` or `"🌱"` as static emoji. Replace with:
  ```tsx
  import { FLOWER_EMOJI_MAP } from "@/components/flower-icons";
  // ...
  <span className="text-2xl">{FLOWER_EMOJI_MAP[flower.flower_type?.toLowerCase()] ?? "🌱"}</span>
  ```

### Step 6c: TypeScript check + commit

- [ ] `npx tsc --noEmit` — zero errors.
- [ ] `git commit -m "feat: replace SVG flower icons with emoji, update garden list view"`

---

## Task 7: Landing Page — Sky World + Sections + Marquee

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css` (add marquee + drift keyframes)
- Create: `src/components/university-marquee.tsx`
- Add: `public/logos/` — 10 logo files (download during this task)

### Step 7a: Download and place university logos

- [ ] Download each logo from the university's official brand page and save to `/public/logos/`:
  - `uoft.svg` — University of Toronto
  - `waterloo.png` — University of Waterloo
  - `ubc.png` — UBC
  - `mcgill.png` — McGill
  - `harvard.svg` — Harvard
  - `mit.svg` — MIT
  - `caltech.svg` — Caltech
  - `stanford.png` — Stanford
  - `cmu.png` — Carnegie Mellon
  - `oxford.png` — Oxford
- [ ] Verify each file loads in a browser at `/logos/<filename>`.

### Step 7b: Add CSS keyframes to `globals.css`

- [ ] Add at the end of `src/app/globals.css`:
```css
/* Cloud drift animation */
@keyframes drift-slow {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes drift-fast {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-drift-slow {
  animation: drift-slow 60s linear infinite;
}
.animate-drift-fast {
  animation: drift-fast 90s linear infinite;
}

/* University marquee */
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
}

/* Pro card shimmer border */
@keyframes border-shimmer {
  0%, 100% { box-shadow: 0 0 0 2px rgba(255,255,255,0.1); }
  50%       { box-shadow: 0 0 0 2px rgba(255,255,255,0.45); }
}
.animate-border-shimmer {
  animation: border-shimmer 3s ease-in-out infinite;
}
```

### Step 7c: Create `university-marquee.tsx`

- [ ] Create `src/components/university-marquee.tsx`:
```tsx
import Image from "next/image";

const LOGOS = [
  { name: "University of Toronto", file: "uoft.svg",     ext: "svg" },
  { name: "University of Waterloo", file: "waterloo.png", ext: "png" },
  { name: "UBC",                   file: "ubc.png",       ext: "png" },
  { name: "McGill",                file: "mcgill.png",    ext: "png" },
  { name: "Harvard",               file: "harvard.svg",   ext: "svg" },
  { name: "MIT",                   file: "mit.svg",       ext: "svg" },
  { name: "Caltech",               file: "caltech.svg",   ext: "svg" },
  { name: "Stanford",              file: "stanford.png",  ext: "png" },
  { name: "Carnegie Mellon",       file: "cmu.png",       ext: "png" },
  { name: "Oxford",                file: "oxford.png",    ext: "png" },
];

export function UniversityMarquee() {
  const logoRow = LOGOS.map((logo) => (
    <div key={logo.name} className="shrink-0 px-8 flex items-center justify-center">
      <Image
        src={`/logos/${logo.file}`}
        alt={logo.name}
        width={120}
        height={28}
        className="h-7 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
        unoptimized={logo.ext === "svg"}
      />
    </div>
  ));

  return (
    <section className="py-20 overflow-hidden">
      <p className="text-center text-xs font-black tracking-[0.2em] uppercase text-on-surface-variant/50 mb-10">
        Trusted by students at top schools
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap" style={{ width: "200%" }}>
          <div className="flex">{logoRow}</div>
          {/* Duplicate for seamless loop */}
          <div className="flex" aria-hidden>{logoRow}</div>
        </div>
      </div>
    </section>
  );
}
```

### Step 7d: Rewrite `src/app/page.tsx` background + hero

- [ ] On the root `<div>`: replace `className="... bg-parchment ..."` with sky gradient:
  ```tsx
  className="min-h-screen flex flex-col relative overflow-hidden"
  style={{ background: "linear-gradient(to bottom, #FFFFFF 0%, #BDE0F5 25%, #5AB4E5 55%, #3E9FD5 80%, #4CAF60 100%)" }}
  ```
- [ ] Remove the ambient blob `<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">` section entirely.
- [ ] Add two cloud image layers immediately after the opening root `<div>`:
  ```tsx
  {/* Cloud layer 1 — slow */}
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div
      className="absolute top-[8%] left-0 h-[18%] animate-drift-slow"
      style={{ width: "200%", backgroundImage: "url('/clouds_1.png')", backgroundSize: "50% auto", backgroundRepeat: "repeat-x", opacity: 0.7 }}
    />
    {/* Cloud layer 2 — fast */}
    <div
      className="absolute top-[15%] left-0 h-[14%] animate-drift-fast"
      style={{ width: "200%", backgroundImage: "url('/clouds_2.png')", backgroundSize: "50% auto", backgroundRepeat: "repeat-x", opacity: 0.5 }}
    />
  </div>
  ```
- [ ] Remove the rounded box wrapper around `<HeroFlower />`:
  - Remove `className="... animate-glow-pulse rounded-[3rem]"` wrapper div
  - The `<HeroFlower>` sits directly in the flex container

### Step 7e: Add hill SVG strip to hero section

- [ ] At the bottom of the hero `<section>` (just before the `</section>` closing tag), add the grassy hill silhouette that bridges sky gradient into content:
```tsx
{/* Grassy hill silhouette — bridges sky to content */}
<div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: "80px" }}>
  <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,60 Q180,10 360,40 Q540,70 720,30 Q900,0 1080,35 Q1260,65 1440,45 L1440,80 L0,80 Z" fill="#39AB54" />
  </svg>
</div>
```
- [ ] Make the hero `<section>` `relative` (it already is via `max-w-7xl mx-auto px-6 pt-36` — add `relative` class).
- [ ] Add `pb-20` to the hero section to give room for the hill to overlap the next section.

### Step 7f: Redesign Growth Cycle section

- [ ] Replace the current grid layout with an S-curve layout. Use Tailwind responsive translate classes — **not inline style** — so mobile stays unshifted:
```tsx
<div className="relative grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-6">
  {[
    { icon: PiPottedPlantFill, title: "Plant",     desc: "Upload your PDFs, YouTube links, or lecture text.", num: "01", color: "#39AB54", lgShift: "lg:-translate-y-5" },
    { icon: PiSparkle,         title: "Germinate", desc: "AI breaks down topics into digestible study units.", num: "02", color: "#F5D03B", lgShift: "lg:translate-y-5" },
    { icon: PiDropHalfBottom,  title: "Water",     desc: "Engage with quizzes and audio recaps to build memory.", num: "03", color: "#7B6CB5", lgShift: "lg:-translate-y-5" },
    { icon: PiFlower,          title: "Bloom",     desc: "Your flower reaches full bloom as you master the material.", num: "04", color: "#E8637A", lgShift: "lg:translate-y-5" },
  ].map((step, idx) => (
    <div
      key={idx}
      className={`flex lg:flex-col items-start lg:items-center text-left lg:text-center gap-6 lg:gap-0 group ${step.lgShift}`}
    >
      <div
        className="w-16 h-16 lg:w-20 lg:h-20 lg:mb-8 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
        style={{ backgroundColor: `${step.color}20`, border: `3px solid ${step.color}` }}
      >
        <step.icon className="text-2xl lg:text-3xl" style={{ color: step.color }} />
      </div>
      <div>
        <div className="text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: step.color }}>{step.num}</div>
        <h4 className="font-heading font-black text-xl lg:text-2xl text-[#1c1c18] mb-2">{step.title}</h4>
        <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-[240px] lg:mx-auto">{step.desc}</p>
      </div>
    </div>
  ))}
</div>
```
The `lg:` prefix means `translateY` only activates on large screens. Mobile stacks vertically with no shift.

### Step 7g: What's Included — micro-animation enhancements

- [ ] On each feature card `<div>`, add hover classes:
  ```
  hover:rotate-1 hover:ring-2
  ```
  and dynamically set `ring-color` inline: `style={{ '--tw-ring-color': `${feature.color}30` }}`.
- [ ] On each icon `<div>` inside the card, add: `group-hover:-translate-y-1`.

### Step 7h: Pricing — Pro card shimmer

- [ ] On the Pro card outer `<div>`, add class `animate-border-shimmer`.

### Step 7i: Add University Marquee to page

- [ ] Import `UniversityMarquee` and add between `<PricingSection />` and the footer:
  ```tsx
  import { UniversityMarquee } from "@/components/university-marquee";
  // ...
  <PricingSection />
  <UniversityMarquee />
  ```

### Step 7j: Update footer background edges

- [ ] The footer uses `bg-[#39AB54]` — keep it. The landing now has a green gradient bottom, so the transition is natural. No change needed.

### Step 7k: TypeScript check + commit

- [ ] `npx tsc --noEmit`
- [ ] `git commit -m "feat: landing page sky world, cloud layers, growth cycle redesign, university marquee"`

---

## Task 8: Garden View — 3D Sky Environment

**Files:**
- Modify: `src/app/(protected)/garden/page.tsx`

### Step 8a: Import Sky, Clouds, Cloud from drei

- [ ] Add to imports:
  ```typescript
  import { OrbitControls, Text, DragControls, Grid, Billboard, Sky, Clouds, Cloud, Environment } from "@react-three/drei";
  import { useFrame, useThree } from "@react-three/fiber";
  ```

### Step 8b: Remove `FencePerimeter`, add `HedgePerimeter`

- [ ] Delete the entire `FencePerimeter()` function.
- [ ] Add:
```tsx
function HedgePerimeter() {
  const hedgeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1A6830", roughness: 0.9 }),
    []
  );
  const side = (length: number, posX: number, posZ: number, rotY: number) =>
    Array.from({ length }).map((_, i) => {
      const jitter = 0.15 + (Math.sin(i * 7.3) * 0.5 + 0.5) * 0.3; // deterministic "random" height
      return (
        <mesh
          key={i}
          position={[posX + (rotY === 0 ? -length + i * 2 : 0), 0.1 + jitter / 2, posZ + (rotY !== 0 ? -length + i * 2 : 0)]}
          material={hedgeMat}
          castShadow
        >
          <boxGeometry args={[1.8, 1.2 + jitter, 1.2]} />
        </mesh>
      );
    });

  return (
    <group position={[0, -0.6, 0]}>
      {side(16, 0, -15, 0)}
      {side(16, 0, 15, 0)}
      {side(16, -15, 0, 1)}
      {side(16, 15, 0, 1)}
    </group>
  );
}
```

### Step 8c: Update terrain + add sky/fog

- [ ] In `GardenScene`, replace the two `<mesh>` planes (pavement + grass) with:
```tsx
{/* Sky */}
<Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />

{/* Atmospheric fog */}
<fog attach="fog" args={["#BDE0F5", 20, 60]} />

{/* Terrain */}
<mesh
  rotation={[-Math.PI / 2, 0, 0]}
  position={[0, -0.65, 0]}
  receiveShadow
  onUpdate={(mesh) => {
    const geo = mesh.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // PlaneGeometry in buffer is XY before rotation
      pos.setZ(i, Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.3);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }}
>
  <planeGeometry args={[80, 80, 50, 50]} />
  <meshStandardMaterial color="#4CAF60" roughness={1} />
</mesh>

{/* 3D Clouds */}
<Clouds material={THREE.MeshLambertMaterial}>
  <Cloud position={[-15, 14, -20]} seed={1} segments={20} volume={8} color="white" fade={30} />
  <Cloud position={[20, 16, -15]}  seed={2} segments={15} volume={6} color="white" fade={25} />
  <Cloud position={[0, 18, -30]}   seed={3} segments={18} volume={10} color="white" fade={35} />
  <Cloud position={[-25, 15, 10]}  seed={4} segments={12} volume={7} color="white" fade={28} />
</Clouds>
```
- [ ] Replace `<FencePerimeter />` with `<HedgePerimeter />`.

### Step 8d: Add `CameraController` component

- [ ] Add above `GardenScene`:
```tsx
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

function CameraController({
  isEditorMode,
  controlsRef,
}: {
  isEditorMode: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const normalPos = useMemo(() => new THREE.Vector3(0, 10, 20), []);
  const editorPos = useMemo(() => new THREE.Vector3(0, 28, 0.1), []);

  useFrame(() => {
    const target = isEditorMode ? editorPos : normalPos;
    camera.position.lerp(target, 0.06);
    controlsRef.current?.update();
  });

  return null;
}
```

### Step 8e: Thread `controlsRef` through `GardenScene`

- [ ] Add `import { OrbitControls as OrbitControlsImpl } from "three-stdlib";` at top.
- [ ] Add `controlsRef` to `GardenScene` props and add `const controlsRef = useRef<OrbitControlsImpl | null>(null);` inside.
- [ ] Change `<OrbitControls makeDefault ...>` to `<OrbitControls ref={controlsRef} ...>` (remove `makeDefault`).
- [ ] Add `<CameraController isEditorMode={isEditorMode} controlsRef={controlsRef} />` inside the Canvas (as a sibling to the scene contents).
- [ ] Adjust `OrbitControls` props by `isEditorMode`:
  ```tsx
  <OrbitControls
    ref={controlsRef}
    enableRotate={!isEditorMode}
    enablePan={true}
    enableZoom={!isEditorMode}
    maxPolarAngle={isEditorMode ? Math.PI / 6 : Math.PI / 2 - 0.05}
    minDistance={3}
    maxDistance={35}
    target={[0, 0, 0]}
  />
  ```

### Step 8f: Update `GardenContent` Canvas

- [ ] On the `<Canvas>`, remove background color override from the wrapper div (the CSS sky gradient will show through).
- [ ] The root `<div className="w-full h-screen relative bg-[#A4D5EA]">` — change `bg-[#A4D5EA]` to the CSS sky gradient:
  ```tsx
  style={{ background: "linear-gradient(to bottom, #BDE0F5 0%, #5AB4E5 60%, #3E9FD5 100%)" }}
  ```
- [ ] On `<Canvas>`: add `gl={{ ..., alpha: true }}` so the transparent sky from drei shows through.

### Step 8g: Redesign List View

- [ ] In the `isListView` panel `<div>`, replace:
  - `bg-white/95` → `bg-white/10 backdrop-blur-2xl`
  - `border border-[#e5e2db]` → `border border-white/30 ring-1 ring-white/20`
  - Header text from `text-[#1c1c18]` → `text-white`
  - Subtitle text from `text-on-surface-variant` → `text-white/70`
  - Close button → white/glass style: `bg-white/20 border-white/30 text-white hover:bg-white/30`
- [ ] In each flower row:
  - `bg-white` → `bg-white/15 hover:bg-white/25`
  - `border border-[#e5e2db] hover:border-[#39AB54]/30` → `border border-white/20`
  - Flower name → `text-white font-bold`
  - Replace static `"🌸"` / `"🌱"` icon with `FLOWER_EMOJI_MAP[flower.flower_type]`
  - Add pulsing status dot:
    ```tsx
    <span className={`w-2 h-2 rounded-full ${flower.status === 'bloomed' ? 'bg-[#39AB54] animate-pulse' : 'bg-white/40'}`} />
    ```
- [ ] Remove the `bg-[#faf8f4]/50` scrollable area background.

### Step 8h: Update `FlowerModel` call in garden to pass `pot_variant`

- [ ] The `DraggableFlower` component passes `rarity` and `potColor` to `<FlowerModel>`. Add:
  ```tsx
  potVariant={flower.pot_variant ?? 1}
  ```
- [ ] Add `pot_variant` to the `Flower` interface at the top of the file.

### Step 8i: TypeScript check + commit

- [ ] `npx tsc --noEmit`
- [ ] `git commit -m "feat: garden sky environment — Sky, clouds, terrain, hedges, bird's-eye editor, frosted list view"`

---

## Task 9: Flower Detail Layout — Sky Background + Glassmorphism

**Files:**
- Modify: `src/app/(protected)/flower/[id]/layout.tsx`

### Step 9a: Apply sky background to layout

- [ ] On the outer `<div className="relative min-h-screen">`, add inline style:
  ```tsx
  style={{ background: "linear-gradient(to bottom, #BDE0F5 0%, #5AB4E5 40%, #3E9FD5 70%, #4CAF60 100%)" }}
  ```
- [ ] Remove `from-surface-container` gradient overlay (the `<div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ...">` div).

### Step 9b: Update flower detail page panels

- [ ] In `src/app/(protected)/flower/[id]/page.tsx`, find all card/panel containers that currently use white backgrounds and update to glassmorphism:
  - Any `bg-white` panels → `bg-white/15 backdrop-blur-2xl border border-white/25 rounded-3xl`
  - Any `text-[#1c1c18]` headings → `text-white`
  - Any `text-on-surface-variant` subtitles → `text-white/70`
  - Unit list item backgrounds → `bg-white/10 hover:bg-white/20 border-white/15`
  - Action buttons (Study, Quiz) — keep green CTA style but ensure visible contrast

### Step 9c: Pass `pot_variant` to `Flower3D` in layout

- [ ] Fetch `pot_variant` alongside existing flower fields in the layout's `supabase.from("flowers").select(...)`.
- [ ] Pass `potVariant={flower.pot_variant ?? 1}` to `<Flower3D>`.

### Step 9d: TypeScript check + commit

- [ ] `npx tsc --noEmit`
- [ ] `git commit -m "feat: flower detail sky background and glassmorphism panels"`

---

## Task 10: Upload Preview — Sky Canvas Wrapper + Pot Variant Selector

**Files:**
- Modify: `src/app/(protected)/upload/page.tsx`

### Step 10a: Add sky background to Flower3D wrapper

- [ ] Find the `<Flower3D>` component call in the upload page (it's in the right-side preview panel).
- [ ] Wrap it in a `<div>` with sky gradient:
  ```tsx
  <div
    className="relative rounded-3xl overflow-hidden"
    style={{ background: "linear-gradient(to bottom, #BDE0F5, #5AB4E5 60%, #3E9FD5 90%, #4CAF60 100%)" }}
  >
    <Flower3D
      flowerType={flowerType ?? "daisy"}
      growthStage={previewStage}
      rarity={previewRarity}
      potColor={customPotColor}
      potVariant={previewVariant}
      showGround
      size="full"
      interactive={false}
    />
  </div>
  ```

### Step 10b: Add `previewVariant` state

- [ ] Add to component state:
  ```typescript
  const [previewVariant, setPreviewVariant] = useState(1);
  ```
- [ ] When `previewRarity` changes, reset `previewVariant` to `1`.

### Step 10c: Add variant count map

- [ ] Add above the component:
  ```typescript
  const PREVIEW_VARIANT_COUNTS: Record<Rarity, number> = {
    basic: 1, vintage: 1, rare: 2, antique: 2, relic: 3,
  };
  ```

### Step 10d: Add `PotVariantSelector` UI

- [ ] Below the rarity selector tabs (find the rarity preview section), add:
```tsx
{/* Pot variant arrows — only show if rarity has >1 variant */}
{activePreviewId !== "base" && PREVIEW_VARIANT_COUNTS[previewRarity] > 1 && (
  <div className="flex items-center justify-center gap-4 mt-3">
    <button
      onClick={() => setPreviewVariant((v) => Math.max(1, v - 1))}
      disabled={previewVariant <= 1}
      className="w-8 h-8 rounded-full bg-white/80 border border-[#e5e2db] flex items-center justify-center disabled:opacity-30 hover:bg-white transition"
      aria-label="Previous pot variant"
    >
      ‹
    </button>
    <span className="text-xs font-bold text-on-surface-variant">
      Pot {previewVariant} of {PREVIEW_VARIANT_COUNTS[previewRarity]}
    </span>
    <button
      onClick={() => setPreviewVariant((v) => Math.min(PREVIEW_VARIANT_COUNTS[previewRarity], v + 1))}
      disabled={previewVariant >= PREVIEW_VARIANT_COUNTS[previewRarity]}
      className="w-8 h-8 rounded-full bg-white/80 border border-[#e5e2db] flex items-center justify-center disabled:opacity-30 hover:bg-white transition"
      aria-label="Next pot variant"
    >
      ›
    </button>
  </div>
)}
```

### Step 10e: Update rarity selector to use new names

- [ ] Any hardcoded old rarity display names in the upload page → use `RARITIES[rarity].name` from the updated `rarity.ts`.

### Step 10f: TypeScript check + full build

- [ ] `npx tsc --noEmit`
- [ ] `next build` — zero errors.
- [ ] `git commit -m "feat: upload preview sky background and pot variant selector arrows"`

---

## Task 11: Final Pass — Manual QA Checklist

- [ ] Start dev server: `npm run dev`
- [ ] **Landing page:** sky gradient visible, clouds drift left, hero flower floats in sky, university logos scroll, pricing Pro card shimmers.
- [ ] **Navbar:** avatar circle shows, clicking opens dropdown, sign out works, "Manage subscription" appears only for Pro users and redirects to Stripe portal.
- [ ] **Garden:** sky renders, hedges visible, clouds visible, fog gives depth, editor mode triggers bird's-eye camera smoothly, list view is frosted glass.
- [ ] **Upload:** sky gradient behind 3D preview, pot variant arrows appear for Rare/Antique/Relic and cycle correctly.
- [ ] **Flower detail:** sky background behind 3D model, panels are glassmorphic.
- [ ] **Rarity system:** plant a new flower, verify pot_rarity stored as new name (basic/vintage/etc.), verify pity_count increments in DB.
- [ ] **Mobile (375px):** all pages readable, marquee scrolls, navbar collapses correctly, garden UI controls accessible.
- [ ] `git commit -m "chore: final QA pass — all 5 redesign phases verified"`

---

## Implementation Order & Dependencies

```
Task 1 (DB)
  └─► Task 2 (Rarity TS) → Task 3 (Flower3D) → Task 4 (Process API)
                         ↘
                          Task 5 (Navbar)      ← independent
                          Task 6 (Icons)       ← independent
                          Task 7 (Landing)     ← independent after Task 6
                          Task 8 (Garden)      ← after Task 3
                          Task 9 (Flower Detail) ← after Task 3
                          Task 10 (Upload)     ← after Task 3
  └─► Task 11 (QA)       ← after all
```

Tasks 5, 6, 7 are independent of each other and can be done in parallel.  
Tasks 8, 9, 10 depend on Task 3 (Flower3D props updated).
