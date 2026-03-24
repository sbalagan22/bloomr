"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  type CamoType,
  getRarityFromOffsets,
  getCommonColor,
  RARITIES,
} from "@/lib/rarity";

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

/* ═══════════════════════════════════════════════════════
   PROCEDURAL CAMO TEXTURE GENERATORS  (Canvas 2D → Three.js)
   ═══════════════════════════════════════════════════════ */

function createSolidTexture(color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  // Subtle ceramic sheen gradient
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "rgba(255,255,255,0.12)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.05)");
  grad.addColorStop(1, "rgba(255,255,255,0.08)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createStripesTexture(
  primary: string,
  secondary: string,
  ox: number,
  oy: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 512, 512);
  const stripeWidth = 18 + Math.floor(ox * 20);
  const angle = -35 + oy * 30; // slight rotation variance
  ctx.save();
  ctx.translate(256, 256);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-256, -256);
  ctx.fillStyle = secondary;
  for (let i = -512; i < 1024; i += stripeWidth * 2) {
    ctx.fillRect(i, -100, stripeWidth, 1200);
  }
  ctx.restore();
  // Soft vignette overlay
  const vig = ctx.createRadialGradient(256, 256, 80, 256, 256, 360);
  vig.addColorStop(0, "rgba(255,255,255,0.1)");
  vig.addColorStop(1, "rgba(0,0,0,0.15)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createDripTexture(
  bg: string,
  dripColor: string,
  ox: number,
  oy: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);
  // Seeded pseudo-random from offsets
  const seed = (n: number) => ((Math.sin(n * 127.1 + ox * 311.7) * 43758.5453) % 1 + 1) % 1;
  const dripCount = 8 + Math.floor(oy * 8);
  ctx.fillStyle = dripColor;
  for (let i = 0; i < dripCount; i++) {
    const x = seed(i) * 512;
    const w = 14 + seed(i + 50) * 24;
    const h = 60 + seed(i + 100) * 200;
    const topY = seed(i + 200) * 180;
    // Rounded drip shape
    ctx.beginPath();
    ctx.moveTo(x - w / 2, topY);
    ctx.quadraticCurveTo(x - w / 2, topY + h * 0.7, x, topY + h);
    ctx.quadraticCurveTo(x + w / 2, topY + h * 0.7, x + w / 2, topY);
    ctx.closePath();
    ctx.fill();
    // Paint splatter at drip origin
    ctx.beginPath();
    ctx.arc(x, topY, w * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glossy overlay
  const gloss = ctx.createLinearGradient(0, 0, 0, 512);
  gloss.addColorStop(0, "rgba(255,255,255,0.18)");
  gloss.addColorStop(0.4, "rgba(255,255,255,0)");
  gloss.addColorStop(1, "rgba(0,0,0,0.1)");
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createFlamesTexture(
  ox: number,
  oy: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  // Dark base
  ctx.fillStyle = "#1A0A00";
  ctx.fillRect(0, 0, 512, 512);
  const seed = (n: number) => ((Math.sin(n * 78.233 + oy * 143.3) * 43758.5453) % 1 + 1) % 1;
  const flameCount = 10 + Math.floor(ox * 8);
  for (let i = 0; i < flameCount; i++) {
    const cx = seed(i) * 512;
    const baseY = 480 + seed(i + 30) * 32;
    const h = 120 + seed(i + 60) * 280;
    const w = 20 + seed(i + 90) * 40;
    // Flame gradient
    const grad = ctx.createLinearGradient(cx, baseY, cx, baseY - h);
    grad.addColorStop(0, "#FF4500");
    grad.addColorStop(0.3, "#FF8C00");
    grad.addColorStop(0.6, "#FFD700");
    grad.addColorStop(0.85, "#FBBF24");
    grad.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = grad;
    // Organic flame shape with bezier curves
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY);
    const tipX = cx + (seed(i + 120) - 0.5) * w * 0.8;
    ctx.bezierCurveTo(
      cx - w * 0.6, baseY - h * 0.4,
      cx - w * 0.2, baseY - h * 0.8,
      tipX, baseY - h
    );
    ctx.bezierCurveTo(
      cx + w * 0.2, baseY - h * 0.8,
      cx + w * 0.6, baseY - h * 0.4,
      cx + w / 2, baseY
    );
    ctx.closePath();
    ctx.fill();
  }
  // Hot glow at bottom
  const glow = ctx.createLinearGradient(0, 512, 0, 300);
  glow.addColorStop(0, "rgba(255,100,0,0.35)");
  glow.addColorStop(1, "rgba(255,100,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* --- The Stage 4 Exclusive Rarity Pot --- */
function RarityPot({ offsetX, offsetY }: { offsetX: number; offsetY: number }) {
  const rarity = getRarityFromOffsets(offsetX, offsetY);
  const config = RARITIES[rarity];
  const camo: CamoType = config.camo;

  /* ── 1. UNIQUE SHAPE PER RARITY (LatheGeometry) ── */
  const { potGeometry, rimY, rimRadius, soilRadius } = useMemo(() => {
    const pts: THREE.Vector2[] = [];

    switch (camo) {
      case "flames": {
        // "Golden Chalice" — trophy-like, narrow pedestal flaring to wide cup
        pts.push(
          new THREE.Vector2(0.3, -0.55),
          new THREE.Vector2(0.15, -0.45),
          new THREE.Vector2(0.1, -0.2),
          new THREE.Vector2(0.12, -0.05),
          new THREE.Vector2(0.25, 0.1),
          new THREE.Vector2(0.45, 0.3),
          new THREE.Vector2(0.52, 0.45),
          new THREE.Vector2(0.5, 0.55),
        );
        return { potGeometry: new THREE.LatheGeometry(pts, 32), rimY: 0.55, rimRadius: 0.5, soilRadius: 0.48 };
      }
      case "drip": {
        // "Slumped Jar" — wide belly, narrow neck
        pts.push(
          new THREE.Vector2(0.15, -0.5),
          new THREE.Vector2(0.45, -0.4),
          new THREE.Vector2(0.55, -0.1),
          new THREE.Vector2(0.5, 0.15),
          new THREE.Vector2(0.35, 0.35),
          new THREE.Vector2(0.3, 0.5),
        );
        return { potGeometry: new THREE.LatheGeometry(pts, 32), rimY: 0.5, rimRadius: 0.3, soilRadius: 0.28 };
      }
      case "stripes": {
        // "Tactical Beaker" — angular, straight-walled with flared lip
        pts.push(
          new THREE.Vector2(0.2, -0.5),
          new THREE.Vector2(0.35, -0.45),
          new THREE.Vector2(0.4, -0.1),
          new THREE.Vector2(0.4, 0.3),
          new THREE.Vector2(0.45, 0.4),
          new THREE.Vector2(0.5, 0.5),
        );
        return { potGeometry: new THREE.LatheGeometry(pts, 6), rimY: 0.5, rimRadius: 0.5, soilRadius: 0.43 };
      }
      case "polkadots": {
        // "Royal Urn" — elegant S-curve silhouette (same shape as legendary)
        for (let i = 0; i <= 12; i++) {
          const t = i / 12;
          const r = 0.25 + Math.sin(t * Math.PI) * 0.28;
          pts.push(new THREE.Vector2(r, t * 1.0 - 0.5));
        }
        return { potGeometry: new THREE.LatheGeometry(pts, 32), rimY: 0.5, rimRadius: pts[pts.length - 1].x, soilRadius: pts[pts.length - 1].x - 0.02 };
      }
      default: {
        // "Classic Terracotta" — simple tapered cylinder
        pts.push(
          new THREE.Vector2(0.2, -0.5),
          new THREE.Vector2(0.38, -0.45),
          new THREE.Vector2(0.42, 0.3),
          new THREE.Vector2(0.48, 0.4),
          new THREE.Vector2(0.5, 0.45),
        );
        return { potGeometry: new THREE.LatheGeometry(pts, 32), rimY: 0.45, rimRadius: 0.5, soilRadius: 0.46 };
      }
    }
  }, [camo]);

  /* ── 2. PROCEDURAL TEXTURE (null for legendary — pure gold) ── */
  const potTexture = useMemo(() => {
    switch (camo) {
      case "solid":
        return createSolidTexture(getCommonColor(offsetX));
      case "stripes":
        return createStripesTexture("#1E3A5F", "#60A5FA", offsetX, offsetY);
      case "polkadots":
        return createFlamesTexture(offsetX, offsetY);
      case "drip":
        return createDripTexture("#1F1F1F", "#F472B6", offsetX, offsetY);
      case "flames":
        return null;
    }
  }, [camo, offsetX, offsetY]);

  /* ── 3. MATERIAL ── */
  const potMaterial = useMemo(() => {
    if (camo === "flames") {
      // Legendary — pure polished gold, no texture
      const mat = new THREE.MeshPhysicalMaterial({
        color: "#FFD700",
        roughness: 0.05,
        metalness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 1.0,
      });
      mat.emissive = new THREE.Color("#B8860B");
      mat.emissiveIntensity = 0.25;
      return mat;
    }
    const mat = new THREE.MeshPhysicalMaterial({
      map: potTexture,
      roughness: camo === "polkadots" ? 0.1 : camo === "drip" ? 0.15 : camo === "solid" ? 0.7 : 0.3,
      metalness: camo === "polkadots" ? 0.8 : camo === "drip" ? 0.5 : camo === "solid" ? 0.05 : 0.3,
      clearcoat: camo === "polkadots" ? 1.0 : camo === "drip" ? 0.6 : 0,
      clearcoatRoughness: 0.1,
    });
    if (camo === "polkadots" || camo === "drip") {
      mat.emissive = new THREE.Color(config.glowColor);
      mat.emissiveIntensity = camo === "polkadots" ? 0.4 : 0.2;
    }
    return mat;
  }, [potTexture, camo, config.glowColor]);

  const rimMaterial = useMemo(() => {
    if (camo === "solid") {
      return new THREE.MeshStandardMaterial({ color: "#D4A574", roughness: 0.4, metalness: 0.1 });
    }
    if (camo === "flames") {
      // Legendary — polished gold rim
      const mat = new THREE.MeshStandardMaterial({ color: "#FFD700", roughness: 0.05, metalness: 1.0 });
      mat.emissive = new THREE.Color("#B8860B");
      mat.emissiveIntensity = 0.2;
      return mat;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.1,
      metalness: 0.8,
    });
    if (camo === "polkadots") {
      mat.emissive = new THREE.Color(config.glowColor);
      mat.emissiveIntensity = 0.3;
    }
    return mat;
  }, [camo, config.color, config.glowColor]);

  const soilMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2B1A0E", roughness: 1 }),
    []
  );

  return (
    <group position={[0, -0.4, 0]}>
      {/* Pot body — unique LatheGeometry per rarity */}
      <mesh geometry={potGeometry} material={potMaterial} castShadow receiveShadow />
      {/* Pot Rim — metallic ring color-coded to rarity */}
      <mesh material={rimMaterial} position={[0, rimY, 0]} castShadow>
        <torusGeometry args={[rimRadius, 0.04, 16, 32]} />
      </mesh>
      {/* Top Soil Layer */}
      <mesh material={soilMaterial} position={[0, rimY - 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[soilRadius, soilRadius, 0.02, 32]} />
      </mesh>
      {/* Rarity glow ring (rare + epic + legendary) */}
      {(camo === "polkadots" || camo === "drip" || camo === "flames") && (
        <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.35, 32]} />
          <meshBasicMaterial
            color={camo === "flames" ? "#FFD700" : config.glowColor}
            transparent
            opacity={camo === "flames" ? 0.7 : 0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
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
        <RarityPot offsetX={patternOffsetX} offsetY={patternOffsetY} />
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

      {/* Stage 4 Particles — color matches pot rarity */}
      {growthStage >= 4 &&
        (() => {
          const r = getRarityFromOffsets(patternOffsetX, patternOffsetY);
          const glowColor = RARITIES[r].glowColor;
          return Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <mesh key={`particle-${i}`} position={[Math.cos(angle) * 0.8, 1.5 + Math.sin(i * 0.7) * 0.3, Math.sin(angle) * 0.8]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.0} />
              </mesh>
            );
          });
        })()}
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
