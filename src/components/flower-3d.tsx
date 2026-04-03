"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { type Rarity, RARITIES } from "@/lib/rarity";

interface Flower3DProps {
  flowerType: string;
  growthStage: number;
  rarity?: Rarity;
  potColor?: string;
  size?: "sm" | "md" | "lg" | "full";
  interactive?: boolean;
}

const FLOWER_COLORS: Record<string, { petal: string; accent: string }> = {
  rose:      { petal: "#CC2A1A", accent: "#8A1810" },
  tulip:     { petal: "#3D5EE0", accent: "#2A42A8" },
  sunflower: { petal: "#F5C518", accent: "#DDA400" },
  daisy:     { petal: "#FFFFFF", accent: "#E0E0F0" },
  lily:      { petal: "#E8709A", accent: "#D04878" },
  lavender:  { petal: "#E8709A", accent: "#D04878" },
};

const TERRACOTTA = "#C8682B";
const GREEN      = "#2A8040";
const SOIL_DARK  = "#2B1A0E";

/* ── Shared material hooks ── */
function useGreenMat() {
  return useMemo(
    () => new THREE.MeshPhongMaterial({ color: GREEN, flatShading: true }),
    []
  );
}
function useSoilMat() {
  return useMemo(
    () => new THREE.MeshPhongMaterial({ color: SOIL_DARK, flatShading: true }),
    []
  );
}
function usePotMat(color?: string) {
  return useMemo(
    () => new THREE.MeshPhongMaterial({ color: color || TERRACOTTA, flatShading: true, shininess: 22 }),
    [color]
  );
}

/* ═══════════════════════════════════════════════════
   POT MODELS  (terracotta clay, shape-per-rarity)
   All reference images: /design/pots/
   ═══════════════════════════════════════════════════ */

/** Common — short squat classic terracotta pot, 8-sided, slight lip at top */
function CommonPot({ potColor }: { potColor?: string }) {
  const mat  = usePotMat(potColor);
  const soil = useSoilMat();
  const geo  = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.18, -0.36),   // flat bottom edge
      new THREE.Vector2(0.20, -0.34),   // bottom corner
      new THREE.Vector2(0.32,  0.06),   // tapers outward linearly
      new THREE.Vector2(0.38,  0.28),   // near top
      new THREE.Vector2(0.42,  0.34),   // lip flare
      new THREE.Vector2(0.44,  0.38),   // lip top
      new THREE.Vector2(0.42,  0.40),   // lip roll-over
    ];
    return new THREE.LatheGeometry(pts, 8);
  }, []);

  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      <mesh material={soil} position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.03, 8]} />
      </mesh>
    </group>
  );
}

/** Uncommon — tall round-belly urn with narrow neck and flared lip, 12 segments */
function UncommonPot({ potColor }: { potColor?: string }) {
  const mat  = usePotMat(potColor);
  const soil = useSoilMat();
  const geo  = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.14, -0.58),   // narrow base
      new THREE.Vector2(0.16, -0.56),   // base corner
      new THREE.Vector2(0.42, -0.20),   // big belly outward
      new THREE.Vector2(0.48,  0.00),   // max belly width
      new THREE.Vector2(0.44,  0.16),   // belly curves in
      new THREE.Vector2(0.28,  0.34),   // narrow neck
      new THREE.Vector2(0.24,  0.42),   // neck
      new THREE.Vector2(0.28,  0.48),   // lip flare out
      new THREE.Vector2(0.32,  0.52),   // lip edge
      new THREE.Vector2(0.30,  0.54),   // lip roll
    ];
    return new THREE.LatheGeometry(pts, 12);
  }, []);

  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      <mesh material={soil} position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.03, 12]} />
      </mesh>
    </group>
  );
}

