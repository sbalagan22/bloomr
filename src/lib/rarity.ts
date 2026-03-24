export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type CamoType = "solid" | "stripes" | "polkadots" | "drip" | "flames";

export interface RarityConfig {
  name: string;
  color: string;
  glowColor: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dropRate: number;
  camo: CamoType;
}

export const RARITIES: Record<Rarity, RarityConfig> = {
  common: {
    name: "Common",
    color: "#9CA3AF",
    glowColor: "#9CA3AF",
    bgClass: "bg-gray-100",
    borderClass: "border-gray-300",
    textClass: "text-gray-500",
    dropRate: 60,
    camo: "solid",
  },
  uncommon: {
    name: "Uncommon",
    color: "#3B82F6",
    glowColor: "#60A5FA",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-500",
    dropRate: 25,
    camo: "stripes",
  },
  rare: {
    name: "Rare",
    color: "#8B5CF6",
    glowColor: "#A78BFA",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    textClass: "text-purple-600",
    dropRate: 10,
    camo: "polkadots",
  },
  epic: {
    name: "Epic",
    color: "#EC4899",
    glowColor: "#F472B6",
    bgClass: "bg-pink-50",
    borderClass: "border-pink-200",
    textClass: "text-pink-500",
    dropRate: 3,
    camo: "drip",
  },
  legendary: {
    name: "Legendary",
    color: "#F59E0B",
    glowColor: "#FBBF24",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-500",
    dropRate: 2,
    camo: "flames",
  },
};

export const COMMON_POT_COLORS = [
  { name: "Red", hex: "#EF4444" },
  { name: "Green", hex: "#22C55E" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Yellow", hex: "#EAB308" },
];

export const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

/** Roll a random rarity based on drop rates */
export function rollRarity(): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += RARITIES[rarity].dropRate;
    if (roll <= cumulative) return rarity;
  }
  return "common";
}

/** Deterministic rarity from stored DB offsets (pattern_offset_x, pattern_offset_y) */
export function getRarityFromOffsets(
  offsetX: number,
  offsetY: number
): Rarity {
  const combined = Math.floor((offsetX * 97 + offsetY * 53) * 100) % 100;
  if (combined < 60) return "common";
  if (combined < 85) return "uncommon";
  if (combined < 95) return "rare";
  if (combined < 98) return "epic";
  return "legendary";
}

/** Pick a solid color for common pots based on offset */
export function getCommonColor(offsetX: number): string {
  const idx =
    Math.floor(offsetX * 1000) % COMMON_POT_COLORS.length;
  return COMMON_POT_COLORS[idx].hex;
}
