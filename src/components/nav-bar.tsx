"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PiFlowerBold, PiUploadSimpleBold, PiSignOutBold,
  PiSparkle, PiInfinityBold, PiPlantBold,
} from "react-icons/pi";
import { usePlan } from "@/hooks/use-plan";
import { useSeedCount } from "@/hooks/use-seed-count";

const NAV_ITEMS = [
  { href: "/garden", label: "Garden", icon: PiFlowerBold },
  { href: "/upload", label: "Upload", icon: PiUploadSimpleBold },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { plan, loading: planLoading } = usePlan();
  const { remaining, usage, loading: seedLoading } = useSeedCount();

  const seedTooltip = (() => {
    if (!usage?.nextReset) return "Resets every Saturday";
    const d = new Date(usage.nextReset);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays === 0) return `Resets in ${diffHrs}h`;
    if (diffDays === 1) return `Resets tomorrow (${d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })})`;
    return `Resets ${d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}`;
  })();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const showSeeds = !planLoading && !seedLoading && plan === "free";
  const seedsOut = showSeeds && remaining === 0;

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-surface/80 glass-morphism rounded-full shadow-lg border border-white/50 px-6 py-3 transition-all">
      <div className="flex w-full items-center justify-between">
        {/* Logo — links to garden (dashboard) */}
        <Link href="/garden" className="flex items-center gap-2 group">
          <Image
            src="/bloomr_icon.svg"
            alt="Bloomr"
            width={28}
            height={28}
            className="drop-shadow-sm group-hover:rotate-12 transition-transform duration-300"
          />
          <span className="text-2xl text-primary-container tracking-tighter font-logo">
            Bloomr
          </span>
        </Link>

        {/* Nav links + plan / seed badges */}
        <div className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-primary-fixed text-on-primary-fixed"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <item.icon className="text-lg" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          {/* Seed count — free users only */}
          {showSeeds && (
            <div
              className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black border transition-colors ${
                seedsOut
                  ? "bg-red-50 border-red-200 text-red-500"
                  : remaining === 1
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-[#39AB54]/8 border-[#39AB54]/20 text-[#39AB54]"
              }`}
              title={seedTooltip}
            >
              <PiPlantBold className="text-sm" />
              <span>{remaining}/3 seeds</span>
            </div>
          )}

          {/* Plan badge / Upgrade CTA */}
          {!planLoading && (
            plan === "pro" ? (
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-[#39AB54]/10 border border-[#39AB54]/20 text-xs font-black text-[#39AB54]">
                <PiInfinityBold className="text-sm" />
                <span className="hidden sm:inline">Pro</span>
              </div>
            ) : (
              <Link
                href="/upgrade"
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white bg-[#39AB54] hover:bg-[#2A8040] shadow-md shadow-[#39AB54]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <PiSparkle className="text-base" />
                <span className="hidden sm:inline">Upgrade</span>
              </Link>
            )
          )}

          <button
            onClick={handleSignOut}
            className="ml-1 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <PiSignOutBold className="text-lg" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