/** Rare — tall elegant pedestal vase, slim with dramatic flared bowl at top, 10 segments */
function RarePot({ potColor }: { potColor?: string }) {
  const mat  = usePotMat(potColor);
  const soil = useSoilMat();
  const geo  = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.22, -0.70),   // wide pedestal base
      new THREE.Vector2(0.24, -0.68),
      new THREE.Vector2(0.22, -0.62),   // pedestal rim
      new THREE.Vector2(0.10, -0.48),   // very narrow stem
      new THREE.Vector2(0.08, -0.20),   // still narrow
      new THREE.Vector2(0.10,  0.04),   // starts to widen
      new THREE.Vector2(0.22,  0.24),   // bowl widens
      new THREE.Vector2(0.38,  0.42),   // wide bowl
      new THREE.Vector2(0.40,  0.48),   // rim
      new THREE.Vector2(0.38,  0.50),   // rim roll
    ];
    return new THREE.LatheGeometry(pts, 10);
  }, []);

  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      <mesh material={soil} position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.03, 10]} />
      </mesh>
    </group>
  );
}

/** Epic — wide ornate chalice with handles (side lugs), pedestal foot, 12 segments */
function EpicPot({ potColor }: { potColor?: string }) {
  const mat  = usePotMat(potColor);
  const soil = useSoilMat();
  const geo  = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.28, -0.60),   // wide pedestal base
      new THREE.Vector2(0.30, -0.58),
      new THREE.Vector2(0.28, -0.52),   // pedestal lip
      new THREE.Vector2(0.12, -0.44),   // narrow stem
      new THREE.Vector2(0.10, -0.32),   // stem
      new THREE.Vector2(0.18, -0.18),   // bowl starts
      new THREE.Vector2(0.46, -0.02),   // wide bowl
      new THREE.Vector2(0.52,  0.14),   // max width
      new THREE.Vector2(0.50,  0.28),   // curves in slightly
      new THREE.Vector2(0.44,  0.38),   // upper bowl
      new THREE.Vector2(0.48,  0.44),   // decorative rim flare
      new THREE.Vector2(0.50,  0.48),   // rim edge
      new THREE.Vector2(0.48,  0.50),   // rim roll
    ];
    return new THREE.LatheGeometry(pts, 12);
  }, []);

  // Two decorative handle lugs on opposite sides
  const handleGeo = useMemo(() => new THREE.TorusGeometry(0.10, 0.025, 6, 8, Math.PI), []);

  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      {/* Decorative band around widest point */}
      <mesh material={mat} position={[0, 0.14, 0]} castShadow>
        <torusGeometry args={[0.52, 0.02, 6, 12]} />
      </mesh>
      {/* Side handles */}
      <mesh geometry={handleGeo} material={mat} position={[0.50, 0.26, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />
      <mesh geometry={handleGeo} material={mat} position={[-0.50, 0.26, 0]} rotation={[0, Math.PI, Math.PI / 2]} castShadow />
      <mesh material={soil} position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.03, 12]} />
      </mesh>
    </group>
  );
}

/** Legendary — ornate castle vase with crenellations, pedestal, and crown rim */
function LegendaryPot({ potColor }: { potColor?: string }) {
  const mat  = usePotMat(potColor);
  const soil = useSoilMat();
  const bodyGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.26, -0.64),   // wide ornate base
      new THREE.Vector2(0.28, -0.62),
      new THREE.Vector2(0.26, -0.56),   // base lip
      new THREE.Vector2(0.14, -0.48),   // narrow stem
      new THREE.Vector2(0.12, -0.34),
      new THREE.Vector2(0.18, -0.18),   // widens into body
      new THREE.Vector2(0.38, -0.02),
      new THREE.Vector2(0.42,  0.12),   // body
      new THREE.Vector2(0.40,  0.26),
      new THREE.Vector2(0.36,  0.36),   // below rim
    ];
    return new THREE.LatheGeometry(pts, 8);
  }, []);

  const battlements = useMemo(
    () => Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return { x: Math.cos(a) * 0.34, z: Math.sin(a) * 0.34, key: i };
    }),
    []
  );

  return (
    <group>
      <mesh geometry={bodyGeo} material={mat} castShadow receiveShadow />
      {/* Thick rim band */}
      <mesh material={mat} position={[0, 0.40, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.08, 8]} />
      </mesh>
      {/* Decorative mid-band */}
      <mesh material={mat} position={[0, 0.12, 0]} castShadow>
        <torusGeometry args={[0.42, 0.02, 6, 8]} />
      </mesh>
      {/* Crenellations — taller and more of them */}
      {battlements.map(({ x, z, key }) => (
        <mesh key={key} material={mat} position={[x, 0.56, z]} castShadow>
          <boxGeometry args={[0.08, 0.18, 0.08]} />
        </mesh>
      ))}
      <mesh material={soil} position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.03, 8]} />
      </mesh>
    </group>
  );
}

