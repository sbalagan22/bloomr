"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { PiFlowerBold, PiPlusBold, PiPottedPlantFill } from "react-icons/pi";

const Flower3D = dynamic(
  () => import("@/components/flower-3d").then((mod) => ({ default: mod.Flower3D })),
  { ssr: false, loading: () => <div className="h-32 w-32 animate-pulse rounded-full bg-primary-fixed/20 mx-auto" /> }
);

interface Flower {
  id: string;
  topic_name: string;
  flower_type: string;
  growth_stage: number;
  status: string;
  pattern_id: number;
  pattern_offset_x: number;
  pattern_offset_y: number;
  created_at: string;
}

const GROWTH_LABELS = ["Seed", "Sprout", "Bud", "Opening", "Full Bloom"];
const FLOWER_COLORS: Record<string, string> = {
  rose: "#E8637A",
  tulip: "#F4A44E",
  sunflower: "#F5D03B",
  daisy: "#A8D8EA",
  lavender: "#B09FD8",
};

export default function GardenPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGarden() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: garden } = await supabase.from("gardens").select("id").eq("user_id", user.id).single();
      if (!garden) { setLoading(false); return; }
      const { data: flowersData } = await supabase.from("flowers").select("*").eq("garden_id", garden.id).order("created_at", { ascending: false });
      setFlowers(flowersData || []);
      setLoading(false);
    }
    loadGarden();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-primary-fixed/20" />
      </div>
    );
  }

  if (flowers.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 animate-fade-in-up">
        <div className="text-center max-w-md">
          <PiPottedPlantFill className="text-7xl text-primary-deep/20 mx-auto mb-6" />
          <h1 className="font-heading text-3xl font-extrabold text-on-surface mb-3 tracking-tight">Your garden awaits</h1>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            Upload your first lecture and plant your first seed. Watch it grow as you learn.
          </p>
          <Link href="/upload" className="inline-flex items-center gap-2 px-8 py-4 gradient-cta text-white rounded-full font-bold text-base pebble-shadow hover:scale-105 transition-transform">
            <PiPottedPlantFill className="text-xl" /> Plant Your First Flower
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-on-surface tracking-tight">My Garden</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {flowers.length} flower{flowers.length !== 1 ? "s" : ""} • {flowers.filter((f) => f.status === "bloomed").length} bloomed
          </p>
        </div>
        <Link href="/upload" className="flex items-center gap-2 px-5 py-2.5 gradient-cta text-white rounded-full font-bold text-sm hover:shadow-lg transition-all">
          <PiPlusBold /> New Flower
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {flowers.map((flower, index) => {
          const flowerColor = FLOWER_COLORS[flower.flower_type] || "#39AB54";
          return (
            <Link key={flower.id} href={`/flower/${flower.id}`}>
              <div
                className="group bg-surface-container-lowest pebble-shadow rounded-2xl transition-all hover:scale-[1.02] cursor-pointer overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-center bg-surface-container-low pt-4 pb-2">
                  <Suspense fallback={<div className="h-32 w-32 rounded-full animate-pulse" style={{ backgroundColor: `${flowerColor}15` }} />}>
                    <Flower3D flowerType={flower.flower_type} growthStage={flower.growth_stage} patternOffsetX={flower.pattern_offset_x} patternOffsetY={flower.pattern_offset_y} size="sm" interactive={false} />
                  </Suspense>
                </div>
                <div className="p-5">
                  <h3 className="font-heading font-bold text-on-surface text-base truncate">{flower.topic_name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize text-xs rounded-full" style={{ borderColor: flowerColor, color: flowerColor }}>{flower.flower_type}</Badge>
                    <Badge variant="secondary" className={`text-xs rounded-full ${flower.status === "bloomed" ? "bg-primary-fixed text-on-primary-fixed" : ""}`}>
                      {GROWTH_LABELS[flower.growth_stage]}
                    </Badge>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
                    <div className="h-full rounded-full transition-all gradient-cta" style={{ width: `${(flower.growth_stage / 4) * 100}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
