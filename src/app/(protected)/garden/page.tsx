"use client";

import { useEffect, useState, Suspense, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, DragControls, Grid, Billboard, Sky, Clouds, Cloud } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { FlowerModel } from "@/components/flower-3d";
import { FLOWER_EMOJI_MAP } from "@/components/flower-icons";
import { type Rarity } from "@/lib/rarity";
import { PiPlusBold, PiPottedPlantFill, PiPencilBold, PiCheckBold, PiListBold, PiXBold, PiCaretRightBold, PiSealCheckFill } from "react-icons/pi";
import { ProCelebration } from "@/components/pro-celebration";
import * as THREE from "three";

interface Flower {
  id: string;
  topic_name: string;
  flower_type: string;
  growth_stage: number;
  status: string;
  pattern_id: number;
  pot_rarity: string | null;
  pot_color: string | null;
  pot_variant?: number | null;
  pos_x?: number | null;
  pos_z?: number | null;
  created_at: string;
}

const GROWTH_LABELS = ["Seed", "Sprout", "Bud", "Opening", "Full Bloom"];
const FLOWER_COLORS: Record<string, string> = {
  rose:      "#CC2A1A",
  tulip:     "#3D5EE0",
  sunflower: "#F5C518",
  daisy:     "#FFFFFF",
  lily:      "#E8709A",
  lavender:  "#E8709A",
};

const GRID_SPACING = 3;

