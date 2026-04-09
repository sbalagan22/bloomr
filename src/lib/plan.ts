import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export type Plan = "free" | "pro";

export function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getUserPlan(): Promise<Plan> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "free";

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.plan === "pro" && (data.status === "active" || data.status === "trialing")) {
    return "pro";
  }
  return "free";
}

/** Returns the most recent Saturday (00:00:00 UTC) as the start of the current seed week. */
export function getLastSaturdayUTC(): Date {
  const now = new Date();
  // getUTCDay: 0=Sun,1=Mon,...,5=Fri,6=Sat
  const dayOfWeek = now.getUTCDay();
  const daysBack = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const sat = new Date(now);
  sat.setUTCDate(now.getUTCDate() - daysBack);
  sat.setUTCHours(0, 0, 0, 0);
  return sat;
}

/** Returns the next Saturday (00:00:00 UTC) — when the seed count resets. */
export function getNextSaturdayUTC(): Date {
  const last = getLastSaturdayUTC();
  const next = new Date(last);
  next.setUTCDate(last.getUTCDate() + 7);
  return next;
}

/** Returns whether user can plant a new seed. Free = 3/week (resets Saturdays), Pro = unlimited. */
export async function checkSeedLimit(): Promise<{ allowed: boolean; used: number; limit: number; nextReset: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const nextReset = getNextSaturdayUTC().toISOString();
  if (!user) return { allowed: false, used: 0, limit: 3, nextReset };

  const plan = await getUserPlan();
  if (plan === "pro") return { allowed: true, used: 0, limit: Infinity, nextReset };

  const since = getLastSaturdayUTC().toISOString();
  const { count } = await supabase
    .from("flowers")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  const used = count ?? 0;
  return { allowed: used < 3, used, limit: 3, nextReset };
}

/** Returns whether user can send another Flowy message today. Free = 10/day/flower, Pro = unlimited. */
export async function checkFlowyLimit(
  userId: string,
  flowerId: string,
  plan: Plan
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (plan === "pro") return { allowed: true, used: 0, limit: Infinity };

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("flowy_usage")
    .select("message_count")
    .eq("user_id", userId)
    .eq("flower_id", flowerId)
    .eq("usage_date", today)
    .maybeSingle();

  const used = data?.message_count ?? 0;
  return { allowed: used < 10, used, limit: 10 };
}

/** Atomically increments flowy usage for today. */
export async function incrementFlowyUsage(userId: string, flowerId: string): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  await supabase.rpc("increment_flowy_usage", {
    p_user_id: userId,
    p_flower_id: flowerId,
    p_date: today,
  });
}
