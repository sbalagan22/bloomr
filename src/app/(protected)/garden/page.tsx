"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { FlowerModel } from "@/components/flower-3d";
import { PiPlusBold, PiPottedPlantFill } from "react-icons/pi";

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

function GardenScene({ flowers }: { flowers: Flower[] }) {
  const router = useRouter();
  
  // Grid layout parameters
  const cols = Math.max(1, Math.ceil(Math.sqrt(flowers.length))); 
  const spacingX = 4;
  const spacingZ = 4;

  const centerZ = -((Math.ceil(flowers.length / cols) - 1) * spacingZ) / 2;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#C8EDCF" />
      
      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#6B4C35" roughness={1} />
        {/* Soft green tint overlay for grass feel */}
        <meshStandardMaterial color="#4A6538" roughness={0.9} transparent opacity={0.6} depthWrite={false}/>
      </mesh>

      {/* Grid of Flowers */}
      {flowers.map((flower, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = (col - (cols - 1) / 2) * spacingX;
        const z = -row * spacingZ;

        const flowerColor = FLOWER_COLORS[flower.flower_type] || "#39AB54";

        return (
          <group 
            key={flower.id} 
            position={[x, 0, z]} 
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/flower/${flower.id}`);
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            {/* Invisible Hitbox for easier clicking */}
            <mesh position={[0, 1, 0]} visible={false}>
              <cylinderGeometry args={[1.5, 1.5, 4, 8]} />
              <meshBasicMaterial opacity={0} transparent />
            </mesh>
            
            <FlowerModel 
              flowerType={flower.flower_type}
              growthStage={flower.growth_stage}
              patternOffsetX={flower.pattern_offset_x}
              patternOffsetY={flower.pattern_offset_y}
            />

            {/* Floating Name Label */}
            <Text
              position={[0, 3.5, 0]}
              fontSize={0.4}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.04}
              outlineColor="#2B1A0E"
            >
              {flower.topic_name}
            </Text>
            {/* Floating Stage Label */}
            <Text
              position={[0, 3.0, 0]}
              fontSize={0.25}
              color={flowerColor}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#2B1A0E"
            >
              {GROWTH_LABELS[flower.growth_stage]}
            </Text>
          </group>
        );
      })}

      <OrbitControls 
        makeDefault
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={3}
        maxDistance={30}
        target={[0, 0, centerZ]}
      />
    </>
  );
}

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
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-surface-container-lowest">
        <div className="mx-auto flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-primary-fixed/30" />
          <p className="text-on-surface-variant font-medium animate-pulse">Loading your garden...</p>
        </div>
      </div>
    );
  }

  if (flowers.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center px-6 bg-surface-container-lowest animate-fade-in-up">
        <div className="text-center max-w-md bg-white/70 backdrop-blur-xl p-10 rounded-3xl pebble-shadow border border-white/40">
          <PiPottedPlantFill className="text-7xl text-[#39AB54]/80 mx-auto mb-6 drop-shadow-sm" />
          <h1 className="font-heading text-3xl font-extrabold text-[#3D2B1F] mb-3 tracking-tight">Your garden awaits</h1>
          <p className="text-[#6B4C35] mb-8 leading-relaxed">
            Upload your first lecture slides or notes and plant your first seed. Navigate your 3D garden as it blooms.
          </p>
          <Link href="/upload" className="inline-flex items-center gap-2 px-8 py-4 gradient-cta text-white rounded-full font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            <PiPottedPlantFill className="text-xl" /> Plant Your First Flower
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] relative bg-[#A4D5EA]">
      {/* 2D UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="pointer-events-auto bg-white/85 backdrop-blur-xl px-7 py-5 rounded-3xl pebble-shadow border border-white/50 animate-fade-in-up">
          <h1 className="font-heading text-3xl font-extrabold text-[#3D2B1F] tracking-tight">My Garden</h1>
          <p className="text-sm text-[#6B4C35] mt-1 font-medium">
            {flowers.length} flower{flowers.length !== 1 ? "s" : ""} • {flowers.filter((f) => f.status === "bloomed").length} bloomed
          </p>
        </div>
        
        <Link href="/upload" className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 gradient-cta text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all animate-fade-in-up">
          <PiPlusBold className="text-lg" /> Plant New
        </Link>
      </div>

      {/* 3D Scene */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [0, 6, 12], fov: 45 }} shadows dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <GardenScene flowers={flowers} />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Hint Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none animate-fade-in-up">
        <div className="bg-black/40 backdrop-blur-md text-white/90 px-6 py-2.5 rounded-full text-xs font-medium tracking-wide border border-white/10 shadow-xl">
          Drag to look around • Click a flower to study
        </div>
      </div>
    </div>
  );
}
