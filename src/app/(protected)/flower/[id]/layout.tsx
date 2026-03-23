"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const Flower3D = dynamic(
  () => import("@/components/flower-3d").then((mod) => ({ default: mod.Flower3D })),
  { ssr: false, loading: () => null }
);

interface Flower {
  flower_type: string;
  growth_stage: number;
  pattern_offset_x: number;
  pattern_offset_y: number;
}

export default function FlowerLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const flowerId = params.id as string;
  const [flower, setFlower] = useState<Flower | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Initial fetch
    supabase.from("flowers").select("flower_type, growth_stage, pattern_offset_x, pattern_offset_y").eq("id", flowerId).single()
      .then(({ data }) => { if (data) setFlower(data); });

    // Live update subscription
    const channel = supabase.channel(`layout_flower_${flowerId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'flowers', filter: `id=eq.${flowerId}` }, (payload) => {
        setFlower(payload.new as Flower);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [flowerId]);

  return (
    <div className="relative min-h-screen">
      {/* Background 3D Flower */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center pt-16">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container to-transparent z-0 opacity-50" />
        <div className="absolute inset-0 opacity-90 animate-fade-in pointer-events-auto">
          {flower && (
            <Suspense fallback={null}>
              <Flower3D
                flowerType={flower.flower_type}
                growthStage={flower.growth_stage}
                patternOffsetX={flower.pattern_offset_x}
                patternOffsetY={flower.pattern_offset_y}
                size="full"
                interactive={true}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* Floating Content rendered on top */}
      <div className="relative z-10 pointer-events-none h-full w-full">
        {children}
      </div>
    </div>
  );
}
