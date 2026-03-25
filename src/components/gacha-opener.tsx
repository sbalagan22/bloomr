"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  type Rarity,
  RARITIES,
  rollRarity,
} from "@/lib/rarity";
import { PiSparkle, PiGift } from "react-icons/pi";

interface GachaOpenerProps {
  /** If provided, use this rarity instead of rolling randomly */
  fixedRarity?: Rarity;
  /** If provided, use this color for the revealed pot */
  fixedColor?: string;
  /** Called once the reveal animation finishes */
  onComplete: (rarity: Rarity) => void;
  /** Whether the opener is visible */
  open: boolean;
}

const SPIN_ITEMS = 40; // number of rarity slots in the reel
const ITEM_WIDTH = 96; // px per slot

export function GachaOpener({ fixedRarity, fixedColor, onComplete, open }: GachaOpenerProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "reveal">("idle");
  const [finalRarity, setFinalRarity] = useState<Rarity>("common");
  const [reelItems, setReelItems] = useState<Rarity[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const reelRef = useRef<HTMLDivElement>(null);

  // Generate the reel on open
  useEffect(() => {
    if (!open) {
      setPhase("idle");
      return;
    }
    const result = fixedRarity ?? rollRarity();
    setFinalRarity(result);

    // Build reel: random rarities with the result placed near the end (slot 35)
    const items: Rarity[] = [];
    for (let i = 0; i < SPIN_ITEMS; i++) {
      if (i === SPIN_ITEMS - 5) {
        items.push(result);
      } else {
        items.push(rollRarity());
      }
    }
    setReelItems(items);
    setTranslateX(0);

    // Start spinning after a brief delay
    const t = setTimeout(() => {
      setPhase("spinning");
      // Align the center of the target item (slot SPIN_ITEMS - 5) precisely to the center marker
      const targetCenter = (SPIN_ITEMS - 5) * ITEM_WIDTH + (ITEM_WIDTH / 2);
      setTranslateX(-targetCenter);
    }, 300);

    return () => clearTimeout(t);
  }, [open, fixedRarity]);

  // After spin animation ends, transition to reveal
  useEffect(() => {
    if (phase !== "spinning") return;
    const t = setTimeout(() => {
      setPhase("reveal");
      onComplete(finalRarity);
    }, 4200); // matches CSS transition duration
    return () => clearTimeout(t);
  }, [phase, finalRarity, onComplete]);

  if (!open) return null;

  const config = RARITIES[finalRarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg px-6">
        {/* Title */}
        <div className="text-center animate-fade-in-down">
          <h2 className="font-heading text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 justify-center">
            <PiGift className="text-amber-400" /> Pot Drop
          </h2>
          <p className="text-white/60 text-sm mt-1">Your flower has fully bloomed — here comes the pot!</p>
        </div>

        {/* Reel Container */}
        <div className="relative w-full h-28 overflow-hidden rounded-2xl border-2 border-white/20 bg-black/50">
          {/* Center marker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-amber-400 z-10 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
          <div className="absolute top-0 left-1/2 -translate-x-[6px] w-3 h-3 bg-amber-400 z-10 rotate-45 shadow-lg" />
          <div className="absolute bottom-0 left-1/2 -translate-x-[6px] w-3 h-3 bg-amber-400 z-10 rotate-45 shadow-lg" />

          {/* Reel strip */}
          <div
            ref={reelRef}
            className="flex items-center h-full"
            style={{
              transform: `translateX(calc(50% + ${translateX}px))`,
              transition: phase === "spinning" ? "transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)" : "none",
            }}
          >
            {reelItems.map((rarity, i) => {
              const r = RARITIES[rarity];
              return (
                <div
                  key={i}
                  className="shrink-0 flex flex-col items-center justify-center gap-1 border-r border-white/10"
                  style={{ width: ITEM_WIDTH, height: "100%" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl shadow-inner"
                    style={{ backgroundColor: r.color, boxShadow: `0 0 12px ${r.glowColor}40` }}
                  />
                  <span className="text-[10px] font-bold" style={{ color: r.color }}>
                    {r.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reveal card */}
        {phase === "reveal" && (
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 animate-scale-in w-full"
            style={{
              backgroundColor: `${config.color}15`,
              borderColor: `${config.color}50`,
              boxShadow: `0 0 60px ${config.glowColor}30`,
            }}
          >
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center border-2 border-white/20"
                style={{ backgroundColor: fixedColor ?? config.color }}
              >
                <PiSparkle className="text-3xl text-white" />
              </div>
              {(finalRarity === "legendary" || finalRarity === "epic") && (
                <div
                  className="absolute -inset-2 rounded-3xl animate-pulse"
                  style={{ boxShadow: `0 0 30px ${config.glowColor}60` }}
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold" style={{ color: config.color }}>
                {config.name} Pot!
              </p>
              <p className="text-white/50 text-xs mt-1">
                {finalRarity === "legendary"
                  ? "Flames pattern — ultra rare drop!"
                  : finalRarity === "epic"
                    ? "Ornate chalice — sick drop!"
                    : finalRarity === "rare"
                      ? "Pedestal vase — nice find!"
                      : finalRarity === "uncommon"
                        ? "Round belly pot — cool!"
                        : "Terracotta clay — classic."}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/10">
                <div className="w-3 h-3 rounded-full border border-white/50 shadow-inner" style={{ backgroundColor: fixedColor ?? config.color }} />
                <span className="text-xs font-mono font-bold tracking-wider text-white/80">{fixedColor ?? config.color}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
