"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlan } from "@/hooks/use-plan";

interface SeedUsage {
  used: number;
  limit: number;
  nextReset: string; // ISO string — always next Saturday 00:00 UTC
}

export function useSeedCount() {
  const { plan, loading: planLoading } = usePlan();
  const [usage, setUsage] = useState<SeedUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/seeds/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (planLoading) return;
    refresh();

    // Auto-refresh at next Saturday reset
    if (usage?.nextReset) {
      const msUntilReset = new Date(usage.nextReset).getTime() - Date.now();
      if (msUntilReset > 0) {
        const t = setTimeout(refresh, msUntilReset);
        return () => clearTimeout(t);
      }
    }
  }, [planLoading, refresh, usage?.nextReset]);

  const remaining = plan === "pro" ? Infinity : Math.max(0, 3 - (usage?.used ?? 0));

  return { usage, remaining, loading, refresh };
}
