"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { createClient } from "@/lib/supabase/client";

interface Flower3DProps {
  flowerType: string;
  growthStage: number;
  patternOffsetX?: number;
  patternOffsetY?: number;
  size?: "sm" | "md" | "lg" | "full";
  interactive?: boolean;
}

const FLOWER_COLORS: Record<string, { petal: string; accent: string }> = {
  rose: { petal: "#E8637A", accent: "#C2334F" },
  tulip: { petal: "#F4A44E", accent: "#D4722A" },
  sunflower: { petal: "#F5D03B", accent: "#2B1A0E" },
  daisy: { petal: "#FFFFFF", accent: "#F5D03B" },
  lavender: { petal: "#B09FD8", accent: "#7B6CB5" },
};

/* --- The Stage 4 Exclusive CS:GO Pot --- */
function CSGOPot({ offsetX, offsetY }: { offsetX: number, offsetY: number }) {
  // A sleek, stylized pot. The shader material uses offset values to slide across a vibrant color spectrum,
  // representing the unique CSGO-style "drop" wrapping the pot.
  const potMaterial = useMemo(() => {
    // Generate a unique color tint based on the offsets
    const hue = (offsetX + offsetY) % 1; // 0 to 1
    const saturation = 0.6 + (offsetX * 0.4); // 0.6 to 1.0
    const lightness = 0.4 + (offsetY * 0.4); // 0.4 to 0.8
    const baseColor = new THREE.Color().setHSL(hue, saturation, lightness);
    
    // In the future, this is where the `useTexture` map would go for a custom image wrapper.
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.2,
      metalness: 0.6,
      envMapIntensity: 1.5,
    });
  }, [offsetX, offsetY]);

  const innerSoilMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2B1A0E", roughness: 1 }), []);

  return (
    <group position={[0, -0.4, 0]}>
      {/* Outer Ceramic Pot */}
      <mesh material={potMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.4, 0.7, 32, 1, false]} />
      </mesh>
      {/* Pot Rim */}
      <mesh material={potMaterial} position={[0, 0.35, 0]} castShadow>
        <torusGeometry args={[0.5, 0.05, 16, 32]} />
      </mesh>
      {/* Top Soil Layer */}
      <mesh material={innerSoilMaterial} position={[0, 0.32, 0]} receiveShadow>
        <cylinderGeometry args={[0.48, 0.48, 0.02, 32]} />
      </mesh>
    </group>
  );
}

/* --- Natural Meshes (No Offsets) --- */

function RoseBloom({ growthStage, color }: { growthStage: number, color: string }) {
  const layers = growthStage >= 4 ? 6 : growthStage >= 3 ? 3 : 0;
  const spread = growthStage >= 4 ? 1.0 : 0.6;
  if (!layers) return null;

  return (
    <group position={[0, 1.4, 0]}>
      {Array.from({ length: layers * 4 }).map((_, i) => {
        const radius = 0.05 + (i * 0.02) * spread;
        const angle = i * 2.4; 
        const height = (layers * 4 - i) * 0.015;
        const petalScale = 0.15 + (i * 0.008);
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, height - 0.2, Math.sin(angle) * radius]} rotation={[Math.sin(angle) * 0.2 * spread, angle + Math.PI / 2, Math.PI / 6 * spread]} castShadow>
            <sphereGeometry args={[petalScale, 12, 8, 0, Math.PI, 0, Math.PI]} />
            <meshStandardMaterial color={color} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </group>
  );
}

function TulipBloom({ growthStage, color }: { growthStage: number, color: string }) {
  if (growthStage < 3) return null;
  const spread = growthStage >= 4 ? 0.3 : 0.05;

  return (
    <group position={[0, 1.2, 0]}>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.08 * spread, 0.2, Math.sin(angle) * 0.08 * spread]} rotation={[spread, angle, 0]} scale={[1, 1.4, 1]} castShadow>
            <cylinderGeometry args={[0.1, 0.01, 0.4, 12, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={color} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </group>
  );
}

function SunflowerBloom({ growthStage }: { growthStage: number }) {
  if (growthStage < 3) return null;
  const numPetals = growthStage >= 4 ? 24 : 12;

  return (
    <group position={[0, 1.4, 0]} rotation={[Math.PI / 6, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 32]} />
        <meshStandardMaterial color="#2B1A0E" roughness={0.9} />
      </mesh>
      {Array.from({ length: numPetals }).map((_, i) => {
        const angle = (i / numPetals) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.28, Math.sin(angle) * 0.28, 0]} rotation={[0, 0, angle]} scale={[3.5, 0.5, 0.1]} castShadow>
            <sphereGeometry args={[0.08, 8, 4]} />
            <meshStandardMaterial color="#F5D03B" roughness={0.4} />
          </mesh>
        )
      })}
    </group>
  );
}

function DaisyBloom({ growthStage }: { growthStage: number }) {
  if (growthStage < 3) return null;
  const numPetals = growthStage >= 4 ? 16 : 8;

  return (
    <group position={[0, 1.4, 0]} rotation={[Math.PI / 6, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
        <meshStandardMaterial color="#F5D03B" roughness={0.3} />
      </mesh>
      {Array.from({ length: numPetals }).map((_, i) => {
        const angle = (i / numPetals) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, 0]} rotation={[0, 0, angle]} scale={[3.5, 0.6, 0.1]} castShadow>
            <sphereGeometry args={[0.05, 8, 4]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
        )
      })}
    </group>
  );
}

