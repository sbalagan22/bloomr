"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PiFlowerBold, PiUploadSimpleBold, PiSignOutBold,
  PiSparkle, PiInfinityBold, PiPlantBold,
  PiGearSixBold, PiCreditCardBold,
} from "react-icons/pi";
import { usePlan } from "@/hooks/use-plan";
import { useSeedCount } from "@/hooks/use-seed-count";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// DropdownMenuTrigger uses MenuPrimitive.Trigger (Base UI) — we use its raw element
import { Menu as MenuPrimitive } from "@base-ui/react/menu";

const NAV_ITEMS = [
  { href: "/garden", label: "Garden", icon: PiFlowerBold },
  { href: "/upload", label: "Upload", icon: PiUploadSimpleBold },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { plan, loading: planLoading } = usePlan();
  const { remaining, usage, loading: seedLoading } = useSeedCount();

  const [user, setUser] = useState<{ email?: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
        });
      }
    }).catch((err) => {
      console.error("Failed to fetch user:", err);
    });
  }, []);

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

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) {
        console.error("Failed to fetch portal URL:", res.status);
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Error opening subscription portal:", err);
    }
  };

  const showSeeds = !planLoading && !seedLoading && plan === "free";
  const seedsOut = showSeeds && remaining === 0;
  const initials = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-white/10 backdrop-blur-2xl rounded-full shadow-xl ring-1 ring-white/20 border border-white/30 px-6 py-3.5 transition-all">
      <div className="flex w-full items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
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

        {/* Nav links + badges */}
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

          {/* Seed count with custom tooltip */}
          {showSeeds && (
            <div className="relative group hidden sm:flex">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black border transition-colors cursor-default ${
                  seedsOut
                    ? "bg-red-50 border-red-200 text-red-500"
                    : remaining === 1
                    ? "bg-amber-50 border-amber-200 text-amber-600"
                    : "bg-[#39AB54]/8 border-[#39AB54]/20 text-[#39AB54]"
                }`}
              >
                <PiPlantBold className="text-sm" />
                <span>{remaining}/3 seeds</span>
              </div>
              {/* Tooltip — anchored right to avoid off-screen bleed */}
              <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover:flex flex-col items-end z-50 pointer-events-none">
                <div className="bg-[#1A2318] text-white text-[11px] font-medium rounded-xl px-3.5 py-2.5 shadow-xl min-w-max border border-white/10">
                  <div className="text-[#5CC873] font-bold mb-0.5">🌱 Seeds refill</div>
                  <div>{seedTooltip}</div>
                </div>
                <div className="w-2 h-2 bg-[#1A2318] rotate-45 mr-3 -mt-1 border-r border-b border-white/10" />
              </div>
            </div>
          )}

          {/* Plan badge */}
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

          {/* Profile dropdown — using MenuPrimitive.Root directly to avoid GroupLabel-outside-Group bug */}
          <DropdownMenu>
            <MenuPrimitive.Trigger
              className="ml-1 w-9 h-9 rounded-full bg-[#39AB54] text-white font-bold text-sm flex items-center justify-center overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39AB54] focus-visible:ring-offset-2 shrink-0"
              aria-label="Profile menu"
            >
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </MenuPrimitive.Trigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-2">
              {/* User info block — plain div, not GroupLabel */}
              <div className="px-3 py-3 flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-[#39AB54] text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#1c1c18] truncate">{user?.email ?? "Account"}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {plan === "pro" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#39AB54] bg-[#39AB54]/10 px-1.5 py-0.5 rounded-full">
                        <PiInfinityBold className="text-[10px]" /> Pro
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-on-surface-variant">Free plan</span>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
                  <PiGearSixBold className="text-base text-on-surface-variant" />
                  <span className="text-sm font-medium">Settings</span>
                </DropdownMenuItem>

                {plan === "pro" && (
                  <DropdownMenuItem onClick={handleManageSubscription} className="cursor-pointer">
                    <PiCreditCardBold className="text-base text-on-surface-variant" />
                    <span className="text-sm font-medium">Manage subscription</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <PiSignOutBold className="text-base" />
                  <span className="text-sm font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