// --- Hedge Perimeter ---
function HedgePerimeter() {
  const hedgeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1A6830", roughness: 0.9 }),
    []
  );
  const side = (length: number, posX: number, posZ: number, rotY: number) =>
    Array.from({ length }).map((_, i) => {
      const jitter = 0.15 + (Math.sin(i * 7.3) * 0.5 + 0.5) * 0.3;
      return (
        <mesh
          key={i}
          position={[posX + (rotY === 0 ? -length + i * 2 : 0), 0.1 + jitter / 2, posZ + (rotY !== 0 ? -length + i * 2 : 0)]}
          material={hedgeMat}
          castShadow
        >
          <boxGeometry args={[1.8, 1.2 + jitter, 1.2]} />
        </mesh>
      );
    });

  return (
    <group position={[0, -0.6, 0]}>
      {side(16, 0, -15, 0)}
      {side(16, 0, 15, 0)}
      {side(16, -15, 0, 1)}
      {side(16, 15, 0, 1)}
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

  // Force position sync — reset matrix to identity so DragControls offset is cleared
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.matrix.identity();
      groupRef.current.matrix.setPosition(startX, 0, startZ);
      groupRef.current.matrix.decompose(
        groupRef.current.position,
        groupRef.current.quaternion,
        groupRef.current.scale
      );
    }
  }, [startX, startZ]);

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
        flowerType={flower.flower_type?.toLowerCase() || "daisy"}
        growthStage={flower.growth_stage}
        rarity={(flower.pot_rarity?.toLowerCase() as Rarity) ?? "basic"}
        potColor={flower.pot_color ?? undefined}
        potVariant={flower.pot_variant ?? 1}
        isEditorMode={isEditorMode}
      />

      <Billboard position={[0, 4.3, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.4} color="white" anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#2B1A0E">
          {flower.topic_name}
        </Text>
      </Billboard>
      <Billboard position={[0, 3.8, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.25} color={flowerColor} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#2B1A0E">
          {GROWTH_LABELS[flower.growth_stage]}
        </Text>
      </Billboard>
      {isEditorMode && (
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
           <planeGeometry args={[2.5, 2.5]} />
           <meshBasicMaterial color="#FFFF00" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );

  if (isEditorMode) {
    return (
      <DragControls
        axisLock="y"
        dragLimits={[[-14, 14], undefined, [-14, 14]]}
        onDragStart={() => { document.body.style.cursor = 'grabbing'; }}
        onDragEnd={() => {
          document.body.style.cursor = 'auto';
          if (groupRef.current) {
            const worldPos = new THREE.Vector3();
            groupRef.current.getWorldPosition(worldPos);
            onSave(flower.id, worldPos.x, worldPos.z);
          }
        }}
      >
        {content}
      </DragControls>
    );
  }

  return content;
}


function CameraController({
  isEditorMode,
  controlsRef,
}: {
  isEditorMode: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const normalPos = useMemo(() => new THREE.Vector3(0, 10, 20), []);
  const editorPos = useMemo(() => new THREE.Vector3(0, 28, 0.1), []);

  useFrame(() => {
    const target = isEditorMode ? editorPos : normalPos;
    const dist = camera.position.distanceTo(target);
    if (dist > 0.01) {
      camera.position.lerp(target, 0.06);
      controlsRef.current?.update();
    }
  });

  return null;
}

function GardenScene({ flowers, isEditorMode, onSavePosition, controlsRef }: { flowers: Flower[], isEditorMode: boolean, onSavePosition: (id: string, x: number, z: number) => void, controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const router = useRouter();
  const cols = 9; // Grid limits

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
      <pointLight position={[-3, 4, -3]} intensity={0.4} color="#C8EDCF" />
      
      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />

      {/* Atmospheric fog */}
      <fog attach="fog" args={["#BDE0F5", 20, 60]} />

      {/* Terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.65, 0]}
        receiveShadow
        onUpdate={(mesh) => {
          const geo = mesh.geometry as THREE.PlaneGeometry;
          const pos = geo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getY(i);
            pos.setZ(i, Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.3);
          }
          pos.needsUpdate = true;
          geo.computeVertexNormals();
        }}
      >
        <planeGeometry args={[80, 80, 50, 50]} />
        <meshStandardMaterial color="#4CAF60" roughness={1} />
      </mesh>

      {/* 3D Clouds */}
      <Clouds material={THREE.MeshLambertMaterial}>
        <Cloud position={[-15, 14, -20]} seed={1} segments={20} volume={8} color="white" fade={30} />
        <Cloud position={[20, 16, -15]}  seed={2} segments={15} volume={6} color="white" fade={25} />
        <Cloud position={[0, 18, -30]}   seed={3} segments={18} volume={10} color="white" fade={35} />
        <Cloud position={[-25, 15, 10]}  seed={4} segments={12} volume={7} color="white" fade={28} />
      </Clouds>

      {isEditorMode && (
         <Grid position={[1.5, -0.59, 1.5]} cellColor="#ffffff" sectionColor="#ffffff" sectionSize={GRID_SPACING} cellSize={GRID_SPACING} args={[30, 30]} />
      )}

      <HedgePerimeter />

      {flowers.map((flower, index) => {
        // Fallback default coordinates if pos_x/z are missing
        const row = Math.floor(index / cols);
        const col = index % cols;
        const defaultX = (col - 4) * GRID_SPACING;
        const defaultZ = (row - 4) * GRID_SPACING;

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

      <OrbitControls
        ref={controlsRef}
        enableRotate={!isEditorMode}
        enablePan={true}
        enableZoom={!isEditorMode}
        maxPolarAngle={isEditorMode ? Math.PI / 6 : Math.PI / 2 - 0.05}
        minDistance={3}
        maxDistance={35}
        target={[0, 0, 0]}
      />
      <CameraController isEditorMode={isEditorMode} controlsRef={controlsRef} />
    </>
  );
}

function GardenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const [dragRejectId, setDragRejectId] = useState<string | null>(null);
  const [showUpgradedToast, setShowUpgradedToast] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowUpgradedToast(true);
      setShowCelebration(true);
      // Verify-session fallback: ensure subscription is written even if webhook missed
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        fetch(`/api/stripe/verify-session?session_id=${sessionId}`).catch(() => {});
      }
      router.replace("/garden", { scroll: false });
      const t = setTimeout(() => setShowUpgradedToast(false), 6000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    async function loadGarden() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from("learner_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!profile) {
        router.push("/onboarding");
        return;
      }
      
      const { data: garden } = await supabase.from("gardens").select("id").eq("user_id", user.id).single();
      if (!garden) { setLoading(false); return; }
      
      const { data: flowersData } = await supabase.from("flowers").select("*").eq("garden_id", garden.id).order("created_at", { ascending: false });
      setFlowers(flowersData || []);
      setLoading(false);
    }
    loadGarden();
  }, []);

  const handleSavePosition = async (id: string, rawX: number, rawZ: number) => {
    // 10x10 Grid Snap Math
    const snapX = Math.round(rawX / GRID_SPACING) * GRID_SPACING;
    const snapZ = Math.round(rawZ / GRID_SPACING) * GRID_SPACING;
    
    // Bounds clamping (-12 to 12 limits to exactly 9x9 inner spots fitting within fence)
    const clampX = Math.max(-12, Math.min(12, snapX));
    const clampZ = Math.max(-12, Math.min(12, snapZ));

    // Collision Detection: Only 1 flower per grid square
    // Use actual positions (pos_x/pos_z are always set on creation now)
    const isOccupied = flowers.some(f => {
      if (f.id === id) return false;
      const fx = f.pos_x ?? null;
      const fz = f.pos_z ?? null;
      if (fx === null || fz === null) return false;
      return fx === clampX && fz === clampZ;
    });
    if (isOccupied) {
      // Reject coordinates, trigger a force re-render back to original state
      setDragRejectId(id);
      setTimeout(() => setDragRejectId(null), 100);
      return; // Abort save
    }

    // Optimistic UI update
    setFlowers(prev => prev.map(f => f.id === id ? { ...f, pos_x: clampX, pos_z: clampZ } : f));
    
    // DB persist
    const supabase = createClient();
    const { error } = await supabase.from("flowers").update({ pos_x: clampX, pos_z: clampZ }).eq("id", id);
    if (error) console.error("Failed to save collision-free position:", error);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-surface">
        <div className="mx-auto flex flex-col items-center gap-5">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg
              className="absolute inset-0 h-full w-full animate-spin"
              style={{ animationDuration: "2.5s", animationTimingFunction: "linear" }}
              viewBox="0 0 96 96"
            >
              <circle cx="48" cy="48" r="44" fill="none" stroke="#E8F5E9" strokeWidth="3" />
              <circle cx="48" cy="48" r="44" fill="none" stroke="#3BAB55" strokeWidth="3" strokeDasharray="60 220" strokeLinecap="round" />
            </svg>
            <img src="/bloomr_icon.svg" alt="Bloomr" className="relative z-10 h-10 w-10 drop-shadow-sm" />
          </div>
          <p className="text-[#3D2B1F] font-medium text-sm">Loading your garden...</p>
        </div>
      </div>
    );
  }

  if (flowers.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6 bg-surface-container-lowest animate-fade-in-up">
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

  // Pass dummy state to forcefully unmount/remount DragControls on reject so it resets visually
  const renderFlowers = dragRejectId ? flowers.map(f => ({...f, _refresh: Date.now()})) : flowers;

  return (
    <div className="w-full h-screen relative" style={{ background: "linear-gradient(to bottom, #BDE0F5 0%, #5AB4E5 60%, #3E9FD5 100%)" }}>
      {showCelebration && <ProCelebration onDone={() => setShowCelebration(false)} />}
      {/* Upgrade success toast */}
      {showUpgradedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1a6830] text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-[#39AB54]/30 border border-white/10 animate-fade-in-up">
          <PiSealCheckFill className="text-xl shrink-0 text-[#7FD99A]" />
          <p className="font-bold text-sm">Welcome to Pro! Enjoy unlimited access.</p>
          <button onClick={() => setShowUpgradedToast(false)} className="ml-2 text-white/50 hover:text-white">
            <PiXBold className="text-sm" />
          </button>
        </div>
      )}
      {/* 2D UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-10 pointer-events-none">
        
        <div className="flex flex-col gap-3">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-md border border-white/60 animate-fade-in-up">
            <h1 className="font-heading text-2xl font-black text-[#1c1c18] tracking-tight">My Garden</h1>
            <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
              {flowers.length} flower{flowers.length !== 1 ? "s" : ""} · {flowers.filter((f) => f.status === "bloomed").length} bloomed
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => { setIsEditorMode(!isEditorMode); setIsListView(false); }}
              className={`pointer-events-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all animate-fade-in-up border
                ${isEditorMode 
                  ? "bg-[#FFF9C4] text-[#D4722A] border-[#D4722A]/20 shadow-md" 
                  : "bg-white/90 text-[#1c1c18] border-white/60 hover:bg-white hover:shadow-md"}
              `}
            >
              {isEditorMode ? (
                <><PiCheckBold className="text-base" /> Done</>
              ) : (
                <><PiPencilBold className="text-base" /> Layout</>
              )}
            </button>

            <button 
              onClick={() => { setIsListView(!isListView); setIsEditorMode(false); }}
              className={`pointer-events-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all animate-fade-in-up border
                ${isListView 
                  ? "bg-[#D4E6F1] text-[#2980B9] border-[#2980B9]/20 shadow-md" 
                  : "bg-white/90 text-[#1c1c18] border-white/60 hover:bg-white hover:shadow-md"}
              `}
            >
              {isListView ? (
                <><PiCheckBold className="text-base" /> 3D View</>
              ) : (
                <><PiListBold className="text-base" /> List</>
              )}
            </button>
          </div>
        </div>
        
        <Link href="/upload" className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 gradient-cta text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all animate-fade-in-up">
          <PiPlusBold className="text-base" /> Plant New
        </Link>
      </div>

      {isListView && (
        <div className="absolute inset-x-3 inset-y-20 md:inset-x-16 md:inset-y-20 bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 ring-1 ring-white/20 z-20 pointer-events-auto flex flex-col overflow-hidden animate-fade-in-up">
          <div className="px-6 py-5 border-b border-white/20 flex justify-between items-center">
            <div>
              <h2 className="font-heading text-xl font-black text-white">All Flowers</h2>
              <p className="text-xs text-white/70 mt-0.5 font-medium">{flowers.length} total · {flowers.filter(f => f.status === 'bloomed').length} bloomed</p>
            </div>
            <button onClick={() => setIsListView(false)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-colors">
              <PiXBold className="text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5">
            {flowers.map((flower) => {
              const progress = (flower.growth_stage / 4) * 100;
              return (
                <Link key={flower.id} href={`/flower/${flower.id}`} className="group block bg-white/15 hover:bg-white/25 rounded-xl p-4 border border-white/20 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm" style={{ backgroundColor: `${FLOWER_COLORS[flower.flower_type?.toLowerCase() || "daisy"]}30`, color: FLOWER_COLORS[flower.flower_type?.toLowerCase() || "daisy"] }}>
                        {FLOWER_EMOJI_MAP[flower.flower_type?.toLowerCase()] ?? (flower.status === "bloomed" ? "🌸" : "🌱")}
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${flower.status === 'bloomed' ? 'bg-[#39AB54] animate-pulse' : 'bg-white/40'}`} />
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm group-hover:text-[#7FD99A] transition-colors truncate">{flower.topic_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-white/80 capitalize">
                            {flower.flower_type}
                          </span>
                          <span className="text-[10px] text-white/60 font-medium">{GROWTH_LABELS[flower.growth_stage]}</span>
                          {flower.pot_color && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full inline-block border border-white/20" style={{ backgroundColor: flower.pot_color }} />
                            </span>
                          )}
                        </div>
                        {/* Mini progress bar */}
                        <div className="mt-2 h-1.5 w-32 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full rounded-full gradient-cta transition-all duration-500" style={{ width: `${Math.max(5, progress)}%` }} />
                        </div>
                      </div>
                    </div>
                    <PiCaretRightBold className="text-white/30 group-hover:text-[#7FD99A] group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {isEditorMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none animate-fade-in-down z-10">
          <div className="bg-[#FFF9C4]/90 backdrop-blur-md text-[#D4722A] px-6 py-3 rounded-full text-sm font-extrabold tracking-wide border-2 border-[#D4722A]/30 shadow-xl flex items-center gap-2">
            <PiPencilBold className="text-lg animate-pulse" /> EDITOR MODE: Snap flowers to grid squares. Avoid overlaps.
          </div>
        </div>
      )}

      {/* 3D Scene */}
      <div className={`w-full h-full ${isEditorMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}>
        <Canvas camera={{ position: [0, 10, 20], fov: 45 }} shadows dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
          <Suspense fallback={null}>
            <GardenScene flowers={renderFlowers} isEditorMode={isEditorMode} onSavePosition={handleSavePosition} controlsRef={controlsRef} />
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

export default function GardenPage() {
  return (
    <Suspense>
      <GardenContent />
    </Suspense>
  );
}
