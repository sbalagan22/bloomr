"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PiFlowerBold, PiUploadSimpleBold, PiSignOutBold,
  PiSparkle, PiInfinityBold, PiPlantBold, PiUserBold,
} from "react-icons/pi";
import { usePlan } from "@/hooks/use-plan";
import { useSeedCount } from "@/hooks/use-seed-count";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  const showSeeds = !planLoading && !seedLoading && plan === "free";
  const seedsOut = showSeeds && remaining === 0;

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-surface/80 glass-morphism rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.35)] border border-white/60 px-6 py-3.5 transition-all">
      <div className="flex w-full items-center justify-between">
        {/* Logo — links to landing page, user stays signed in */}
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

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39AB54]">
              <Avatar className="w-9 h-9">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Profile" />}
                <AvatarFallback className="bg-[#39AB54] text-white font-bold text-sm">
                  {user?.email?.[0]?.toUpperCase() ?? <PiUserBold />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                {user?.email ?? "Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <PiSignOutBold className="mr-2 text-base" />
                Sign out
              </DropdownMenuItem>
              {plan === "pro" && (
                <DropdownMenuItem onClick={handleManageSubscription} className="cursor-pointer">
                  <PiSparkle className="mr-2 text-base" />
                  Manage subscription
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
