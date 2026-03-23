"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

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

/* --- Custom Meshes --- */

function RoseBloom({ growthStage, offsetX, offsetY, color }: { growthStage: number, offsetX: number, offsetY: number, color: string }) {
  const layers = growthStage >= 4 ? 6 : growthStage >= 3 ? 3 : 0;
  const spread = growthStage >= 4 ? 1.0 : 0.6;
  if (!layers) return null;

  return (
    <group position={[0, 1.4, 0]}>
      {Array.from({ length: layers * 4 }).map((_, i) => {
        // Tightly packed spiral
        const radius = 0.05 + (i * 0.02) * spread;
        const angle = i * 2.4 + offsetX * Math.PI; 
        const height = (layers * 4 - i) * 0.015 + offsetY * 0.05;
        const petalScale = 0.15 + (i * 0.008) + (offsetY * 0.02);
        
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * radius, height - 0.2, Math.sin(angle) * radius]}
            rotation={[Math.sin(angle) * 0.2 * spread, angle + Math.PI / 2, Math.PI / 6 * spread]}
          >
            <sphereGeometry args={[petalScale, 12, 8, 0, Math.PI, 0, Math.PI]} />
            <meshStandardMaterial color={color} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </group>
  );
}

function TulipBloom({ growthStage, offsetX, offsetY, color }: { growthStage: number, offsetX: number, offsetY: number, color: string }) {
  const isBloomed = growthStage >= 3;
  if (!isBloomed) return null;
  const spread = growthStage >= 4 ? 0.3 : 0.05; // opens up slightly at full bloom

  return (
    <group position={[0, 1.2, 0]}>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 + (offsetX * 0.5);
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.08 * spread, 0.2, Math.sin(angle) * 0.08 * spread]} rotation={[spread, angle, 0]} scale={[1, 1.3 + offsetY * 0.2, 1]}>
            <cylinderGeometry args={[0.1, 0.01, 0.4, 12, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={color} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </group>
  );
}

function SunflowerBloom({ growthStage, offsetX, offsetY }: { growthStage: number, offsetX: number, offsetY: number }) {
  const isBloomed = growthStage >= 3;
  if (!isBloomed) return null;
  const numPetals = growthStage >= 4 ? 24 : 12;
  const petalLength = 2.5 + offsetY * 1.5;

  return (
    <group position={[0, 1.4, 0]} rotation={[Math.PI / 4, 0, 0]}>
      {/* Massive Dark Center */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 32]} />
        <meshStandardMaterial color="#2B1A0E" roughness={0.9} />
      </mesh>
      {/* Radiant Yellow Petals */}
      {Array.from({ length: numPetals }).map((_, i) => {
        const angle = (i / numPetals) * Math.PI * 2 + (offsetX * Math.PI);
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.28, Math.sin(angle) * 0.28, 0]} rotation={[0, 0, angle]} scale={[petalLength, 0.5, 0.1]}>
            <sphereGeometry args={[0.08, 8, 4]} />
            <meshStandardMaterial color="#F5D03B" roughness={0.4} />
          </mesh>
        )
      })}
    </group>
  );
}

function DaisyBloom({ growthStage, offsetX, offsetY }: { growthStage: number, offsetX: number, offsetY: number }) {
  const isBloomed = growthStage >= 3;
  if (!isBloomed) return null;
  const numPetals = growthStage >= 4 ? 16 : 8;
  const petalScale = 3.0 + offsetY * 1.0;

  return (
    <group position={[0, 1.4, 0]} rotation={[Math.PI / 6, 0, 0]}>
      {/* Yellow Center */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
        <meshStandardMaterial color="#F5D03B" roughness={0.3} />
      </mesh>
      {/* White Petals */}
      {Array.from({ length: numPetals }).map((_, i) => {
        const angle = (i / numPetals) * Math.PI * 2 + (offsetX * Math.PI);
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, 0]} rotation={[0, 0, angle]} scale={[petalScale, 0.6, 0.1]}>
            <sphereGeometry args={[0.05, 8, 4]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
        )
      })}
    </group>
  );
}

