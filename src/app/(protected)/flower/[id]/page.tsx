"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { PiBookOpenBold, PiLightningBold, PiArrowLeftBold, PiTrashBold, PiWarningBold, PiCaretDownBold, PiPlantBold, PiSpinnerBold, PiXBold, PiPlusBold } from "react-icons/pi";
import { RARITIES, type Rarity } from "@/lib/rarity";
import { ChatTutor } from "@/components/chat-tutor";

const Flower3D = dynamic(
  () => import("@/components/flower-3d").then((mod) => ({ default: mod.Flower3D })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#C8EDCF]/30 rounded-full" /> }
);


interface Flower {
  id: string;
  topic_name: string;
  flower_type: string;
  growth_stage: number;
  status: string;
  pot_rarity: string | null;
  pot_color: string | null;
}

interface Unit {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
  is_custom: boolean;
}

interface WeakAreaEntry {
  concept: string;
  unitTitle: string;
  count: number;
}

const GROWTH_LABELS = ["Seed", "Sprout", "Bud", "Opening", "Full Bloom"];
const FLOWER_COLORS: Record<string, string> = {
  rose: "#CC2A1A",
  tulip: "#3D5EE0",
  sunflower: "#F5C518",
  daisy: "#FFFFFF",
  lily: "#E8709A",
};

export default function FlowerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const flowerId = params.id as string;

  const [flower, setFlower] = useState<Flower | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aggregatedWeakAreas, setAggregatedWeakAreas] = useState<WeakAreaEntry[]>([]);
  const [customQuizPrompt, setCustomQuizPrompt] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isAreasOpen, setIsAreasOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizTopics, setQuizTopics] = useState<string[]>([""]);

  useEffect(() => {
    const supabase = createClient();
    
    async function loadData() {
      const { data: flowerData } = await supabase.from("flowers").select("id, topic_name, flower_type, growth_stage, status, pot_rarity, pot_color").eq("id", flowerId).single();
      if (!flowerData) { router.push("/garden"); return; }
      setFlower(flowerData);

      const { data: unitsData } = await supabase.from("units").select("id, title, order_index, completed, is_custom").eq("flower_id", flowerId).order("order_index");
      setUnits(unitsData || []);
      setLoading(false);

      // Load aggregated weak areas from all quiz_attempts for this flower
      if (unitsData && unitsData.length > 0) {
        const unitIds = unitsData.map((u) => u.id);
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id")
          .in("unit_id", unitIds);

        if (quizzes && quizzes.length > 0) {
          const quizIds = quizzes.map((q) => q.id);
          const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select("weak_areas")
            .in("quiz_id", quizIds)
            .not("weak_areas", "is", null);

          if (attempts) {
            const conceptCounts: Record<string, WeakAreaEntry> = {};
            for (const attempt of attempts) {
              const areas = attempt.weak_areas as { concept: string; unitTitle: string }[] | null;
              if (!areas) continue;
              for (const area of areas) {
                const key = area.concept.toLowerCase();
                if (conceptCounts[key]) {
                  conceptCounts[key].count += 1;
                } else {
                  conceptCounts[key] = { concept: area.concept, unitTitle: area.unitTitle, count: 1 };
                }
              }
            }
            const sorted = Object.values(conceptCounts).sort((a, b) => b.count - a.count);
            setAggregatedWeakAreas(sorted);
          }
        }
      }
    }
    loadData();

    // Live updates for both Flower and Units tables
    const channel = supabase.channel(`page_flower_${flowerId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'flowers', filter: `id=eq.${flowerId}` }, (payload) => {
        setFlower(payload.new as Flower);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'units', filter: `flower_id=eq.${flowerId}` }, (payload) => {
        setUnits((current) => current.map(u => u.id === payload.new.id ? payload.new as Unit : u).sort((a,b) => a.order_index - b.order_index));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [flowerId, router]);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${flower?.topic_name}"? All study units and quiz history will be permanently lost.`)) return;
    setIsDeleting(true);
    const supabase = createClient();

    try {
      // Full cascade: quiz_attempts → quizzes → units → flower
      const { data: dbUnits } = await supabase.from("units").select("id").eq("flower_id", flowerId);

      if (dbUnits && dbUnits.length > 0) {
        const unitIds = dbUnits.map(u => u.id);

        // Get all quiz IDs for these units
        const { data: dbQuizzes } = await supabase.from("quizzes").select("id").in("unit_id", unitIds);

        if (dbQuizzes && dbQuizzes.length > 0) {
          const quizIds = dbQuizzes.map(q => q.id);
          // Delete quiz_attempts first (FK → quizzes)
          await supabase.from("quiz_attempts").delete().in("quiz_id", quizIds);
        }

        // Then delete quizzes (FK → units)
        await supabase.from("quizzes").delete().in("unit_id", unitIds);
        // Then delete units (FK → flowers)
        await supabase.from("units").delete().in("id", unitIds);
      }

      // Finally delete the flower itself
      const { error } = await supabase.from("flowers").delete().eq("id", flowerId);
      if (error) throw error;

      router.push("/garden");
    } catch (err) {
      console.error("Delete failed:", err);
      setIsDeleting(false);
      alert("Failed to delete flower. Please try again.");
    }
  }

  async function handleGenerateCustomQuiz() {
    const filledTopics = quizTopics.filter(t => t.trim());
    if (!filledTopics.length || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    
    const prompt = filledTopics.join(", ");
    try {
      const res = await fetch("/api/quiz/generate-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, flowerId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setIsQuizModalOpen(false);
      setQuizTopics([""]);
      setCustomQuizPrompt("");
      // Navigate to the new quiz unit directly
      if (data.unitId) {
        router.push(`/flower/${flowerId}/quiz/${data.unitId}`);
      }
    } catch (err) {
      console.error("Custom quiz failed:", err);
      alert("Failed to generate custom quiz. Please try again.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  if (loading || !flower) return null;

  const flowerColor = FLOWER_COLORS[flower.flower_type] || "#39AB54";
  const coreUnits = units.filter(u => !u.is_custom);
  const completedCount = coreUnits.filter((u) => u.completed).length;
  const isBloomed = flower.status === "bloomed";

  return (
    <div className="w-full h-[calc(100vh-80px)] px-4 py-4 lg:px-8 pointer-events-none relative flex justify-between overflow-hidden gap-4">
      
      {/* LEFT PANEL: Floating Sidebar */}
      <div className="w-full md:w-[420px] lg:w-[500px] xl:w-[620px] shrink-0 flex flex-col gap-4 animate-fade-in-up pointer-events-auto h-full overflow-y-auto pb-12 scrollbar-hide pr-2">
        
        {/* Navigation / Back */}
        <div className="flex items-center justify-between drop-shadow-sm">
          <Link href="/garden" className="inline-flex items-center gap-2 text-sm font-bold text-[#0D2419] hover:text-[#39AB54] transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200">
            <PiArrowLeftBold /> Back to Garden
          </Link>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2.5 rounded-full bg-white border border-gray-200 shadow-sm text-[#E8637A] hover:bg-[#E8637A]/20 transition-colors"
            title="Delete this flower"
          >
            <PiTrashBold className="text-lg" />
          </button>
        </div>

        {/* Main Info Card — with 3D model featured */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
          {/* 3D Model Hero */}
          <div className="relative h-[240px] bg-gradient-to-b from-[#E8F5E9] to-[#F0FBF1] overflow-hidden">
            {/* Decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[180px] h-[180px] rounded-full border border-[#39AB54]/10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[240px] h-[240px] rounded-full border border-[#39AB54]/06" />
            </div>
            {/* Ground glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[40px] bg-[#39AB54]/15 rounded-full blur-xl" />
            {/* 3D Flower */}
            <div className="absolute inset-0">
              <Flower3D
                flowerType={flower.flower_type}
                growthStage={flower.growth_stage}
                rarity={(flower.pot_rarity as Rarity) || "basic"}
                potColor={flower.pot_color || undefined}
                potVariant={1}
                size="full"
                interactive={true}
                disableZoom={true}
                showGround={false}
              />
            </div>
            {/* Stage label overlay */}
            <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 border border-white/60 shadow-sm">
              <span className="text-xs font-bold text-[#0D2419]">{GROWTH_LABELS[flower.growth_stage]}</span>
            </div>
            {/* Drag hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1 border border-white/50 shadow-sm pointer-events-none">
              <span className="text-[10px] font-medium text-[#0D2419]/60 font-mono">drag to rotate</span>
            </div>
          </div>

          {/* Card content */}
          <div className="p-7">
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-[#0D2419] tracking-tight leading-tight">{flower.topic_name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize rounded-full border-2 bg-black/5 px-3 py-1 font-bold" style={{ borderColor: flowerColor, color: flowerColor }}>{flower.flower_type}</Badge>
              <Badge variant="secondary" className={`rounded-full px-3 py-1 font-bold ${isBloomed ? "bg-primary-fixed text-on-primary-fixed" : "bg-black/5 text-[#0D2419]"}`}>
                {GROWTH_LABELS[flower.growth_stage]}
              </Badge>
            </div>

            {/* Pot Info */}
            {flower.growth_stage >= 4 && flower.pot_rarity && flower.pot_color && (() => {
              const rarityKey = flower.pot_rarity as Rarity;
              const config = RARITIES[rarityKey];
              // Map hex to a rough color name
              const potHex = flower.pot_color!.toUpperCase();
              const colorNames: Record<string, string> = {
                "#FF0000":"Red","#CC0000":"Crimson","#E60000":"Scarlet","#FF6600":"Orange","#FF9900":"Amber",
                "#FFCC00":"Gold","#FFFF00":"Yellow","#99FF00":"Lime","#00FF00":"Green","#00CC00":"Emerald",
                "#006600":"Forest","#00FFCC":"Mint","#00CCFF":"Sky","#0099FF":"Azure","#0033FF":"Blue",
                "#6600FF":"Violet","#CC00FF":"Purple","#FF00CC":"Magenta","#FF0099":"Rose","#FFFFFF":"Ivory",
                "#000000":"Obsidian","#888888":"Ash","#C0C0C0":"Silver","#8B4513":"Mahogany","#D2691E":"Cinnamon",
              };
              // Find closest by first matching prefix
              const colorName = colorNames[potHex] ??
                Object.entries(colorNames).find(([k]) => potHex.startsWith(k.slice(0,4)))?.[1] ??
                `${potHex} Tint`;
              const potName = `${colorName} ${config?.name ?? "Common"} Pot`;
              return (
                <div className="mt-4 flex items-center gap-3 bg-black/5 rounded-xl px-4 py-3 border border-black/5">
                  <div className="w-6 h-6 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-white/10 shrink-0" style={{ backgroundColor: flower.pot_color! }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold drop-shadow-sm truncate block" style={{ color: config?.color }}>{potName}</span>
                    <span className="text-[10px] font-mono text-[#0D2419]/50">{potHex}</span>
                  </div>
                </div>
              );
            })()}

            {/* Growth Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-[#0D2419] flex items-center gap-2">Growth Progress</span>
                <span className="font-bold text-primary-deep bg-[#C8EDCF] px-2 py-0.5 rounded-md text-xs shadow-sm">{completedCount}/{coreUnits.length} Units</span>
              </div>
              <div className="h-3 w-full rounded-full bg-black/10 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] relative border border-white/30">
                <div className="h-full rounded-full transition-all duration-1000 ease-out gradient-cta" style={{ width: `${(Math.max(0.05, flower.growth_stage / 4)) * 100}%` }} />
              </div>
            </div>
            
            {isBloomed && (
              <div className="mt-5 rounded-2xl bg-[#C8EDCF] p-4 text-center border text-[#1A4D2E] font-bold text-sm tracking-wide shadow-md">
                🌸 Flower is fully bloomed! Excellent work.
              </div>
            )}
          </div>
        </div>

        {/* ── FLOWER INFORMATION ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-heading text-base font-bold text-[#0D2419] mb-4 flex items-center gap-2">
            <PiPlantBold className="text-[#39AB54]" /> Flower Information
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Flower Type */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Type</span>
              <span className="font-bold text-[#0D2419] capitalize flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: flowerColor }} />
                {flower.flower_type}
              </span>
            </div>
            {/* Growth Stage */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Stage</span>
              <span className="font-bold text-[#0D2419]">{GROWTH_LABELS[flower.growth_stage]}</span>
              <span className="text-[10px] text-gray-400 ml-1">({flower.growth_stage}/4)</span>
            </div>
            {/* Units */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Lessons</span>
              <span className="font-bold text-[#0D2419]">{completedCount} <span className="font-normal text-gray-400">/ {coreUnits.length} done</span></span>
            </div>
            {/* Pot Rarity */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Pot</span>
              {flower.pot_rarity ? (
                <span className="font-bold capitalize" style={{ color: RARITIES[flower.pot_rarity as Rarity]?.color ?? "#0D2419" }}>
                  {RARITIES[flower.pot_rarity as Rarity]?.name ?? flower.pot_rarity}
                </span>
              ) : (
                <span className="font-bold text-gray-400">Seedling</span>
              )}
            </div>
          </div>
          {/* Status chip */}
          <div className={`mt-3 rounded-2xl px-4 py-2.5 text-sm font-bold flex items-center gap-2 ${isBloomed ? "bg-[#C8EDCF] text-[#1A4D2E]" : "bg-gray-50 text-gray-500 border border-gray-100"}`}>
            {isBloomed ? "🌸 Fully Bloomed — keep studying to maintain mastery!" : `🌱 ${4 - flower.growth_stage} more growth stage${4 - flower.growth_stage !== 1 ? "s" : ""} to full bloom`}
          </div>
        </div>

        {/* Areas to Review (Collapsible) */}
        <div className="rounded-3xl shadow-sm border border-gray-100 bg-white overflow-hidden transition-all duration-300">
          <button  
            onClick={() => setIsAreasOpen(!isAreasOpen)}
            className="w-full flex items-center justify-between p-6 hover:bg-black/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <PiWarningBold className="text-amber-500 text-lg shrink-0 drop-shadow-sm" />
              <h2 className="font-heading text-lg font-bold text-[#0D2419] drop-shadow-sm">Areas to Review</h2>
              {aggregatedWeakAreas.length > 0 && (
                <span className="rounded-full bg-amber-500/20 text-amber-700 text-xs font-bold px-2 py-0.5 ml-2 border border-amber-400/30">
                  {aggregatedWeakAreas.length} Found
                </span>
              )}
            </div>
            <PiCaretDownBold className={`text-[#0D2419] transition-transform duration-300 ${isAreasOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isAreasOpen && (
            <div className="px-6 pb-6 pt-2 animate-fade-in">
              {aggregatedWeakAreas.length === 0 ? (
                <p className="text-sm text-[#0D2419]/60 italic">No weak areas detected yet. Complete some quizzes and we&apos;ll highlight concepts to revisit here.</p>
              ) : (
                <>
                  <p className="text-sm text-[#0D2419]/80 mb-4 drop-shadow-sm">We noticed you struggled with these concepts. Generating a quiz will help you practice them!</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {aggregatedWeakAreas.map((area, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-[#0D2419] shadow-sm"
                      >
                        {area.concept}
                        {area.count > 1 && (
                          <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none shadow-sm">
                            {area.count}×
                          </span>
                        )}
                        <span className="text-amber-900/70 font-normal ml-1">· {area.unitTitle}</span>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => { setIsQuizModalOpen(true); setQuizTopics(aggregatedWeakAreas.map(a => a.concept)); }}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(245,158,11,0.4)] transition-all"
                  >
                    <PiPlantBold className="text-lg" /> Practice Weak Areas
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Custom Quiz Generator - opens modal */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#0D2419] flex items-center gap-2">
                <PiPlantBold className="text-[#39AB54]" /> Custom Quiz
              </h2>
              <p className="text-xs text-[#0D2419]/70 mt-1">Generate a quiz on exactly what you want to practice</p>
            </div>
            <button
              onClick={() => { setIsQuizModalOpen(true); setQuizTopics([""]); }}
              className="px-4 py-2 bg-[#39AB54] hover:bg-[#2d8a43] text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <PiPlusBold /> Generate
            </button>
          </div>
        </div>

        {/* Units Scroll List */}
        <div className="flex flex-col gap-4 mt-2">
          <h2 className="font-heading text-xl font-bold text-[#0D2419] bg-white px-6 py-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <PiBookOpenBold className="text-[#39AB54]" />
              Study Material
            </div>
            <span className="text-sm text-gray-400 font-medium">{coreUnits.length} Units</span>
          </h2>

          {units.map((unit, index) => (
            <div key={unit.id} className="group rounded-[1.5rem] bg-white shadow-sm p-5 transition-all hover:shadow-md border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
              {/* Unit Status Accent Bar */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${unit.completed ? "bg-[#39AB54]" : "bg-transparent"}`} />
              
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-lg shadow-sm transition-colors ${
                  unit.completed ? "bg-[#39AB54] text-white" : "bg-gray-50 text-gray-400 border border-gray-100"
                }`}>
                  {unit.completed ? "✓" : index + 1}
                </div>
                <div className="flex-1 mt-0.5 flex flex-col pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#39AB54] mb-1">
                    {unit.is_custom ? "Practice Quiz" : `Lesson ${coreUnits.indexOf(unit) + 1}`}
                  </span>
                  <h3 className="font-heading font-extrabold text-[#0D2419] text-[17px] leading-snug">{unit.title}</h3>
                </div>
              </div>

              <div className="flex gap-3 w-full mt-2">
                {!unit.is_custom && (
                  <Link href={`/flower/${flowerId}/units/${unit.id}`} className="flex-1">
                    <button className="w-full h-11 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#0D2419] font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200">
                      <PiBookOpenBold /> Read & Learn
                    </button>
                  </Link>
                )}
                <Link href={`/flower/${flowerId}/quiz/${unit.id}`} className={unit.is_custom ? "w-full" : "flex-1"}>
                  <button className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all border ${
                    unit.completed 
                      ? "bg-white text-[#39AB54] border-[#39AB54]/30 hover:bg-[#39AB54]/5" 
                      : "bg-[#39AB54] text-white border-[#39AB54] hover:bg-[#2d8a43]"
                  }`}>
                    <PiLightningBold /> {unit.completed ? "Retake Quiz" : "Take Quiz"}
                  </button>
                </Link>
              </div>
            </div>
          ))}

          {units.length > 0 && completedCount === units.length && !isBloomed && (
            <div className="mt-2 rounded-[1.5rem] bg-white shadow-sm p-6 border border-gray-100 flex flex-col gap-3 text-center items-center animate-fade-in-up">
              <h3 className="font-heading text-lg font-bold text-[#0D2419] drop-shadow-sm">Ready for Full Bloom?</h3>
              <p className="text-xs text-[#0D2419]/80 drop-shadow-sm">Pass the Mastery Test across all units to reach Stage 4!</p>
              <Link href={`/flower/${flowerId}/mastery`} className="w-full mt-2">
                <button className="w-full h-12 rounded-xl gradient-cta text-white font-bold text-base shadow-lg hover:shadow-xl transition-all border border-white/20">
                  Take Mastery Test 🌸
                </button>
              </Link>
            </div>
          )}

          {units.length === 0 && (
            <div className="rounded-3xl bg-white shadow-sm p-8 text-center border border-gray-100">
              <p className="text-[#0D2419] font-medium text-sm drop-shadow-sm">No units available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: AI Tutor Chat */}
      <div className="hidden lg:flex w-[400px] shrink-0 h-full animate-fade-in-up pb-12">
        <ChatTutor flowerId={flowerId} />
      </div>

      {/* Custom Quiz Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-auto" onClick={() => setIsQuizModalOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-gray-200 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-2xl font-black text-[#0D2419] flex items-center gap-2">
                  <PiPlantBold className="text-[#39AB54]" /> Custom Quiz
                </h2>
                <p className="text-sm text-[#0D2419]/70 mt-1">List the topics or concepts you want to be quizzed on</p>
              </div>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="h-9 w-9 rounded-full bg-black/5 hover:bg-black/10 transition-colors flex items-center justify-center text-[#0D2419]"
              >
                <PiXBold />
              </button>
            </div>

            {/* Topic inputs */}
            <div className="flex flex-col gap-3 mb-6">
              {quizTopics.map((topic, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-sm font-bold text-[#0D2419]/50 w-5 text-right shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => {
                      const updated = [...quizTopics];
                      updated[i] = e.target.value;
                      setQuizTopics(updated);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && topic.trim() && i === quizTopics.length - 1) {
                        setQuizTopics([...quizTopics, ""]);
                      }
                    }}
                    placeholder={`e.g. ${["mitosis phases", "Newton's laws", "photosynthesis", "quadratic equations"][i % 4]}`}
                    autoFocus={i === quizTopics.length - 1}
                    className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm text-[#0D2419] placeholder:text-[#0D2419]/30 focus:outline-none focus:ring-2 focus:ring-[#39AB54]/50 shadow-inner"
                  />
                  {quizTopics.length > 1 && (
                    <button
                      onClick={() => setQuizTopics(quizTopics.filter((_, j) => j !== i))}
                      className="h-9 w-9 shrink-0 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-colors"
                    >
                      <PiXBold className="text-sm" />
                    </button>
                  )}
                </div>
              ))}
              {quizTopics.length < 6 && (
                <button
                  onClick={() => setQuizTopics([...quizTopics, ""])}
                  className="self-start text-sm font-bold text-[#39AB54] hover:text-[#2d8a43] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#39AB54]/10 transition-colors"
                >
                  <PiPlusBold /> Add another topic
                </button>
              )}
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerateCustomQuiz}
              disabled={isGeneratingQuiz || !quizTopics.some(t => t.trim())}
              className="w-full h-13 py-3.5 rounded-2xl bg-[#39AB54] hover:bg-[#2d8a43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg"
            >
              {isGeneratingQuiz ? (
                <><PiSpinnerBold className="animate-spin text-xl" /> Generating your quiz...</>
              ) : (
                <><PiPlantBold className="text-xl" /> Generate & Start Quiz</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
