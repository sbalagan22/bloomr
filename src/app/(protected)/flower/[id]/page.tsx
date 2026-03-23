"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { PiBookOpenBold, PiLightningBold, PiArrowLeftBold } from "react-icons/pi";

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
  rose: "#E8637A",
  tulip: "#F4A44E",
  sunflower: "#F5D03B",
  daisy: "#A8D8EA",
  lavender: "#B09FD8",
};

export default function FlowerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const flowerId = params.id as string;

  const [flower, setFlower] = useState<Flower | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFlower() {
      const supabase = createClient();
      const { data: flowerData } = await supabase.from("flowers").select("id, topic_name, flower_type, growth_stage, status").eq("id", flowerId).single();
      if (!flowerData) { router.push("/garden"); return; }
      setFlower(flowerData);
      const { data: unitsData } = await supabase.from("units").select("id, title, order_index, completed").eq("flower_id", flowerId).order("order_index");
      setUnits(unitsData || []);
      setLoading(false);
    }
    loadFlower();
  }, [flowerId, router]);

  if (loading || !flower) return null;

  const flowerColor = FLOWER_COLORS[flower.flower_type] || "#39AB54";
  const completedCount = units.filter((u) => u.completed).length;
  const isBloomed = flower.status === "bloomed";

  return (
    <div className="w-full h-[calc(100vh-64px)] px-6 py-6 lg:px-12 pointer-events-none relative flex items-start overflow-hidden">
      
      {/* LEFT PANEL: Floating Sidebar */}
      <div className="w-full md:w-[450px] flex flex-col gap-6 animate-fade-in-up pointer-events-auto h-full overflow-y-auto pb-12 scrollbar-hide pr-4">
        
        {/* Navigation / Back */}
        <Link href="/garden" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary-deep transition-colors bg-white/70 backdrop-blur-xl px-5 py-2.5 rounded-full w-fit shadow-sm border border-white/40">
          <PiArrowLeftBold /> Back to Garden
        </Link>

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
            <div className="h-4 w-full rounded-full bg-surface-container-high overflow-hidden shadow-inner">
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
                <div className="flex-1 mt-0.5">
                  <h3 className="font-heading font-bold text-on-surface text-[15px] leading-snug">{unit.title}</h3>
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
