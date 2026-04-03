"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PiFlowerBold, PiUploadSimpleBold, PiSignOutBold } from "react-icons/pi";

const NAV_ITEMS = [
  { href: "/garden", label: "Garden", icon: PiFlowerBold },
  { href: "/upload", label: "Upload", icon: PiUploadSimpleBold },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-surface/80 glass-morphism rounded-full shadow-lg border border-white/50 px-6 py-3 transition-all">
      <div className="flex w-full items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/bloomr_icon.svg" alt="Bloomr" width={28} height={28} className="drop-shadow-sm" />
          <span className="text-2xl text-primary-container tracking-tighter font-logo">
            Bloomr
          </span>
        </Link>

        {/* Nav Links */}
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
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="ml-2 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <PiSignOutBold className="text-lg" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
