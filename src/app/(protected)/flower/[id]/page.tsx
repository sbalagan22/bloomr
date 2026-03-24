"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { PiBookOpenBold, PiLightningBold, PiArrowLeftBold, PiTrashBold } from "react-icons/pi";

interface Flower {
  id: string;
  topic_name: string;
  flower_type: string;
  growth_stage: number;
  status: string;
}

interface Unit {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
}

const GROWTH_LABELS = ["Seed", "Sprout", "Bud", "Opening", "Full Bloom"];
const FLOWER_COLORS: Record<string, string> = {
  sunflower: "#F5D03B",
  tulip: "#E8637A",
  lily: "#FFF5E6",
  hydrangea: "#7C6CC4",
  magnolia: "#FDF8EF",
};

export default function FlowerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const flowerId = params.id as string;

  const [flower, setFlower] = useState<Flower | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    async function loadData() {
      const { data: flowerData } = await supabase.from("flowers").select("id, topic_name, flower_type, growth_stage, status").eq("id", flowerId).single();
      if (!flowerData) { router.push("/garden"); return; }
      setFlower(flowerData);
      
      const { data: unitsData } = await supabase.from("units").select("id, title, order_index, completed").eq("flower_id", flowerId).order("order_index");
      setUnits(unitsData || []);
      setLoading(false);
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

  if (loading || !flower) return null;

  const flowerColor = FLOWER_COLORS[flower.flower_type] || "#39AB54";
  const completedCount = units.filter((u) => u.completed).length;
  const isBloomed = flower.status === "bloomed";

  return (
    <div className="w-full h-[calc(100vh-64px)] px-6 py-6 lg:px-12 pointer-events-none relative flex items-start overflow-hidden">
      
      {/* LEFT PANEL: Floating Sidebar */}
      <div className="w-full md:w-[450px] flex flex-col gap-6 animate-fade-in-up pointer-events-auto h-full overflow-y-auto pb-12 scrollbar-hide pr-4">
        
        {/* Navigation / Back */}
        <div className="flex items-center justify-between">
          <Link href="/garden" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary-deep transition-colors bg-white/70 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-sm border border-white/40">
            <PiArrowLeftBold /> Back to Garden
          </Link>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/40 text-[#E8637A] hover:bg-[#E8637A]/10 transition-colors pebble-shadow"
            title="Delete this flower"
          >
            <PiTrashBold className="text-lg" />
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-surface/85 backdrop-blur-xl pebble-shadow rounded-3xl p-8 border border-white/20">
          <h1 className="font-heading text-3xl font-extrabold text-on-surface tracking-tight leading-tight">{flower.topic_name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize rounded-full border-2 bg-white/50 px-3 py-1" style={{ borderColor: flowerColor, color: flowerColor }}>{flower.flower_type}</Badge>
            <Badge variant="secondary" className={`rounded-full px-3 py-1 font-bold ${isBloomed ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container-high text-on-surface-variant"}`}>
              {GROWTH_LABELS[flower.growth_stage]}
            </Badge>
          </div>

          {/* Growth Progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-on-surface flex items-center gap-2">Growth Progress</span>
              <span className="font-bold text-primary-deep bg-primary-deep/10 px-2 py-0.5 rounded-md text-xs">{completedCount}/{units.length} Units</span>
            </div>
            <div className="h-4 w-full rounded-full bg-surface-container-high overflow-hidden shadow-inner relative">
              <div className="h-full rounded-full transition-all duration-1000 ease-out gradient-cta" style={{ width: `${(Math.max(0.05, flower.growth_stage / 4)) * 100}%` }} />
            </div>
          </div>
          
          {isBloomed && (
            <div className="mt-6 rounded-2xl bg-primary-fixed/20 p-4 text-center border border-primary-fixed/30 text-primary-deep font-bold text-sm tracking-wide">
              🌸 Flower is fully bloomed! Excellent work.
            </div>
          )}
        </div>

        {/* Units Scroll List */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-bold text-on-surface bg-surface/85 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/20 pebble-shadow flex items-center gap-2 sticky top-0 z-10">
            Study Material
          </h2>

          {units.map((unit, index) => (
            <div key={unit.id} className="group rounded-[1.5rem] bg-surface/90 backdrop-blur-md pebble-shadow p-5 transition-all hover:scale-[1.02] border border-white/20 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-sm ${
                  unit.completed ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container-highest text-on-surface-variant"
                }`}>
                  {unit.completed ? "✓" : index + 1}
                </div>
                <div className="flex-1 mt-0.5 flex flex-col">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#39AB54] mb-1">Chapter {index + 1}</span>
                  <h3 className="font-heading font-extrabold text-[#3D2B1F] text-[16px] leading-snug">{unit.title}</h3>
                </div>
              </div>

              <div className="flex gap-2 w-full mt-1">
                <Link href={`/flower/${flowerId}/units/${unit.id}`} className="flex-1">
                  <button className="w-full h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    <PiBookOpenBold /> Study
                  </button>
                </Link>
                <Link href={`/flower/${flowerId}/quiz/${unit.id}`} className="flex-1">
                  <button className="w-full h-10 rounded-xl gradient-cta text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all">
                    <PiLightningBold /> Quiz
                  </button>
                </Link>
              </div>
            </div>
          ))}

          {units.length > 0 && completedCount === units.length && !isBloomed && (
            <div className="mt-2 rounded-[1.5rem] bg-surface/90 backdrop-blur-md pebble-shadow p-6 border-2 border-primary-deep/50 flex flex-col gap-3 text-center items-center animate-fade-in-up">
              <h3 className="font-heading text-lg font-bold text-on-surface">Ready for Full Bloom?</h3>
              <p className="text-xs text-on-surface-variant">Pass the Mastery Test across all units to reach Stage 4!</p>
              <Link href={`/flower/${flowerId}/mastery`} className="w-full mt-2">
                <button className="w-full h-12 rounded-xl gradient-cta text-white font-bold text-base shadow-lg hover:shadow-xl transition-all">
                  Take Mastery Test 🌸
                </button>
              </Link>
            </div>
          )}

          {units.length === 0 && (
            <div className="rounded-3xl bg-surface/50 backdrop-blur-md p-8 text-center border border-white/20 pebble-shadow">
              <p className="text-on-surface-variant font-medium text-sm">No units available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
