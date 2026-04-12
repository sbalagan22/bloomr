"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
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

const SOIL_DARK = "#2B1A0E";

/* ── Shared material hooks ── */
function useSoilMat() {
  return useMemo(
    () => new THREE.MeshPhongMaterial({ color: SOIL_DARK, flatShading: true }),
    []
  );
}

/* ═══════════════════════════════════════════════════
   POT MODELS  (GLB files, shape-per-rarity)
   Files: /public/models/pots/
   ═══════════════════════════════════════════════════ */

const POT_TARGET_H = 1.1;
// Pot soil surface Y in FlowerModel world space (stage 4) — used for flower clipping
const POT_SOIL_Y = -0.6 + 0.9 * (POT_TARGET_H - 0.015); // ≈ 0.377

const POT_GLB_URLS: Record<Rarity, string> = {
  basic:   "/models/pots/pot_common_1.glb",
  vintage: "/models/pots/pot_uncommon_1.glb",
  rare:    "/models/pots/pot_rare_1.glb",
  antique: "/models/pots/pot_epic_1.glb",
  relic:   "/models/pots/pot_legendary_1.glb",
};

// Only these rarities receive the player's custom potColor tint
const TINTABLE_RARITIES = new Set<Rarity>(["basic", "vintage", "rare"]);

function PotGLBModel({ url, potColor }: { url: string; potColor?: string }) {
  const { scene } = useGLTF(url);
  const soilMat   = useSoilMat();

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((node) => {
      if (!(node as THREE.Mesh).isMesh) return;
      const mesh = node as THREE.Mesh;
      const fixMat = (mat: THREE.Material): THREE.Material => {
        const m = mat.clone();
        const sm = m as THREE.MeshStandardMaterial;
        if (sm.isMeshStandardMaterial) {
          // Prevent pots looking dark without an env map
          sm.roughness = 0.85;
          sm.metalness = 0;
          sm.envMapIntensity = 0;
          if (potColor && sm.color) sm.color.set(potColor);
        }
        return m;
      };
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(fixMat)
        : fixMat(mesh.material);
    });
    return clone;
  }, [scene, potColor]);

  const { wrapPos, wrapScale } = useMemo(() => {
    // All pot GLBs are exported Z-up (height along +Z, bottom at Z=0).
    // Rotate X by -90° to convert to Y-up for Three.js.
    const temp = scene.clone();
    temp.rotation.x = -Math.PI / 2;
    temp.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(temp);
    const size = new THREE.Vector3();
    box.getSize(size);
    const centre = new THREE.Vector3();
    box.getCenter(centre);
    const s = size.y > 0 ? POT_TARGET_H / size.y : 1;
    return {
      wrapPos:  [-s * centre.x, -s * box.min.y, -s * centre.z] as [number, number, number],
      wrapScale: s,
    };
  }, [scene]);

  return (
    <>
      <group position={wrapPos} rotation={[-Math.PI / 2, 0, 0]} scale={wrapScale}>
        <primitive object={clonedScene} castShadow receiveShadow />
      </group>
      <mesh material={soilMat} position={[0, POT_TARGET_H - 0.015, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.03, 12]} />
      </mesh>
    </>
  );
}

function RarityPot({ rarity, potColor }: { rarity: Rarity; potColor?: string }) {
  const url = POT_GLB_URLS[rarity] ?? POT_GLB_URLS.basic;
  // Only tint pots for basic/vintage/rare; antique/relic keep their GLB colors
  const colorOverride = TINTABLE_RARITIES.has(rarity) ? potColor : undefined;
  return (
    <Suspense fallback={null}>
      <PotGLBModel url={url} potColor={colorOverride} />
    </Suspense>
  );
}

// Preload all pot GLBs
[
  "/models/pots/pot_common_1.glb",
  "/models/pots/pot_uncommon_1.glb",
  "/models/pots/pot_rare_1.glb",
  "/models/pots/pot_epic_1.glb",
  "/models/pots/pot_legendary_1.glb",
].forEach((url) => useGLTF.preload(url));

/* ═══════════════════════════════════════════════════
   STL FLOWER LOADER
   ═══════════════════════════════════════════════════ */

// lavender reuses the lily GLB
const GLB_TYPE_MAP: Record<string, string> = { lavender: "lily" };
const FLOWER_GLB_TYPES = ["rose", "tulip", "sunflower", "daisy", "lily"] as const;

