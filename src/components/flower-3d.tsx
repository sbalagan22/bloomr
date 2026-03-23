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
  sunflower: { petal: "#F5D03B", accent: "#39AB54" },
  daisy: { petal: "#FFFFFF", accent: "#F5D03B" },
  lavender: { petal: "#B09FD8", accent: "#7B6CB5" },
};

function FlowerModel({
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

  // Slow rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const petalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: colors.petal,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
    [colors.petal]
  );

  const stemMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#39AB54",
        roughness: 0.6,
      }),
    []
  );

  const centerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: colors.accent,
        roughness: 0.3,
      }),
    [colors.accent]
  );

  const soilMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6B4C35",
        roughness: 0.9,
      }),
    []
  );

  // Scale based on growth stage
  const scaleMap = [0.3, 0.5, 0.75, 0.9, 1.0];
  const scale = scaleMap[growthStage] || 0.3;

  // Number of petals based on growth + pattern offset
  const petalCount = growthStage >= 3 ? Math.floor(5 + patternOffsetX * 3) : 0;
  const petalSpread = growthStage >= 4 ? 1.0 : growthStage >= 3 ? 0.6 : 0;

  return (
    <group ref={groupRef} scale={scale} position={[0, -0.8, 0]}>
      {/* Soil mound */}
      <mesh position={[0, -0.5, 0]} material={soilMaterial}>
        <sphereGeometry args={[0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* Stem — visible from stage 1+ */}
      {growthStage >= 1 && (
        <mesh position={[0, 0.5, 0]} material={stemMaterial}>
          <cylinderGeometry args={[0.05, 0.07, 2, 8]} />
        </mesh>
      )}

      {/* Leaves — visible from stage 1+ */}
      {growthStage >= 1 && (
        <>
          <mesh
            position={[0.2, 0.2, 0]}
            rotation={[0, 0, -Math.PI / 4 - patternOffsetY * 0.3]}
            material={stemMaterial}
          >
            <sphereGeometry args={[0.15, 8, 4]} />
          </mesh>
          <mesh
            position={[-0.2, 0.4, 0]}
            rotation={[0, 0, Math.PI / 4 + patternOffsetX * 0.3]}
            material={stemMaterial}
          >
            <sphereGeometry args={[0.12, 8, 4]} />
          </mesh>
        </>
      )}

      {/* Bud — visible at stage 2 */}
      {growthStage === 2 && (
        <mesh position={[0, 1.5, 0]} material={petalMaterial}>
          <sphereGeometry args={[0.2, 12, 8]} />
        </mesh>
      )}

      {/* Flower center — visible from stage 3+ */}
      {growthStage >= 3 && (
        <mesh position={[0, 1.5, 0]} material={centerMaterial}>
          <sphereGeometry args={[0.2, 16, 16]} />
        </mesh>
      )}

      {/* Petals — stage 3 and 4 */}
      {growthStage >= 3 &&
        Array.from({ length: petalCount }).map((_, i) => {
          const angle = (i / petalCount) * Math.PI * 2 + patternOffsetX * Math.PI;
          const petalSize = 0.25 + patternOffsetY * 0.1;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 0.35 * petalSpread,
                1.5 + Math.sin(angle) * 0.1,
                Math.sin(angle) * 0.35 * petalSpread,
              ]}
              rotation={[
                Math.sin(angle) * 0.3,
                angle,
                Math.PI / 4 * petalSpread,
              ]}
              material={petalMaterial}
            >
              <sphereGeometry args={[petalSize, 8, 6]} />
            </mesh>
          );
        })}

      {/* Glow particles for stage 4 (bloomed) */}
      {growthStage >= 4 &&
        Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={`particle-${i}`}
              position={[
                Math.cos(angle) * 0.8,
                1.5 + Math.sin(i * 0.7) * 0.3,
                Math.sin(angle) * 0.8,
              ]}
            >
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color="#F5D03B"
                emissive="#F5D03B"
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
    </group>
  );
}

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
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-3, 3, -3]} intensity={0.3} color="#C8EDCF" />

        <FlowerModel
          flowerType={flowerType}
          growthStage={growthStage}
          patternOffsetX={patternOffsetX}
          patternOffsetY={patternOffsetY}
        />

        {interactive && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
        )}
      </Canvas>
    </div>
  );
}
