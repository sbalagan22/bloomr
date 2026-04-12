"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { PiBookOpenBold, PiLightningBold, PiArrowLeftBold, PiWarningBold } from "react-icons/pi";
import { RARITIES } from "@/lib/rarity";

export default function DemoFlowerPage() {
  const flower = {
    topic_name: "Cellular Respiration & Photosynthesis",
    flower_type: "rose",
    growth_stage: 4,
    status: "bloomed",
    pot_rarity: "relic",
    pot_color: "#1c1c18",
  };

  const units = [
    { id: "1", title: "Overview of Cellular Respiration", completed: true },
    { id: "2", title: "Glycolysis Mechanics", completed: true },
    { id: "3", title: "The Krebs Cycle & ATP", completed: true },
    { id: "4", title: "Photosynthesis vs Respiration", completed: false },
  ];

  const flowerColor = "#CC2A1A";
  const completedCount = 3;

  return (
    <div className="w-full min-h-screen bg-parchment pt-24 px-6 md:px-12 flex flex-col items-center">
      
      {/* Demo Nav */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl bg-surface/80 glass-morphism rounded-full shadow-lg border border-white/50 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/bloomr_icon.svg" alt="Bloomr" width={32} height={32} className="drop-shadow-sm" />
          <span className="text-2xl text-primary-container tracking-tighter font-logo mt-1">Bloomr</span>
        </Link>
        <Link href="/signup" className="px-6 py-2.5 bg-gradient-to-r from-[#F5D03B] to-[#F4A44E] text-[#3D2B1F] rounded-full font-black text-sm hover:shadow-[0_0_20px_rgba(245,208,59,0.5)] transition-all uppercase tracking-wider">Start Free Dashboard</Link>
      </header>

      <div className="w-full max-w-6xl flex justify-between gap-8 h-[calc(100vh-120px)] mt-4">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-6 animate-fade-in-up h-full overflow-y-auto pb-12 scrollbar-hide">
          
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary-deep transition-colors bg-white/70 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-sm border border-white/40">
              <PiArrowLeftBold /> Home
            </Link>
          </div>

          <div className="bg-surface/85 backdrop-blur-xl pebble-shadow rounded-3xl p-8 border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-bl-xl font-bold text-xs">DEMO GARDEN</div>
            <h1 className="font-heading text-3xl font-extrabold text-on-surface tracking-tight leading-tight">{flower.topic_name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize rounded-full border-2 bg-white/50 px-3 py-1" style={{ borderColor: flowerColor, color: flowerColor }}>{flower.flower_type}</Badge>
              <Badge variant="secondary" className="bg-primary-fixed text-on-primary-fixed rounded-full px-3 py-1 font-bold">
                Full Bloom
              </Badge>
            </div>

            <div className="mt-5 flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 border border-white/50">
              <div className="w-6 h-6 rounded-lg shadow-[0_0_10px_rgba(251,191,36,0.8)] border border-amber-300" style={{ backgroundColor: flower.pot_color! }} />
              <div className="flex-1">
                <span className="text-xs font-bold text-amber-500">Relic Pot</span>
                <span className="text-[10px] font-mono text-on-surface-variant ml-2">{flower.pot_color!.toUpperCase()}</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-on-surface flex items-center gap-2">Growth Progress</span>
                <span className="font-bold text-primary-deep bg-primary-deep/10 px-2 py-0.5 rounded-md text-xs">{completedCount}/{units.length} Units</span>
              </div>
              <div className="h-4 w-full rounded-full bg-surface-container-high overflow-hidden shadow-inner relative">
                <div className="h-full rounded-full transition-all duration-1000 ease-out bg-[#39AB54]" style={{ width: `75%` }} />
              </div>
            </div>
            
            <div className="mt-6 rounded-2xl bg-primary-fixed/10 p-4 text-center border border-primary-fixed/20 text-on-surface font-medium text-sm tracking-wide">
              🌸 Only 1 unit left to master the core topic!
            </div>
          </div>

          <div className="rounded-3xl bg-amber-50/90 backdrop-blur-xl pebble-shadow border border-amber-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PiWarningBold className="text-amber-500 text-lg shrink-0" />
              <h2 className="font-heading text-base font-bold text-amber-900">Areas to Review</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
                Electron Transport Chain
                <span className="rounded-full bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">3×</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
                ATP Synthase
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold text-on-surface bg-surface/85 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/20 pebble-shadow flex items-center gap-2 sticky top-0 z-10">
              Study Material
            </h2>

            {units.map((unit, index) => (
              <div key={unit.id} className="group rounded-[1.5rem] bg-surface/90 backdrop-blur-md pebble-shadow p-5 transition-all hover:scale-[1.02] border border-white/20 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-sm ${
                    unit.completed ? "bg-[#39AB54] text-white" : "bg-surface-container-highest text-on-surface-variant"
                  }`}>
                    {unit.completed ? "✓" : index + 1}
                  </div>
                  <div className="flex-1 mt-0.5 flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#39AB54] mb-1">Chapter {index + 1}</span>
                    <h3 className="font-heading font-extrabold text-[#3D2B1F] text-[16px] leading-snug">{unit.title}</h3>
                  </div>
                </div>

                <div className="flex gap-2 w-full mt-1">
                  <button onClick={() => alert("This is a demo!")} className="flex-1 w-full h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    <PiBookOpenBold /> Study
                  </button>
                  <button onClick={() => alert("This is a demo!")} className="flex-1 w-full h-10 rounded-xl bg-[#39AB54] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all">
                    <PiLightningBold /> Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Floating Fake Demo Render */}
        <div className="hidden lg:flex flex-1 rounded-[3rem] bg-white/50 backdrop-blur-xl border-4 border-white pebble-shadow relative overflow-hidden items-center justify-center">
            <div className="absolute inset-0 bg-linear-to-b from-[#C8EDCF]/20 to-transparent" />
            <div className="absolute top-8 text-center animate-fade-in-down z-10">
              <h3 className="font-heading text-2xl font-black text-on-surface tracking-tight bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/40 shadow-sm">
                Live 3D Garden View
              </h3>
            </div>
            
            {/* We mock the static Flower with the Hero flower so it runs flawlessly with no params */}
            <div className="w-[600px] h-[600px] pointer-events-none mt-16 scale-125">
              <img src="/design/flowers/2.png" className="w-full h-full object-contain drop-shadow-2xl opacity-60 mix-blend-multiply blur-3xl absolute inset-0" alt="demo" />
              <div className="flex flex-col items-center justify-center h-full w-full">
                <span className="text-9xl mb-8 animate-pulse">🌹</span>
                <p className="font-heading font-bold text-on-surface-variant text-lg">Interactive 3D Demo Preview</p>
                <Link href="/signup" className="mt-6 px-10 py-5 bg-[#39AB54] text-white rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-transform border border-white/20 pointer-events-auto">Create Your Own</Link>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}