function RarityPot({ rarity, potColor }: { rarity: Rarity; potColor?: string }) {
  switch (rarity) {
    case "uncommon":  return <UncommonPot potColor={potColor} />;
    case "rare":      return <RarePot potColor={potColor} />;
    case "epic":      return <EpicPot potColor={potColor} />;
    case "legendary": return <LegendaryPot potColor={potColor} />;
    default:          return <CommonPot potColor={potColor} />;
  }
}

/* ═══════════════════════════════════════════════════
   SHARED PLANT PARTS
   ═══════════════════════════════════════════════════ */

function Stem({ growthStage }: { growthStage: number }) {
  const mat = useGreenMat();
  const h   = growthStage >= 3 ? 2.0 : growthStage === 2 ? 1.6 : 1.2;
  return (
    <mesh material={mat} position={[0, h / 2 - 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.03, 0.06, h, 6]} />
    </mesh>
  );
}

function Leaves({ growthStage }: { growthStage: number }) {
  const mat = useMemo(
    () => new THREE.MeshPhongMaterial({ color: GREEN, flatShading: true, side: THREE.DoubleSide }),
    []
  );
  return (
    <>
      <mesh material={mat} position={[0.22, 0.08, 0]} rotation={[0.1, 0, -0.65]} scale={[1.9, 0.5, 0.3]} castShadow>
        <sphereGeometry args={[0.14, 4, 3]} />
      </mesh>
      <mesh material={mat} position={[-0.22, 0.32, 0.05]} rotation={[-0.1, 0.2, 0.60]} scale={[1.8, 0.5, 0.3]} castShadow>
        <sphereGeometry args={[0.13, 4, 3]} />
      </mesh>
      {growthStage >= 2 && (
        <mesh material={mat} position={[0.18, 0.70, 0]} rotation={[0, 0, -0.45]} scale={[1.6, 0.45, 0.3]} castShadow>
          <sphereGeometry args={[0.12, 4, 3]} />
        </mesh>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   BLOOM COMPONENTS
   Reference images: /design/flowers/
   ═══════════════════════════════════════════════════ */

/** Rose — deep red, 4 concentric petal rings spiralling outward, gold stamens */
function RoseBloom({ growthStage }: { growthStage: number }) {
  const deepRed = useMemo(() => new THREE.MeshPhongMaterial({ color: "#6B0E08", flatShading: true, side: THREE.DoubleSide }), []);
  const midRed  = useMemo(() => new THREE.MeshPhongMaterial({ color: "#8A1810", flatShading: true, side: THREE.DoubleSide }), []);
  const outer   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#CC2A1A", flatShading: true, side: THREE.DoubleSide }), []);
  const bright  = useMemo(() => new THREE.MeshPhongMaterial({ color: "#E03525", flatShading: true, side: THREE.DoubleSide }), []);
  const ctr     = useMemo(() => new THREE.MeshPhongMaterial({ color: "#F5D03B", flatShading: true }), []);
  const spread  = growthStage >= 4 ? 1.0 : 0.6;

  return (
    <group position={[0, 1.40, 0]}>
      {/* Gold stamen center */}
      <mesh material={ctr}><sphereGeometry args={[0.055, 6, 5]} /></mesh>
      {/* Innermost tight bud — 4 petals curving inward */}
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2 + 0.3;
        return (
          <mesh key={`c${i}`} material={deepRed}
            position={[Math.cos(a) * 0.04, 0.06, Math.sin(a) * 0.04]}
            rotation={[Math.PI / 4, a, Math.PI / 5]}
            scale={[0.7, 1.2, 0.35]} castShadow>
            <sphereGeometry args={[0.08, 5, 4]} />
          </mesh>
        );
      })}
      {/* Inner ring — 6 petals, slightly open */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={`i${i}`} material={midRed}
            position={[Math.cos(a) * 0.10 * spread, 0.02, Math.sin(a) * 0.10 * spread]}
            rotation={[Math.PI / 2.8 * spread, a, Math.PI / 6]}
            scale={[0.9, 1.5, 0.38]} castShadow>
            <sphereGeometry args={[0.10, 5, 4]} />
          </mesh>
        );
      })}
      {/* Middle ring — 8 petals, opening wider */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.15;
        return (
          <mesh key={`m${i}`} material={outer}
            position={[Math.cos(a) * 0.19 * spread, -0.03, Math.sin(a) * 0.19 * spread]}
            rotation={[Math.PI / 3.0 * spread, a, Math.PI / 5]}
            scale={[1.0, 1.7, 0.4]} castShadow>
            <sphereGeometry args={[0.12, 5, 4]} />
          </mesh>
        );
      })}
      {/* Outer ring — 10 petals, fully open and drooping */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.25;
        return (
          <mesh key={`o${i}`} material={i % 3 === 0 ? bright : outer}
            position={[Math.cos(a) * 0.29 * spread, -0.12, Math.sin(a) * 0.29 * spread]}
            rotation={[Math.PI / 2.2 * spread, a, Math.PI / 4]}
            scale={[1.15, 1.9, 0.38]} castShadow>
            <sphereGeometry args={[0.13, 5, 4]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Tulip — blue, elegant cup bloom with visible interior, side buds */
function TulipBloom({ growthStage }: { growthStage: number }) {
  const main   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#3D5EE0", flatShading: true, side: THREE.DoubleSide }), []);
  const dark   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#2A42A8", flatShading: true, side: THREE.DoubleSide }), []);
  const light  = useMemo(() => new THREE.MeshPhongMaterial({ color: "#5B7CF0", flatShading: true, side: THREE.DoubleSide }), []);
  const center = useMemo(() => new THREE.MeshPhongMaterial({ color: "#1A2A6C", flatShading: true }), []);
  const stamen = useMemo(() => new THREE.MeshPhongMaterial({ color: "#F5D03B", flatShading: true }), []);
  const stemM  = useGreenMat();
  const open   = growthStage >= 4 ? 0.35 : 0.10;

  return (
    <group>
      {/* Main cup bloom */}
      <group position={[0, 1.40, 0]}>
        {/* Dark interior cup */}
        <mesh material={center} position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.06, 0.04, 0.14, 6]} />
        </mesh>
        {/* Stamens visible inside */}
        {Array.from({ length: 3 }, (_, i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={`st${i}`} material={stamen}
              position={[Math.cos(a) * 0.03, 0.12, Math.sin(a) * 0.03]}>
              <sphereGeometry args={[0.015, 4, 3]} />
            </mesh>
          );
        })}
        {/* 6 tall cupped petals */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const mat = i % 3 === 0 ? light : i % 2 === 0 ? main : dark;
          return (
            <mesh key={i} material={mat}
              position={[Math.cos(a) * 0.08 * (1 + open), 0.08, Math.sin(a) * 0.08 * (1 + open)]}
              rotation={[open * 0.8, a, 0]}
              scale={[0.8, 1.6, 0.42]} castShadow>
              <sphereGeometry args={[0.12, 5, 4, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            </mesh>
          );
        })}
      </group>
      {/* Side buds with branch stems */}
      {([
        { pos: [ 0.22,  0.55,  0.00] as const, rz:  0.55 },
        { pos: [-0.20,  0.78,  0.10] as const, rz: -0.45 },
        { pos: [ 0.18,  1.00, -0.10] as const, rz:  0.38 },
        { pos: [-0.15,  1.18,  0.00] as const, rz: -0.32 },
      ] as const).map(({ pos, rz }, i) => (
        <group key={i}>
          <mesh material={stemM} position={[pos[0] * 0.5, pos[1] - 0.07, pos[2] * 0.5]} rotation={[0, 0, rz]}>
            <cylinderGeometry args={[0.012, 0.020, 0.22, 5]} />
          </mesh>
          <mesh material={i % 2 === 0 ? main : dark} position={[pos[0], pos[1] + 0.10, pos[2]]} scale={[0.85, 1.4, 0.85]} castShadow>
            <sphereGeometry args={[0.06, 5, 4]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Sunflower — large tilted face, textured dark center, triple-layer yellow petals */
function SunflowerBloom({ growthStage }: { growthStage: number }) {
  const petal     = useMemo(() => new THREE.MeshPhongMaterial({ color: "#F5C518", flatShading: true, side: THREE.DoubleSide }), []);
  const petalDark = useMemo(() => new THREE.MeshPhongMaterial({ color: "#DDA400", flatShading: true, side: THREE.DoubleSide }), []);
  const petalTip  = useMemo(() => new THREE.MeshPhongMaterial({ color: "#E8B010", flatShading: true, side: THREE.DoubleSide }), []);
  const centerD   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#2B1A0E", flatShading: true }), []);
  const centerM   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#4A3018", flatShading: true }), []);
  const seedMat   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#1A0E06", flatShading: true }), []);
  const outerCnt  = growthStage >= 4 ? 18 : 14;

  return (
    <group position={[0, 1.40, 0]} rotation={[Math.PI / 10, 0, 0]}>
      {/* Center disk — layered for texture */}
      <mesh material={centerD} castShadow>
        <cylinderGeometry args={[0.24, 0.22, 0.08, 12]} />
      </mesh>
      <mesh material={centerM} position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 10]} />
      </mesh>
      {/* Seed dots on face */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r = 0.10;
        return (
          <mesh key={`sd${i}`} material={seedMat}
            position={[Math.cos(a) * r, 0.06, Math.sin(a) * r]}>
            <sphereGeometry args={[0.02, 4, 3]} />
          </mesh>
        );
      })}
      {/* Outer petals — long pointed */}
      {Array.from({ length: outerCnt }, (_, i) => {
        const a = (i / outerCnt) * Math.PI * 2;
        return (
          <mesh key={i} material={i % 5 === 0 ? petalTip : petal}
            position={[Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36]}
            rotation={[0, -a, Math.PI / 2]}
            scale={[0.75, 0.28, 0.90]} castShadow>
            <sphereGeometry args={[0.14, 5, 3]} />
          </mesh>
        );
      })}
      {/* Middle petals — slightly shorter, offset */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
        return (
          <mesh key={`md${i}`} material={petalDark}
            position={[Math.cos(a) * 0.28, -0.01, Math.sin(a) * 0.28]}
            rotation={[0, -a, Math.PI / 2]}
            scale={[0.55, 0.24, 0.78]} castShadow>
            <sphereGeometry args={[0.12, 5, 3]} />
          </mesh>
        );
      })}
      {/* Inner petals — short, close to disk */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return (
          <mesh key={`in${i}`} material={petalTip}
            position={[Math.cos(a) * 0.24, -0.02, Math.sin(a) * 0.24]}
            rotation={[0, -a, Math.PI / 2]}
            scale={[0.40, 0.22, 0.65]} castShadow>
            <sphereGeometry args={[0.10, 5, 3]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Daisy — white strap petals around golden dome, multiple heads on branches */
function DaisyBloom({ growthStage }: { growthStage: number }) {
  const white   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#FFFFFF", flatShading: true, side: THREE.DoubleSide }), []);
  const cream   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#F5F0E0", flatShading: true, side: THREE.DoubleSide }), []);
  const shade   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#D8D0E8", flatShading: true, side: THREE.DoubleSide }), []);
  const yellow  = useMemo(() => new THREE.MeshPhongMaterial({ color: "#F5C518", flatShading: true }), []);
  const yellowD = useMemo(() => new THREE.MeshPhongMaterial({ color: "#DDA400", flatShading: true }), []);
  const stemM   = useGreenMat();
  const budM    = useMemo(() => new THREE.MeshPhongMaterial({ color: "#B8CC90", flatShading: true }), []);
  const petalN  = growthStage >= 4 ? 22 : 16;

  return (
    <group>
      {/* Main bloom */}
      <group position={[0, 1.52, 0]} rotation={[Math.PI / 14, 0, 0]}>
        {/* Layered center dome */}
        <mesh material={yellow} castShadow>
          <sphereGeometry args={[0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        <mesh material={yellowD} position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.09, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        {/* Outer petals — long, thin, strap-like */}
        {Array.from({ length: petalN }, (_, i) => {
          const a = (i / petalN) * Math.PI * 2;
          const mat = i % 7 === 0 ? shade : i % 4 === 0 ? cream : white;
          return (
            <mesh key={i} material={mat}
              position={[Math.cos(a) * 0.26, -0.03, Math.sin(a) * 0.26]}
              rotation={[0.15, -a, Math.PI / 2]}
              scale={[1.0, 0.18, 0.70]} castShadow>
              <sphereGeometry args={[0.11, 5, 3]} />
            </mesh>
          );
        })}
        {/* Inner shorter petals */}
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2 + Math.PI / 10;
          return (
            <mesh key={`ip${i}`} material={cream}
              position={[Math.cos(a) * 0.17, -0.01, Math.sin(a) * 0.17]}
              rotation={[0, -a, Math.PI / 2]}
              scale={[0.65, 0.16, 0.55]} castShadow>
              <sphereGeometry args={[0.09, 5, 3]} />
            </mesh>
          );
        })}
      </group>
      {/* Side buds with mini-blooms */}
      {([
        { pos: [ 0.20, 0.86,  0.00] as const, size: 0.055, open: true },
        { pos: [-0.18, 1.04,  0.10] as const, size: 0.048, open: false },
        { pos: [ 0.15, 1.20, -0.08] as const, size: 0.042, open: false },
      ] as const).map(({ pos, size, open }, i) => (
        <group key={i}>
          <mesh material={stemM} position={[pos[0] * 0.5, pos[1] - 0.07, pos[2] * 0.5]}>
            <cylinderGeometry args={[0.010, 0.018, 0.18, 5]} />
          </mesh>
          {open ? (
            <group position={[...pos] as [number, number, number]} scale={0.45}>
              <mesh material={yellow}><sphereGeometry args={[0.08, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5]} /></mesh>
              {Array.from({ length: 8 }, (_, j) => {
                const ba = (j / 8) * Math.PI * 2;
                return (
                  <mesh key={j} material={white}
                    position={[Math.cos(ba) * 0.16, -0.02, Math.sin(ba) * 0.16]}
                    rotation={[0, -ba, Math.PI / 2]}
                    scale={[0.7, 0.16, 0.5]}>
                    <sphereGeometry args={[0.08, 4, 3]} />
                  </mesh>
                );
              })}
            </group>
          ) : (
            <mesh material={budM} position={[...pos] as [number, number, number]} castShadow>
              <sphereGeometry args={[size, 5, 4]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Lily — 6 wide elegantly reflexed petals with speckles, prominent stamens, side buds */
function LilyBloom({ growthStage }: { growthStage: number }) {
  const main    = useMemo(() => new THREE.MeshPhongMaterial({ color: "#E8709A", flatShading: true, side: THREE.DoubleSide }), []);
  const light   = useMemo(() => new THREE.MeshPhongMaterial({ color: "#F0A0B8", flatShading: true, side: THREE.DoubleSide }), []);
  const acc     = useMemo(() => new THREE.MeshPhongMaterial({ color: "#D04878", flatShading: true, side: THREE.DoubleSide }), []);
  const speckle = useMemo(() => new THREE.MeshPhongMaterial({ color: "#8B2040", flatShading: true }), []);
  const stamen  = useMemo(() => new THREE.MeshPhongMaterial({ color: "#F5C53A", flatShading: true }), []);
  const stmStem = useMemo(() => new THREE.MeshPhongMaterial({ color: "#A0D070", flatShading: true }), []);
  const stemM   = useGreenMat();
  const budMat  = useMemo(() => new THREE.MeshPhongMaterial({ color: "#C8547A", flatShading: true }), []);
  const spread  = growthStage >= 4 ? 1.0 : 0.60;

  return (
    <group>
      {/* Main open bloom */}
      <group position={[0, 1.42, 0]}>
        {/* 6 petals — alternating wide and narrow for star shape */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const isWide = i % 2 === 0;
          const mat = isWide ? main : light;
          return (
            <group key={i}>
              <mesh material={mat}
                position={[Math.cos(a) * 0.18 * spread, -0.05, Math.sin(a) * 0.18 * spread]}
                rotation={[Math.PI / 2.3 * spread, a, 0]}
                scale={[isWide ? 1.1 : 0.85, 2.4, isWide ? 0.5 : 0.4]} castShadow>
                <sphereGeometry args={[0.12, 5, 4]} />
              </mesh>
              {/* Speckle dots on each petal */}
              {isWide && Array.from({ length: 3 }, (_, j) => {
                const dist = 0.08 + j * 0.04;
                return (
                  <mesh key={`sp${j}`} material={speckle}
                    position={[
                      Math.cos(a) * dist * spread * 1.2,
                      -0.03 - j * 0.015,
                      Math.sin(a) * dist * spread * 1.2
                    ]}>
                    <sphereGeometry args={[0.012, 3, 3]} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
        {/* Prominent stamens — tall with big anthers */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          return (
            <group key={`s${i}`}>
              <mesh material={stmStem}
                position={[Math.cos(a) * 0.04, 0.10, Math.sin(a) * 0.04]}
                rotation={[0.2 * Math.sin(a), 0, 0.2 * Math.cos(a)]}>
                <cylinderGeometry args={[0.006, 0.008, 0.22, 4]} />
              </mesh>
              <mesh material={stamen}
                position={[Math.cos(a) * 0.06, 0.22, Math.sin(a) * 0.06]}>
                <boxGeometry args={[0.03, 0.05, 0.015]} />
              </mesh>
            </group>
          );
        })}
        {/* Central pistil */}
        <mesh material={stmStem} position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.008, 0.006, 0.28, 4]} />
        </mesh>
        <mesh material={acc} position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.018, 5, 4]} />
        </mesh>
      </group>
      {/* Side buds — elongated teardrop shape */}
      {([
        { pos: [ 0.22, 0.80,  0.00] as const, sc: 0.85 },
        { pos: [-0.20, 1.00,  0.12] as const, sc: 0.72 },
        { pos: [ 0.16, 1.16, -0.10] as const, sc: 0.58 },
      ] as const).map(({ pos, sc }, i) => (
        <group key={i}>
          <mesh material={stemM} position={[pos[0] * 0.5, pos[1] - 0.06, pos[2] * 0.5]}>
            <cylinderGeometry args={[0.010, 0.018, 0.16, 5]} />
          </mesh>
          <mesh material={budMat} position={[...pos] as [number, number, number]}
            scale={[sc * 0.7, sc * 1.8, sc * 0.7]} castShadow>
            <sphereGeometry args={[0.055, 5, 4]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN FLOWER MODEL
   ═══════════════════════════════════════════════════ */

export function FlowerModel({
  flowerType,
  growthStage,
  rarity: rarityProp = "common",
  potColor,
  isEditorMode = false,
}: {
  flowerType: string;
  growthStage: number;
  rarity?: Rarity;
  potColor?: string;
  isEditorMode?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const soilMat  = useSoilMat();
  const budColor = FLOWER_COLORS[flowerType]?.petal ?? "#E8637A";
  const rarity: Rarity = rarityProp;

  useFrame((_, delta) => {
    if (groupRef.current && !isEditorMode) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const scaleMap = [0.3, 0.5, 0.75, 0.9, 1.0];
  const scale    = scaleMap[Math.max(0, Math.min(4, growthStage))];

  return (
    <group ref={groupRef} scale={scale} position={[0, growthStage >= 4 ? 0 : -0.8, 0]}>

      {/* Pot (stage 4) or soil mound (stages 0–3) */}
      {growthStage >= 4 ? (
        <group position={[0, -0.48, 0]} scale={0.82}>
          <RarityPot rarity={rarity} potColor={potColor} />
        </group>
      ) : (
        <mesh material={soilMat} position={[0, -0.5, 0]} receiveShadow>
          <sphereGeometry args={[0.6, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}

      {/* Stage 0: tiny seed nub */}
      {growthStage === 0 && (
        <mesh material={soilMat} position={[0, -0.14, 0]}>
          <sphereGeometry args={[0.08, 5, 4]} />
        </mesh>
      )}

      {/* Stage 1+: stem + leaves */}
      {growthStage >= 1 && (
        <>
          <Stem growthStage={growthStage} />
          <Leaves growthStage={growthStage} />
        </>
      )}

      {/* Stage 2: closed bud at tip */}
      {growthStage === 2 && (
        <mesh position={[0, 1.52, 0]} castShadow>
          <sphereGeometry args={[0.12, 5, 4]} />
          <meshPhongMaterial color={budColor} flatShading />
        </mesh>
      )}

      {/* Stage 3+: species-specific bloom */}
      {growthStage >= 3 && flowerType === "rose"      && <RoseBloom      growthStage={growthStage} />}
      {growthStage >= 3 && flowerType === "tulip"     && <TulipBloom     growthStage={growthStage} />}
      {growthStage >= 3 && flowerType === "sunflower" && <SunflowerBloom growthStage={growthStage} />}
      {growthStage >= 3 && flowerType === "daisy"     && <DaisyBloom     growthStage={growthStage} />}
      {growthStage >= 3 && flowerType === "lily"      && <LilyBloom      growthStage={growthStage} />}
      {growthStage >= 3 && flowerType === "lavender"  && <LilyBloom      growthStage={growthStage} />}

      {/* Stage 4: rarity-coloured glow particles */}
      {growthStage >= 4 && Array.from({ length: 6 }, (_, i) => {
        const a  = (i / 6) * Math.PI * 2;
        const gc = RARITIES[rarity].glowColor;
        return (
          <mesh key={`p${i}`} position={[Math.cos(a) * 0.8, 1.5 + Math.sin(i * 0.7) * 0.3, Math.sin(a) * 0.8]}>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshStandardMaterial color={gc} emissive={gc} emissiveIntensity={1.2} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════
   CANVAS WRAPPER  (for standalone use)
   ═══════════════════════════════════════════════════ */

export function Flower3D({
  flowerType,
  growthStage,
  rarity = "common",
  potColor,
  size = "md",
  interactive = true,
}: Flower3DProps) {
  const sizeMap = {
    sm:   "h-32 w-32",
    md:   "h-48 w-48",
    lg:   "h-64 w-64",
    full: "w-full h-full absolute inset-0",
  };

  return (
    <div className={`${sizeMap[size]} ${size !== "full" ? "rounded-2xl overflow-hidden" : ""}`}>
      <Canvas camera={{ position: [2, 4, 6], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
        <pointLight position={[-3, 4, -3]} intensity={0.4} color="#C8EDCF" />
        <FlowerModel
          flowerType={flowerType}
          growthStage={growthStage}
          rarity={rarity}
          potColor={potColor}
        />
        {interactive && (
          <OrbitControls
            enableZoom={false}
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
