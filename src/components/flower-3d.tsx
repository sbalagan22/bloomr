"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Sky, Stars } from "@react-three/drei";
import * as THREE from "three";
import { type Rarity, RARITIES } from "@/lib/rarity";
import { useTimeOfDay, getSkyConfig } from "@/hooks/use-time-of-day";


interface Flower3DProps {
  flowerType: string;
  growthStage: number;
  rarity?: Rarity;
  potColor?: string;
  size?: "sm" | "md" | "lg" | "full";
  interactive?: boolean;
  disableZoom?: boolean;
  potVariant?: number;
  showGround?: boolean;
  background?: string;
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
const POT_SOIL_Y = 0.9 * (POT_TARGET_H - 0.015);

const POT_RARITY_FILE_PREFIX: Record<Rarity, string> = {
  basic:   "pot_common",
  vintage: "pot_uncommon",
  rare:    "pot_rare",
  antique: "pot_epic",
  relic:   "pot_legendary",
};

const VARIANT_COUNTS: Record<Rarity, number> = {
  basic: 1, vintage: 1, rare: 2, antique: 2, relic: 3,
};

function getPotGLBUrl(rarity: Rarity, variant: number): string {
  const prefix = POT_RARITY_FILE_PREFIX[rarity];
  const clampedVariant = Math.max(1, Math.min(variant, VARIANT_COUNTS[rarity]));
  return `/models/pots/${prefix}_${clampedVariant}.glb`;
}

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

function RarityPot({ rarity, potColor, potVariant = 1 }: { rarity: Rarity; potColor?: string; potVariant?: number }) {
  const url = getPotGLBUrl(rarity, potVariant);
  const colorOverride = TINTABLE_RARITIES.has(rarity) ? potColor : undefined;
  return (
    <Suspense fallback={null}>
      <PotGLBModel url={url} potColor={colorOverride} />
    </Suspense>
  );
}

// Preload all pot GLB variants
(["basic","vintage","rare","antique","relic"] as Rarity[]).forEach((rarity) => {
  for (let v = 1; v <= VARIANT_COUNTS[rarity]; v++) {
    useGLTF.preload(getPotGLBUrl(rarity, v));
  }
});

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
  flowerType,
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
    
    geo.computeBoundingBox();
    const finalBox = geo.boundingBox!;
    const h = finalBox.max.y - finalBox.min.y;
    // Calculate approximate XZ center and radius for petal center detection
    const cx = (finalBox.max.x + finalBox.min.x) / 2;
    const cz = (finalBox.max.z + finalBox.min.z) / 2;
    const maxRadiusSq = Math.max((finalBox.max.x - cx)**2, (finalBox.max.z - cz)**2);

