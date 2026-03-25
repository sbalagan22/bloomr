export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

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
  common: {
    name: "Common",
    color: "#9CA3AF",
    glowColor: "#9CA3AF",
    bgClass: "bg-gray-100",
    borderClass: "border-gray-300",
    textClass: "text-gray-500",
    dropRate: 50,
  },
  uncommon: {
    name: "Uncommon",
    color: "#3B82F6",
    glowColor: "#60A5FA",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-500",
    dropRate: 25,
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
  epic: {
    name: "Epic",
    color: "#EC4899",
    glowColor: "#F472B6",
    bgClass: "bg-pink-50",
    borderClass: "border-pink-200",
    textClass: "text-pink-500",
    dropRate: 9,
  },
  legendary: {
    name: "Legendary",
    color: "#F59E0B",
    glowColor: "#FBBF24",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-500",
    dropRate: 1,
  },
};

export const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

/** Roll a random rarity based on drop rates (50/25/15/9/1) */
export function rollRarity(): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += RARITIES[rarity].dropRate;
    if (roll < cumulative) return rarity;
  }
  return "common";
}

/** Generate a random hex color string */
export function randomHexColor(): string {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}
