"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  type Rarity,
  RARITIES,
  rollRarity,
} from "@/lib/rarity";
import { PiSparkle, PiGift } from "react-icons/pi";
import { Flower3D } from "@/components/flower-3d";

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
const ITEM_WIDTH = 140; // px per slot

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
      // Align the center of the target item
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
    }, 4500); // matches CSS transition duration + slight delay
    return () => clearTimeout(t);
  }, [phase, finalRarity, onComplete]);

  if (!open) return null;

  const config = RARITIES[finalRarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center gap-10 w-full max-w-2xl px-6">
        {/* Title */}
        <div className="text-center animate-fade-in-down mb-4">
          <h2 className="font-heading text-4xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-3 justify-center drop-shadow-2xl">
            <PiGift className="text-amber-400 animate-bounce" /> Pot Drop
          </h2>
          <p className="text-white/80 text-base md:text-lg mt-2 font-medium">Your flower has fully bloomed — here comes the pot!</p>
        </div>

        {/* Reel Container */}
        {phase !== "reveal" && (
          <div className="relative w-full h-40 overflow-hidden rounded-[2rem] border-4 border-white/20 bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {/* Center marker */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-full bg-amber-400 z-10 shadow-[0_0_20px_rgba(251,191,36,1)]" />
            <div className="absolute top-0 left-1/2 -translate-x-2 w-4 h-4 bg-amber-400 z-10 rotate-45 shadow-lg shadow-amber-400/50" />
            <div className="absolute bottom-0 left-1/2 -translate-x-2 w-4 h-4 bg-amber-400 z-10 rotate-45 shadow-lg shadow-amber-400/50" />

            {/* Reel strip */}
            <div
              ref={reelRef}
              className="flex items-center h-full"
              style={{
                transform: `translateX(calc(50% + ${translateX}px))`,
                transition: phase === "spinning" ? "transform 4.2s cubic-bezier(0.1, 0.9, 0.2, 1)" : "none",
              }}
            >
              {reelItems.map((rarity, i) => {
                const r = RARITIES[rarity];
                return (
                  <div
                    key={i}
                    className="shrink-0 flex flex-col items-center justify-center gap-2 border-r border-white/5"
                    style={{ width: ITEM_WIDTH, height: "100%" }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl shadow-inner border border-white/20"
                      style={{ backgroundColor: r.color, boxShadow: `0 0 20px ${r.glowColor}40` }}
                    />
                    <span className="text-xs uppercase tracking-widest font-black" style={{ color: r.color }}>
                      {r.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reveal card */}
        {phase === "reveal" && (
          <div
            className="flex flex-col items-center gap-6 p-10 rounded-[3rem] border-4 animate-scale-in w-full backdrop-blur-2xl relative overflow-hidden"
            style={{
              backgroundColor: `${config.color}20`,
              borderColor: `${config.color}60`,
              boxShadow: `0 0 100px ${config.glowColor}50`,
            }}
          >
            <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div
                className="w-48 h-48 sm:w-64 sm:h-64 rounded-full shadow-2xl flex items-center justify-center border-4 border-white/30 relative bg-black/20 overflow-hidden"
              >
                {(finalRarity === "legendary" || finalRarity === "epic") && (
                  <div
                    className="absolute -inset-4 rounded-full animate-pulse"
                    style={{ boxShadow: `inset 0 0 50px ${config.glowColor}80` }}
                  />
                )}
                <div className="w-[120%] h-[120%] -ml-4 -mt-4 cursor-grab active:cursor-grabbing">
                  {/* Provide a dummy full grown flower to showcase the pot! */}
                  <Flower3D 
                     flowerType="rose" 
                     growthStage={4} 
                     rarity={finalRarity} 
                     potColor={fixedColor ?? config.color} 
                     interactive={true} 
                     size="full" 
                  />
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/20 mb-3">
                  <PiSparkle className="text-xl" style={{ color: config.color }} />
                  <span className="text-sm font-black uppercase tracking-widest" style={{ color: config.color }}>{config.name} Drop</span>
                </div>
                
                <p className="text-white/80 text-sm mt-2 font-medium max-w-xs mx-auto">
                  {finalRarity === "legendary"
                    ? "UNBELIEVABLE! A mythical pattern appears!"
                    : finalRarity === "epic"
                      ? "Incredible ornate detail. What a lucky drop!"
                      : finalRarity === "rare"
                        ? "A beautiful pedestal-style pot!"
                        : finalRarity === "uncommon"
                          ? "A lovely round belly pot."
                          : "Classic terracotta style."}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 border border-white/10">
                  <div className="w-4 h-4 rounded-full border border-white/50 shadow-inner" style={{ backgroundColor: fixedColor ?? config.color }} />
                  <span className="text-xs font-mono font-bold tracking-wider text-white/90">{fixedColor ?? config.color}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => onComplete(finalRarity)}
              className="mt-4 z-10 px-8 py-3 bg-white text-black font-black uppercase tracking-wider text-sm rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              Collect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
