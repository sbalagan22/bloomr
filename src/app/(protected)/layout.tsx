"use client";

import { NavBar } from "@/components/nav-bar";
import { usePathname } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFlowerRoute = pathname?.startsWith("/flower");

  const hideNav = isFlowerRoute || pathname === "/upgrade";

  return (
    <>
      {!hideNav && <NavBar />}
      <main className="flex-1">{children}</main>
    </>
  );
}
