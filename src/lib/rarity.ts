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
