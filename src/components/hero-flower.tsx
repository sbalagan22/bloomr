"use client";

import dynamic from "next/dynamic";

const Flower3D = dynamic(
  () => import("@/components/flower-3d").then((mod) => ({ default: mod.Flower3D })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-primary-fixed/20 rounded-[3rem]" /> }
);

export function HeroFlower() {
  return (
    <Flower3D
      flowerType="rose"
      growthStage={4}
      rarity="epic"
      interactive={true}
      size="full"
    />
  );
}