function LavenderBloom({ growthStage, color }: { growthStage: number, color: string }) {
  const clusters = growthStage >= 4 ? 10 : growthStage >= 3 ? 5 : 0;
  if (!clusters) return null;

  return (
    <group position={[0, 1.0, 0]}>
      <mesh material={new THREE.MeshStandardMaterial({ color: "#2A8040", roughness: 0.6 })} castShadow>
         <cylinderGeometry args={[0.015, 0.02, 0.8, 8]} />
      </mesh>
      {Array.from({ length: clusters * 6 }).map((_, i) => {
        const height = (i / (clusters * 6)) * 0.8 - 0.4;
        const angle = i * 2.1;
        const rad = 0.04 * (i % 2 === 0 ? 1 : 0.6);
        return (
           <mesh key={i} position={[Math.cos(angle) * 0.05, height, Math.sin(angle) * 0.05]} castShadow>
             <sphereGeometry args={[rad, 8, 8]} />
             <meshStandardMaterial color={color} roughness={0.5} />
           </mesh>
        )
      })}
    </group>
  );
}

/* --- Main Scene Model --- */

export function FlowerModel({
  flowerType,
  growthStage,
  patternOffsetX = 0,
  patternOffsetY = 0,
  isEditorMode = false,
  onPositionChange,
}: {
  flowerType: string;
  growthStage: number;
  patternOffsetX: number;
  patternOffsetY: number;
  isEditorMode?: boolean;
  onPositionChange?: (position: [number, number, number]) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = FLOWER_COLORS[flowerType] || FLOWER_COLORS.rose;

  // Gentle idle rotation ONLY if not in editor mode
  useFrame((_, delta) => {
    if (groupRef.current && !isEditorMode) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const stemMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2A8040", roughness: 0.6 }), []);
  const soilMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3D2B1F", roughness: 0.9 }), []);

  const scaleMap = [0.3, 0.5, 0.75, 0.9, 1.0];
  const scale = scaleMap[growthStage] || 0.3;

  return (
    <group ref={groupRef} scale={scale} position={[0, growthStage >= 4 ? 0 : -0.8, 0]}>
      {/* Unique Pot only drops at Stage 4! Otherwise generic soil mound. */}
      {growthStage >= 4 ? (
        <CSGOPot offsetX={patternOffsetX} offsetY={patternOffsetY} />
      ) : (
        <mesh position={[0, -0.5, 0]} material={soilMaterial} receiveShadow>
          <sphereGeometry args={[0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}

      {/* Core Stem (Stage 1+) */}
      {growthStage >= 1 && (
        <mesh position={[0, 0.5, 0]} material={stemMaterial} castShadow>
          <cylinderGeometry args={[0.03, 0.06, 2, 8]} />
        </mesh>
      )}

      {/* Leaves (Stage 1+) */}
      {growthStage >= 1 && (
        <>
          <mesh position={[0.15, 0.2, 0]} rotation={[0, 0, -Math.PI / 4]} material={stemMaterial} scale={[2, 0.5, 1]} castShadow>
            <sphereGeometry args={[0.1, 8, 4]} />
          </mesh>
          <mesh position={[-0.15, 0.4, 0]} rotation={[0, 0, Math.PI / 4]} material={stemMaterial} scale={[1.8, 0.5, 1]} castShadow>
            <sphereGeometry args={[0.09, 8, 4]} />
          </mesh>
        </>
      )}

      {/* Generic Bud (Stage 2 strictly) */}
      {growthStage === 2 && (
        <mesh position={[0, 1.5, 0]} castShadow>
          <sphereGeometry args={[0.15, 12, 8]} />
          <meshStandardMaterial color={colors.petal} roughness={0.5} />
        </mesh>
      )}

      {/* Pure Natural Blooms (Stage 3+) */}
      {flowerType === "rose" && <RoseBloom growthStage={growthStage} color={colors.petal} />}
      {flowerType === "tulip" && <TulipBloom growthStage={growthStage} color={colors.petal} />}
      {flowerType === "sunflower" && <SunflowerBloom growthStage={growthStage} />}
      {flowerType === "daisy" && <DaisyBloom growthStage={growthStage} />}
      {flowerType === "lavender" && <LavenderBloom growthStage={growthStage} color={colors.petal} />}

      {/* Stage 4 Particles */}
      {growthStage >= 4 &&
        Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh key={`particle-${i}`} position={[Math.cos(angle) * 0.8, 1.5 + Math.sin(i * 0.7) * 0.3, Math.sin(angle) * 0.8]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color="#F5D03B" emissive="#F5D03B" emissiveIntensity={1.0} />
            </mesh>
          );
        })}
    </group>
  );
}

/* --- Container Export for individual views --- */

export function Flower3D({
  flowerType,
  growthStage,
  patternOffsetX = 0,
  patternOffsetY = 0,
  size = "md",
  interactive = true,
}: Flower3DProps) {
  const sizeMap = { sm: "h-32 w-32", md: "h-48 w-48", lg: "h-64 w-64", full: "w-full h-full absolute inset-0" };

  return (
    <div className={`${sizeMap[size]} ${size !== "full" ? "rounded-2xl overflow-hidden" : ""}`}>
      <Canvas camera={{ position: [2, 4, 6], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
        <pointLight position={[-3, 3, -3]} intensity={0.5} color="#C8EDCF" />

        <FlowerModel
          flowerType={flowerType}
          growthStage={growthStage}
          patternOffsetX={patternOffsetX}
          patternOffsetY={patternOffsetY}
        />

        {interactive && (
          <OrbitControls
            enableZoom={size === "full"}
            enablePan={false}
            minDistance={2}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
          />
        )}
      </Canvas>
    </div>
  );
}
