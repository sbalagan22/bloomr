"use client";

import { useEffect, useState, Suspense, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, DragControls } from "@react-three/drei";
import { FlowerModel } from "@/components/flower-3d";
import { PiPlusBold, PiPottedPlantFill, PiPencilBold, PiCheckBold } from "react-icons/pi";
import * as THREE from "three";

interface Flower {
  id: string;
  topic_name: string;
  flower_type: string;
  growth_stage: number;
  status: string;
  pattern_id: number;
  pattern_offset_x: number;
  pattern_offset_y: number;
  pos_x?: number | null;
  pos_z?: number | null;
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

// --- Fences ---
function FencePerimeter() {
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7B5539", roughness: 0.9 }), []);
  return (
    <group position={[0, -0.6, 0]}>
      {/* Rails */}
      <mesh position={[0, 0.5, -15]} material={material} castShadow><boxGeometry args={[30.5, 0.2, 0.1]} /></mesh>
      <mesh position={[0, 0.5, 15]} material={material} castShadow><boxGeometry args={[30.5, 0.2, 0.1]} /></mesh>
      <mesh position={[-15, 0.5, 0]} material={material} castShadow><boxGeometry args={[0.1, 0.2, 30.5]} /></mesh>
      <mesh position={[15, 0.5, 0]} material={material} castShadow><boxGeometry args={[0.1, 0.2, 30.5]} /></mesh>
      
      <mesh position={[0, 0.25, -15]} material={material} castShadow><boxGeometry args={[30.5, 0.15, 0.05]} /></mesh>
      <mesh position={[0, 0.25, 15]} material={material} castShadow><boxGeometry args={[30.5, 0.15, 0.05]} /></mesh>
      <mesh position={[-15, 0.25, 0]} material={material} castShadow><boxGeometry args={[0.05, 0.15, 30.5]} /></mesh>
      <mesh position={[15, 0.25, 0]} material={material} castShadow><boxGeometry args={[0.05, 0.15, 30.5]} /></mesh>

      {/* Posts */}
      {Array.from({length: 16}).map((_, i) => (
        <mesh key={`pt-n-${i}`} position={[-15 + i*2, 0.25, -15]} material={material} castShadow><boxGeometry args={[0.3, 1, 0.3]} /></mesh>
      ))}
      {Array.from({length: 16}).map((_, i) => (
        <mesh key={`pt-s-${i}`} position={[-15 + i*2, 0.25, 15]} material={material} castShadow><boxGeometry args={[0.3, 1, 0.3]} /></mesh>
      ))}
      {Array.from({length: 14}).map((_, i) => (
        <mesh key={`pt-w-${i}`} position={[-15, 0.25, -13 + i*2]} material={material} castShadow><boxGeometry args={[0.3, 1, 0.3]} /></mesh>
      ))}
      {Array.from({length: 14}).map((_, i) => (
        <mesh key={`pt-e-${i}`} position={[15, 0.25, -13 + i*2]} material={material} castShadow><boxGeometry args={[0.3, 1, 0.3]} /></mesh>
      ))}
    </group>
  );
}

// --- Draggable Flower ---
function DraggableFlower({ 
  flower, isEditorMode, onSave, onNavigate, defaultX, defaultZ 
}: { 
  flower: Flower; isEditorMode: boolean; onSave: (id: string, x: number, z: number) => void; onNavigate: () => void; defaultX: number; defaultZ: number 
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Use DB positions if available, otherwise structural grid fallback
  const startX = flower.pos_x ?? defaultX;
  const startZ = flower.pos_z ?? defaultZ;

  const flowerColor = FLOWER_COLORS[flower.flower_type] || "#39AB54";

  const content = (
    <group 
      ref={groupRef}
      position={[startX, 0, startZ]} 
      onClick={(e) => {
        if (isEditorMode) return;
        e.stopPropagation();
        onNavigate();
      }}
      onPointerOver={() => { if(!isEditorMode) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { if(!isEditorMode) document.body.style.cursor = 'auto'; }}
    >
      <mesh position={[0, 1, 0]} visible={false}>
        <cylinderGeometry args={[1.5, 1.5, 4, 8]} />
        <meshBasicMaterial opacity={0} transparent />
      </mesh>
      
      <FlowerModel 
        flowerType={flower.flower_type}
        growthStage={flower.growth_stage}
        patternOffsetX={flower.pattern_offset_x}
        patternOffsetY={flower.pattern_offset_y}
        isEditorMode={isEditorMode} // stops the spinning animation during edit
      />

      <Text position={[0, 4.3, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#2B1A0E">
        {flower.topic_name}
      </Text>
      <Text position={[0, 3.8, 0]} fontSize={0.25} color={flowerColor} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#2B1A0E">
        {GROWTH_LABELS[flower.growth_stage]}
      </Text>
      {isEditorMode && (
        <Text position={[0, -0.4, 1.5]} fontSize={0.2} color="#FFFF00" rotation={[-Math.PI / 2, 0, 0]} outlineWidth={0.02} outlineColor="#000000">
          DRAG ME
        </Text>
      )}
    </group>
  );

  if (isEditorMode) {
    return (
      <DragControls 
        axisLock="y" 
        dragLimits={[[-14, 14], [-10, 10], [-14, 14]]}
        onDragStart={() => { document.body.style.cursor = 'grabbing'; }}
        onDragEnd={() => { 
          document.body.style.cursor = 'auto';
          if (groupRef.current) {
             onSave(flower.id, groupRef.current.position.x, groupRef.current.position.z);
          }
        }}
      >
        {content}
      </DragControls>
    );
  }

  return content;
}


function GardenScene({ flowers, isEditorMode, onSavePosition }: { flowers: Flower[], isEditorMode: boolean, onSavePosition: (id: string, x: number, z: number) => void }) {
  const router = useRouter();
  const cols = Math.max(1, Math.ceil(Math.sqrt(flowers.length))); 
  const spacing = 4;
  const centerZ = -((Math.ceil(flowers.length / cols) - 1) * spacing) / 2;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#C8EDCF" />
      
      {/* Massive Grass Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#39AB54" roughness={1} />
      </mesh>

      <FencePerimeter />

      {flowers.map((flower, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const defaultX = (col - (cols - 1) / 2) * spacing;
        const defaultZ = -row * spacing;

        return (
          <DraggableFlower
            key={flower.id}
            flower={flower}
            isEditorMode={isEditorMode}
            onNavigate={() => router.push(`/flower/${flower.id}`)}
            onSave={onSavePosition}
            defaultX={defaultX}
            defaultZ={defaultZ}
          />
        );
      })}

      {/* When editing, strictly lock the camera so dragging flowers doesn't drag the screen. */}
      {isEditorMode ? (
        <OrbitControls makeDefault enabled={false} target={[0, 0, centerZ]} />
      ) : (
        <OrbitControls 
          makeDefault
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={30}
          target={[0, 0, centerZ]}
        />
      )}
    </>
  );
}

export default function GardenPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorMode, setIsEditorMode] = useState(false);

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

  const handleSavePosition = async (id: string, x: number, z: number) => {
    // Optimistic UI update
    setFlowers(prev => prev.map(f => f.id === id ? { ...f, pos_x: x, pos_z: z } : f));
    
    // DB persist — will silently fail if user hasn't run the migration yet, but UI works.
    const supabase = createClient();
    const { error } = await supabase.from("flowers").update({ pos_x: x, pos_z: z }).eq("id", id);
    if (error) console.error("Failed to save position:", error);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#A4D5EA]">
        <div className="mx-auto flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-white/50" />
          <p className="text-[#3D2B1F] font-bold animate-pulse">Loading your garden...</p>
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
        
        <div className="flex flex-col gap-4">
          <div className="pointer-events-auto bg-white/85 backdrop-blur-xl px-7 py-5 rounded-3xl pebble-shadow border border-white/50 animate-fade-in-up">
            <h1 className="font-heading text-3xl font-extrabold text-[#3D2B1F] tracking-tight">My Garden</h1>
            <p className="text-sm text-[#6B4C35] mt-1 font-medium">
              {flowers.length} flower{flowers.length !== 1 ? "s" : ""} • {flowers.filter((f) => f.status === "bloomed").length} bloomed
            </p>
          </div>

          <button 
            onClick={() => setIsEditorMode(!isEditorMode)}
            className={`pointer-events-auto flex items-center justify-center w-fit gap-2 px-6 py-3 rounded-full font-bold shadow-md transition-all animate-fade-in-up border-2
              ${isEditorMode ? "bg-[#FFF9C4] text-[#D4722A] border-[#D4722A]/30 pebbl-shadow" : "bg-white/90 text-[#3D2B1F] border-transparent hover:bg-white"}
            `}
          >
            {isEditorMode ? (
              <><PiCheckBold className="text-lg" /> Done Editing</>
            ) : (
              <><PiPencilBold className="text-lg" /> Edit Layout</>
            )}
          </button>
        </div>
        
        <Link href="/upload" className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 gradient-cta text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all animate-fade-in-up">
          <PiPlusBold className="text-lg" /> Plant New
        </Link>
      </div>

      {isEditorMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none animate-fade-in-down z-10">
          <div className="bg-[#FFF9C4]/90 backdrop-blur-md text-[#D4722A] px-6 py-3 rounded-full text-sm font-extrabold tracking-wide border-2 border-[#D4722A]/30 shadow-xl flex items-center gap-2">
            <PiPencilBold className="text-lg animate-pulse" /> EDITING MODE ACTIVE: Drag flowers to move them.
          </div>
        </div>
      )}

      {/* 3D Scene */}
      <div className={`w-full h-full ${isEditorMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}>
        <Canvas camera={{ position: [0, 8, 16], fov: 45 }} shadows dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <GardenScene flowers={flowers} isEditorMode={isEditorMode} onSavePosition={handleSavePosition} />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Hint Overlay (Only when not editing) */}
      {!isEditorMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none animate-fade-in-up transition-opacity">
          <div className="bg-black/40 backdrop-blur-md text-white/90 px-6 py-2.5 rounded-full text-xs font-medium tracking-wide border border-white/10 shadow-xl">
            Drag to look around • Click a flower to study
          </div>
        </div>
      )}
    </div>
  );
}
