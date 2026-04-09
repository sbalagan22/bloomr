/**
 * GET /api/stripe/verify-session?session_id=cs_xxx
 *
 * Called from the success redirect (/garden?upgraded=true&session_id=...) as a
 * webhook fallback. If the webhook already wrote the subscription this is a no-op.
 * If not, we retrieve the Stripe session + subscription and write it ourselves.
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getServiceClient } from "@/lib/plan";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ ok: false, error: "Missing session_id" }, { status: 400 });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: false, error: "Not paid" }, { status: 402 });
    }

    const userId = session.metadata?.user_id;
    if (!userId) return NextResponse.json({ ok: false, error: "No user_id in session metadata" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = session.subscription as any;
    const periodEnd: number | undefined = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end;

    const supabase = getServiceClient();
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: typeof sub === "string" ? sub : sub?.id,
      plan: "pro",
      status: "active",
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[verify-session]", err);
    return NextResponse.json({ ok: false, error: "Failed to verify session" }, { status: 500 });
  }
}