function LavenderBloom({ growthStage, offsetX, offsetY, color }: { growthStage: number, offsetX: number, offsetY: number, color: string }) {
  const clusters = growthStage >= 4 ? 10 : growthStage >= 3 ? 5 : 0;
  if (!clusters) return null;

  return (
    <group position={[0, 1.0, 0]}>
      {/* Extended stem for clusters */}
      <mesh material={new THREE.MeshStandardMaterial({ color: "#39AB54", roughness: 0.6 })}>
         <cylinderGeometry args={[0.015, 0.02, 0.8, 8]} />
      </mesh>
      {/* Spherical purple clusters growing upwards */}
      {Array.from({ length: clusters * 6 }).map((_, i) => {
        const height = (i / (clusters * 6)) * 0.8 - 0.4;
        const angle = i * 2.1 + (offsetX * Math.PI * 2);
        const rad = 0.035 + (offsetY * 0.015) * (i % 2 === 0 ? 1 : 0.5);
        return (
           <mesh key={i} position={[Math.cos(angle) * 0.05, height, Math.sin(angle) * 0.05]}>
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
}: {
  flowerType: string;
  growthStage: number;
  patternOffsetX: number;
  patternOffsetY: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = FLOWER_COLORS[flowerType] || FLOWER_COLORS.rose;

  // Gentle idle rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const stemMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#39AB54", roughness: 0.6 }), []);
  const soilMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6B4C35", roughness: 0.9 }), []);

  // Overall scale progresses over stages
  const scaleMap = [0.3, 0.5, 0.75, 0.9, 1.0];
  const scale = scaleMap[growthStage] || 0.3;

  return (
    <group ref={groupRef} scale={scale} position={[0, -0.8, 0]}>
      {/* Soil mound (always visible to ground the visual) */}
      <mesh position={[0, -0.5, 0]} material={soilMaterial}>
        <sphereGeometry args={[0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* Core Stem (Stage 1+) */}
      {growthStage >= 1 && (
        <mesh position={[0, 0.5, 0]} material={stemMaterial}>
          <cylinderGeometry args={[0.03, 0.06, 2, 8]} />
        </mesh>
      )}

      {/* Leaves (Stage 1+) */}
      {growthStage >= 1 && (
        <>
          <mesh position={[0.15, 0.2, 0]} rotation={[0, 0, -Math.PI / 4 - patternOffsetY * 0.2]} material={stemMaterial} scale={[2, 0.5, 1]}>
            <sphereGeometry args={[0.1, 8, 4]} />
          </mesh>
          <mesh position={[-0.15, 0.4, 0]} rotation={[0, 0, Math.PI / 4 + patternOffsetX * 0.2]} material={stemMaterial} scale={[1.8, 0.5, 1]}>
            <sphereGeometry args={[0.09, 8, 4]} />
          </mesh>
        </>
      )}

      {/* Shared generic Bud (Stage 2 strictly) */}
      {growthStage === 2 && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.15, 12, 8]} />
          <meshStandardMaterial color={colors.petal} roughness={0.5} />
        </mesh>
      )}

      {/* Unique Blooms (Stage 3+) */}
      {flowerType === "rose" && <RoseBloom growthStage={growthStage} offsetX={patternOffsetX} offsetY={patternOffsetY} color={colors.petal} />}
      {flowerType === "tulip" && <TulipBloom growthStage={growthStage} offsetX={patternOffsetX} offsetY={patternOffsetY} color={colors.petal} />}
      {flowerType === "sunflower" && <SunflowerBloom growthStage={growthStage} offsetX={patternOffsetX} offsetY={patternOffsetY} />}
      {flowerType === "daisy" && <DaisyBloom growthStage={growthStage} offsetX={patternOffsetX} offsetY={patternOffsetY} />}
      {flowerType === "lavender" && <LavenderBloom growthStage={growthStage} offsetX={patternOffsetX} offsetY={patternOffsetY} color={colors.petal} />}

      {/* Full Bloom Glow Particles (Stage 4) */}
      {growthStage >= 4 &&
        Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2 + (patternOffsetX * Math.PI);
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

/* --- Container Export --- */

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
      <Canvas
        camera={{ position: [2, 2, 4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} />
        <pointLight position={[-3, 3, -3]} intensity={0.4} color="#C8EDCF" />

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
