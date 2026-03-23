# Design System Strategy: Editorial Organicism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Living Ledger."** 

We are moving away from the cold, sterile grids of traditional SaaS and toward a "Playful-Refined" editorial experience. This system interprets the digital interface as high-end, bespoke stationery. It balances the tactile richness of organic textures with the functional clarity of modern minimalism. 

To break the "template" look, we employ **Intentional Asymmetry**. Layouts should feel curated, not just generated. We achieve this by using overlapping "pebble" shapes, generous whitespace from our spacing scale, and a sophisticated "No-Line" philosophy that relies on tonal depth rather than structural borders.

---

## 2. Colors & Tonal Depth
Our palette is rooted in a lush botanical primary, supported by "Bloom" accents that provide moments of delight and high-contrast signaling.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
Boundaries must be defined through background color shifts or subtle tonal transitions. For instance, a `surface-container-low` (#f6f3ec) sidebar should sit against a `surface` (#fcf9f2) main content area without a divider line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. Use the following hierarchy to create depth:
*   **Base Layer:** `surface` (#fcf9f2)
*   **Secondary Content:** `surface-container-low` (#f6f3ec)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Elevated Overlays:** `surface-bright` (#fcf9f2) with Glassmorphism.

### The "Glass & Gradient" Rule
To add "soul" to the interface:
*   **CTAs:** Use a subtle linear gradient (135°) transitioning from `primary` (#006e2b) to `primary_container` (#39ab54).
*   **Floating Elements:** Use `surface_container_lowest` at 80% opacity with a `24px` backdrop-blur to create a "frosted glass" effect that allows botanical colors to bleed through softly.

---

## 3. Typography: The Editorial Voice
We utilize a pairing of **Plus Jakarta Sans** for high-impact editorial moments and **Manrope** for functional clarity.

*   **Display & Headlines (Plus Jakarta Sans):** These are your "Editorial Anchors." Use `display-lg` and `headline-lg` with tight letter-spacing (-0.02em) to create an authoritative, premium feel. 
*   **Titles & Body (Manrope):** Use `title-md` for card headers and `body-lg` for primary content. Manrope’s geometric yet warm construction maintains the "friendly-professional" balance.
*   **Labels (Manrope):** Use `label-md` in `on_surface_variant` (#3e4a3d) for metadata. The slight desaturation ensures the eye is drawn to the content, not the framework.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "digital." We use **Ambient Layering** to convey hierarchy.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-highest` (#e5e2db) element nested inside a `surface-container` (#f1eee7) creates a natural recessed look without a single pixel of shadow.
*   **Soft Ambient Shadows:** For floating pebbles (like FABs or active Modals), use a multi-layered shadow: 
    *   *Shadow:* `0px 20px 40px rgba(28, 28, 24, 0.06)` (A tinted version of `on_surface`).
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline_variant` (#bdcaba) at **15% opacity**. This creates a "watermark" effect rather than a hard edge.

---

## 5. Components

### The Pebble Button
*   **Shape:** Use `rounded-xl` (3rem) or `rounded-full`.
*   **Primary:** Gradient of `primary` to `primary_container`. White text.
*   **Secondary:** `secondary_container` (#fe748b) with `on_secondary_container` (#720427) text. This provides a warm, "Bloom" contrast.
*   **Interaction:** On hover, a subtle `0.5rem` lift using an ambient shadow.

### Organic Pebble Cards
*   **Construction:** `rounded-lg` (2rem) containers.
*   **Styling:** No borders. Use `surface_container_low` against a `surface` background.
*   **Spacing:** Internal padding should never be less than `spacing-6` (2rem) to maintain the premium, breathable feel.

### Input Fields (The "Soft Well")
*   **Shape:** `rounded-md` (1.5rem).
*   **Background:** `surface_container_highest` (#e5e2db). 
*   **States:** On focus, transition the background to `surface_container_lowest` (#ffffff) and add a "Ghost Border" of `primary` at 20% opacity.

### Navigation Pebbles (Chips)
*   **Selection:** Use `primary_fixed` (#8afa99) for selected states with `on_primary_fixed` (#002108) text.
*   **Shape:** `rounded-full`.
*   **Layout:** Group chips with `spacing-2` gaps to create a cluster effect.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace White Space:** Use `spacing-12` and `spacing-16` between major sections. Generosity is the hallmark of luxury.
*   **Layer Surfaces:** Think of the UI as physical sheets of paper. If an element is "important," it should feel like it's a separate sheet resting on top.
*   **Use Subtle Grain:** Apply a very low-opacity (2-3%) noise texture overlay on the `background` to mimic parchment.

### Don’t:
*   **Don't Use Dividers:** Never use a horizontal line to separate list items. Use `spacing-4` or a slight shift in background color.
*   **Don't Use Pure Black:** Use `on_surface` (#1c1c18) for all text to keep the "organic" feel. Pure black is too harsh for the "Botanical" aesthetic.
*   **Don't Use Sharp Corners:** Every corner must have at least a `rounded-sm` (0.5rem) radius. Sharp corners break the "organic" metaphor.

---

## 7. Signature Detail: The "Bloom" Accent
Use the secondary colors (`#E8637A`, `#F4A44E`, `#B09FD8`) sparingly for iconography and status indicators. For example, a "Success" state should use the `primary` green, but a "New Feature" or "Special Insight" badge should use the `secondary` Bloom red/pink (#E8637A) to provide a pop of high-end stationery flair.