function getGLBUrl(flowerType: string): string {
  const type = GLB_TYPE_MAP[flowerType] ?? flowerType;
  return `/models/${type}.glb`;
}

// Each GLB contains four named nodes for the four growth stages
function getNodeName(growthStage: number): string {
  if (growthStage >= 4) return "full";
  if (growthStage === 3) return "stage2_budding";
  if (growthStage === 2) return "stage1b_young_sprout";
  return "stage1_seedling";
}

// Target height in Three.js world units per growth stage index
const STAGE_TARGET_H = [0, 1.2, 1.8, 2.4, 2.4] as const;

/**
 * Finds the correct stage mesh inside the flower's GLB by node name,
 * auto-orients it to Y-up, scales it to the target height, then colours
 * each vertex by normalised height:
 *   bottom 3%  → soil brown  (blends into pot soil)
 *   lower zone → green       (stem + leaves, with subtle depth variation)
 *   blend zone → green → petal colour transition
 *   upper zone → petal colour shading to accent at the tips
 */
function FlowerGLBMesh({
  url,
  growthStage,
}: {
  url: string;
  flowerType: string;
  growthStage: number;
}) {
  const nodeName   = getNodeName(growthStage);
  const { scene }  = useGLTF(url);

  const processedGeo = useMemo(() => {
    // Find the mesh node for this growth stage
    let target: THREE.Mesh | undefined;
    scene.traverse((node) => {
      if (node.name === nodeName && (node as THREE.Mesh).isMesh) {
        target = node as THREE.Mesh;
      }
    });
    if (!target) return null;

    const geo = target.geometry.clone();
    geo.computeBoundingBox();
    let box = geo.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);

    // Meshes were built from Z-up STL data — rotate to Y-up
    if (size.z > size.y * 1.1) {
      geo.rotateX(-Math.PI / 2);
      geo.computeBoundingBox();
      box = geo.boundingBox!;
      box.getSize(size);
    }

    // Centre XZ, lift bottom face to Y = 0
    const centre = new THREE.Vector3();
    box.getCenter(centre);
    geo.translate(-centre.x, -box.min.y, -centre.z);
    geo.computeBoundingBox();
    box = geo.boundingBox!;
    box.getSize(size);

    // Uniform scale to target height
    const targetH = STAGE_TARGET_H[Math.min(growthStage, 4)] ?? 2.4;
    const s = size.y > 0 ? targetH / size.y : 1;
    geo.scale(s, s, s);

    geo.computeVertexNormals();
    return geo;
  }, [scene, nodeName, growthStage]);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      flatShading:  true,
      shininess:    25,
      side:         THREE.DoubleSide,
    });
    if (growthStage >= 4) {
      // Clip away the flower's soil portion — everything below the pot's soil surface
      mat.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -POT_SOIL_Y)];
      mat.clipShadows = true;
    }
    return mat;
  }, [growthStage]);

  if (!processedGeo) return null;

  const yPos = growthStage >= 4 ? 0.0 : -0.50;

  return (
    <mesh
      geometry={processedGeo}
      material={material}
      position={[0, yPos, 0]}
      castShadow
      receiveShadow
    />
  );
}

function FlowerPlant({
  flowerType,
  growthStage,
}: {
  flowerType: string;
  growthStage: number;
}) {
  if (growthStage <= 0) return null;
  const url = getGLBUrl(flowerType);
  return (
    <Suspense fallback={null}>
      <FlowerGLBMesh url={url} flowerType={flowerType} growthStage={growthStage} />
    </Suspense>
  );
}

// Preload all flower GLBs so they are ready before first render
FLOWER_GLB_TYPES.forEach((type) => useGLTF.preload(`/models/${type}.glb`));

/* ═══════════════════════════════════════════════════
   MAIN FLOWER MODEL
   ═══════════════════════════════════════════════════ */

export function FlowerModel({
  flowerType,
  growthStage,
  rarity: rarityProp = "basic",
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
        <group position={[0, -0.6, 0]} scale={0.9}>
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

      {/* Stage 1+: GLB model (stem, leaves, bloom coloured by vertex height) */}
      {growthStage >= 1 && (
        <FlowerPlant flowerType={flowerType} growthStage={growthStage} />
      )}

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
  rarity = "basic",
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
      <Canvas camera={{ position: [2, 4, 6], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
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