    const pos = geo.attributes.position;
    if (pos && h > 0) {
      const colors = new Float32Array(pos.count * 3);
      const color = new THREE.Color();
      
      const targetPetalColor = new THREE.Color(0xffffff);
      const centerColor = new THREE.Color();
      let hasCenterColor = false;
      
      if (flowerType === "daisy") {
        targetPetalColor.setHex(0xffffff);
        centerColor.setHex(0xffcc00); // Yellow center
        hasCenterColor = true;
      } else if (flowerType === "sunflower") {
        targetPetalColor.setHex(0xffcc00);
        centerColor.setHex(0x4a2e15); // Dark brown center
        hasCenterColor = true;
      } else if (flowerType === "rose") targetPetalColor.setHex(0xe6192b);
      else if (flowerType === "tulip") targetPetalColor.setHex(0x2a52be);
      else if (flowerType === "lily") targetPetalColor.setHex(0xff69b4);
      else targetPetalColor.setHex(0xe8637a);
      
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const normY = (y - finalBox.min.y) / h;
        const radSq = (x - cx)**2 + (z - cz)**2;
        
        if (normY < 0.03) {
          color.setHex(0x4a3424); // soil brown
        } else if (normY < 0.70) {
          color.setHex(0x2d8a39); // green stem/leaves
        } else if (normY < 0.85) {
          color.setHex(0x2d8a39).lerp(targetPetalColor, (normY - 0.70) / 0.15); // blend zone
        } else {
          // upper zone -> petal color
          if (hasCenterColor && normY > 0.88 && radSq < maxRadiusSq * 0.15) {
             // It's in the top area and close to the center (radius squared < 15% of max radius squared)
             color.copy(centerColor);
          } else {
             color.copy(targetPetalColor).offsetHSL(0, 0, (normY - 0.85) * 0.4);
          }
        }
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    geo.computeVertexNormals();
    return geo;
  }, [scene, nodeName, growthStage, flowerType]);

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

  const yPos = growthStage >= 4 ? 0.6 : -0.50;

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
  potVariant = 1,
  isEditorMode = false,
}: {
  flowerType: string;
  growthStage: number;
  rarity?: Rarity;
  potColor?: string;
  potVariant?: number;
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
    <group ref={groupRef} scale={scale} position={[0, 0, 0]}>

      {/* Pot (stage 4) or soil mound (stages 0–3) */}
      {growthStage >= 4 ? (
        <group position={[0, 0, 0]} scale={0.9}>
          <RarityPot rarity={rarity} potColor={potColor} potVariant={potVariant} />
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
          <mesh key={`p${i}`} position={[Math.cos(a) * 0.8, 2.1 + Math.sin(i * 0.7) * 0.3, Math.sin(a) * 0.8]}>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshStandardMaterial color={gc} emissive={gc} emissiveIntensity={1.2} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════
   ENDLESS TERRAIN
   ═══════════════════════════════════════════════════ */

function EndlessTerrain() {
  const timeOfDay = useTimeOfDay();
  const skyConfig = getSkyConfig(timeOfDay);

  // Slight tint: day = bright green, sunset = slightly warm, night = slightly muted (not dark)
  const groundColor = timeOfDay === 'night'
    ? "#3A8A44"
    : timeOfDay === 'sunset'
      ? "#4DB558"
      : "#4CAF60";

  const grassTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 0, 512, 512);
    // Add subtle noise
    for (let i = 0; i < 20000; i++) {
      // eslint-disable-next-line react-hooks/purity
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
      // eslint-disable-next-line react-hooks/purity
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(150, 150);
    return texture;
  }, [groundColor]);

  return (
    <>
      {timeOfDay === 'night' && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
      <Sky 
        sunPosition={skyConfig.sunPosition} 
        turbidity={skyConfig.turbidity} 
        rayleigh={skyConfig.rayleigh} 
        mieCoefficient={skyConfig.mieCoefficient} 
        mieDirectionalG={skyConfig.mieDirectionalG} 
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]} receiveShadow>
        <planeGeometry args={[1500, 1500, 1, 1]} />
        <meshStandardMaterial map={grassTexture} roughness={1} />
      </mesh>
    </>
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
  disableZoom = false,
  potVariant = 1,
  showGround = false,
  background,
}: Flower3DProps) {
  const sizeMap = {
    sm:   "h-32 w-32",
    md:   "h-48 w-48",
    lg:   "h-64 w-64",
    full: "w-full h-full absolute inset-0",
  };


  return (
    <div
      style={background ? { background } : undefined}
      className={`${sizeMap[size]} ${size !== "full" ? "rounded-2xl overflow-hidden" : ""}`}
    >
      <Canvas camera={{ position: [0, 1.8, 6], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} color="#FFFFFF" castShadow />
        <pointLight position={[-3, 4, -3]} intensity={0.4} color="#C8EDCF" />
        <FlowerModel
          flowerType={flowerType}
          growthStage={growthStage}
          rarity={rarity}
          potColor={potColor}
          potVariant={potVariant}
        />
        {showGround ? <EndlessTerrain /> : null}
        {interactive && (
          <OrbitControls
            target={[0, 1.0, 0]}
            enableZoom={!disableZoom && size === "full"}
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
