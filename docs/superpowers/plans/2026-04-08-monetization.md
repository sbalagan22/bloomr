# Bloomr Monetization — Free & Pro Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Free/Pro subscription tiers with Stripe billing, Supabase subscription tracking, full feature gating, and a premium pricing section on the landing page.

**Architecture:** Stripe handles billing; Supabase stores subscription state synced via webhook. A server-side `getUserPlan()` utility + client-side `usePlan()` hook provide plan context everywhere. Feature limits are enforced at the API layer (not just UI) for security.

**Tech Stack:** Stripe (billing + webhook), Supabase MCP (schema), Next.js API routes (webhook, checkout, portal), React hook (client plan context)

---

## Plan Definitions

### Free Plan
- 3 seeds (flowers) per week
- Upload sources: PDF only (voice/image/youtube gated behind Pro)
- All study features: units, MC quiz, audio, concept maps
- Weak areas analysis
- Practice quizzes (existing feature)
- AI Tutor Flowy — **10 messages per day per flower**

### Pro Plan — $5.99/month
- Everything in Free
- Unlimited seeds
- Unlimited Flowy messages
- Voice input for uploads
- YouTube link uploads
- Image uploads with AI analysis
- Export study notes as PDF *(future feature stub)*

---

## File Map

### New files to create
- `src/lib/stripe.ts` — Stripe client singleton
- `src/lib/plan.ts` — `getUserPlan()` server util, `checkSeedLimit()`, `checkFlowyLimit()`
- `src/hooks/use-plan.ts` — Client-side `usePlan()` hook
- `src/app/api/stripe/checkout/route.ts` — Create Stripe checkout session
- `src/app/api/stripe/portal/route.ts` — Create Stripe customer portal session
- `src/app/api/stripe/webhook/route.ts` — Stripe webhook handler
- `src/components/upgrade-modal.tsx` — Reusable "upgrade to Pro" modal
- `src/components/pricing-section.tsx` — Landing page pricing cards
- `supabase/migrations/20260408_subscriptions.sql` — DB schema

### Files to modify
- `src/app/page.tsx` — Add `<PricingSection />` + "Pricing" nav link
- `src/app/(protected)/upload/page.tsx` — Remove "text" tab; gate image/voice/youtube behind Pro badge + upgrade prompt
- `src/components/chat-tutor.tsx` — Enforce 10 msg/day limit for Free users, show upgrade prompt when exhausted
- `src/app/api/chat/route.ts` — Server-side Flowy limit check
- `src/app/api/process/route.ts` — Server-side seed count check (3/week Free)
- `.env.local` — Add Stripe keys

---

## Task 1: Stripe Setup via Stripe MCP

**Files:** `.env.local`

- [ ] **Step 1: Create Stripe Free product** (it's a marker — $0)

Use Stripe MCP: create product named "Bloomr Free" with description "3 seeds/week, 10 Flowy messages/day"

- [ ] **Step 2: Create Stripe Pro product + price**

Use Stripe MCP: create product named "Bloomr Pro" with description "Unlimited seeds, unlimited Flowy, voice/image/YouTube uploads". Create recurring price: $5.99/month USD. Note the price ID.

- [ ] **Step 3: Add env vars to .env.local**

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Task 2: Supabase Schema via Supabase MCP

**Files:** `supabase/migrations/20260408_subscriptions.sql`

- [ ] **Step 1: Create subscriptions table via Supabase MCP**

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

- [ ] **Step 2: Enable RLS + add policy**

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

- [ ] **Step 3: Create flowy_usage table for daily message tracking**

```sql
CREATE TABLE IF NOT EXISTS flowy_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flower_id UUID NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, flower_id, usage_date)
);

ALTER TABLE flowy_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read/write own flowy usage"
  ON flowy_usage FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 4: Save migration file**

Write the full SQL above to `supabase/migrations/20260408_subscriptions.sql`.

---

## Task 3: Stripe Client + Plan Utilities

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/lib/plan.ts`

- [ ] **Step 1: Create Stripe singleton**

```typescript
// src/lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});
```

- [ ] **Step 2: Create server-side plan utilities**

```typescript
// src/lib/plan.ts
import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

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

/** Returns true if user is within their weekly seed limit. Free = 3/week, Pro = unlimited. */
export async function checkSeedLimit(): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, used: 0, limit: 3 };

  const plan = await getUserPlan();
  if (plan === "pro") return { allowed: true, used: 0, limit: Infinity };

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("flowers")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", weekAgo);

  const used = count ?? 0;
  return { allowed: used < 3, used, limit: 3 };
}

/** Returns true if user can send another Flowy message today. Free = 10/day/flower, Pro = unlimited. */
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

/** Increments flowy usage count for today. Upserts. */
export async function incrementFlowyUsage(userId: string, flowerId: string): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  await supabase.rpc("increment_flowy_usage", {
    p_user_id: userId,
    p_flower_id: flowerId,
    p_date: today,
  });
}
```

- [ ] **Step 3: Add increment_flowy_usage RPC via Supabase MCP**

```sql
CREATE OR REPLACE FUNCTION increment_flowy_usage(
  p_user_id UUID,
  p_flower_id UUID,
  p_date DATE
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO flowy_usage (user_id, flower_id, usage_date, message_count)
  VALUES (p_user_id, p_flower_id, p_date, 1)
  ON CONFLICT (user_id, flower_id, usage_date)
  DO UPDATE SET message_count = flowy_usage.message_count + 1;
END;
$$;
```

---

## Task 4: Client-Side usePlan Hook

**Files:**
- Create: `src/hooks/use-plan.ts`

- [ ] **Step 1: Write the hook**

```typescript
// src/hooks/use-plan.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Plan = "free" | "pro";

export function usePlan() {
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.plan === "pro" && (data.status === "active" || data.status === "trialing")) {
        setPlan("pro");
      }
      setLoading(false);
    }
    fetchPlan();
  }, []);

  return { plan, loading, isPro: plan === "pro" };
}
```

---

## Task 5: Stripe API Routes

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/portal/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create checkout session route**

```typescript
// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  // Check if customer already exists
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : user.email,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${origin}/garden?upgraded=true`,
    cancel_url: `${origin}/garden`,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
  });

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 2: Create customer portal route**

```typescript
// src/app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/garden`,
  });

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 3: Create webhook handler**

```typescript
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId || !session.customer || !session.subscription) break;

      // Fetch subscription to get period_end
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: "pro",
        status: "active",
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      const isActive = subscription.status === "active" || subscription.status === "trialing";

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        plan: isActive ? "pro" : "free",
        status: subscription.status as string,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      if (!subId) break;

      await supabase.from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 4: Disable body parsing for webhook route**

Add to `src/app/api/stripe/webhook/route.ts` (at module level, before POST):
```typescript
export const config = { api: { bodyParser: false } };
```
Note: In Next.js App Router, `req.text()` already reads the raw body. No extra config needed.

---

## Task 6: Upgrade Modal Component

**Files:**
- Create: `src/components/upgrade-modal.tsx`

- [ ] **Step 1: Create the upgrade modal**

```typescript
// src/components/upgrade-modal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PiSparkle, PiXBold } from "react-icons/pi";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason: string; // e.g. "You've used all 3 seeds this week."
}

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-3xl border-0 bg-white p-8 text-center shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <PiXBold className="text-xl" />
        </button>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#39AB54]/10">
          <PiSparkle className="text-3xl text-[#39AB54]" />
        </div>
        <h2 className="font-heading text-2xl font-black text-[#1c1c18] mb-2">Unlock Pro</h2>
        <p className="text-sm text-gray-500 mb-1">{reason}</p>
        <p className="text-sm text-gray-500 mb-6">Upgrade to Pro for unlimited access.</p>

        <div className="rounded-2xl bg-[#f7f2ea] p-4 mb-6 text-left space-y-2">
          {[
            "Unlimited seeds & flowers",
            "Unlimited Flowy messages",
            "Voice, image & YouTube uploads",
            "Export study notes as PDF",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm font-medium text-[#1c1c18]">
              <span className="text-[#39AB54]">✓</span> {item}
            </div>
          ))}
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-full bg-[#39AB54] py-6 text-base font-bold text-white hover:bg-[#2A8040]"
        >
          {loading ? "Redirecting..." : "Upgrade for $5.99/month"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Task 7: Server-Side Limit Enforcement on API Routes

### 7a: Enforce seed limit in process route

**Files:** Modify `src/app/api/process/route.ts`

- [ ] **Step 1: Add seed check at the top of POST handler**

After the auth check, before creating the flower, call `checkSeedLimit()`. Return 403 with `{ error: "SEED_LIMIT_REACHED", used: N, limit: 3 }` if over limit.

```typescript
import { checkSeedLimit } from "@/lib/plan";

// Inside POST, after auth:
const seedCheck = await checkSeedLimit();
if (!seedCheck.allowed) {
  return NextResponse.json(
    { error: "SEED_LIMIT_REACHED", used: seedCheck.used, limit: seedCheck.limit },
    { status: 403 }
  );
}
```

### 7b: Enforce Flowy limit + increment in chat route

**Files:** Modify `src/app/api/chat/route.ts`

- [ ] **Step 2: Add Flowy daily limit check**

After auth check, call `getUserPlan()`, then `checkFlowyLimit()`. Return 403 with `{ error: "FLOWY_LIMIT_REACHED" }` if over limit. On success, call `incrementFlowyUsage()`.

```typescript
import { getUserPlan, checkFlowyLimit, incrementFlowyUsage } from "@/lib/plan";

// After auth, before OpenAI call:
const plan = await getUserPlan();
const flowyCheck = await checkFlowyLimit(user.id, flowerId, plan);
if (!flowyCheck.allowed) {
  return NextResponse.json(
    { error: "FLOWY_LIMIT_REACHED", used: flowyCheck.used, limit: flowyCheck.limit },
    { status: 403 }
  );
}

// After successful AI response:
await incrementFlowyUsage(user.id, flowerId);
```

---

## Task 8: Upload Page — Remove Text Tab + Gate Pro Features

**Files:** Modify `src/app/(protected)/upload/page.tsx`

- [ ] **Step 1: Import usePlan hook**

```typescript
import { usePlan } from "@/hooks/use-plan";
import { UpgradeModal } from "@/components/upgrade-modal";
```

- [ ] **Step 2: Remove "text" from SOURCE_TABS**

Change:
```typescript
const SOURCE_TABS = [
  { id: "pdf", ... },
  { id: "text", ... },   // REMOVE THIS LINE
  { id: "image", ... },
  ...
]
```

Also remove `SourceType` "text" and the entire text content/textarea JSX block.

- [ ] **Step 3: Add plan check + upgrade state**

```typescript
const { plan } = usePlan();
const [showUpgrade, setShowUpgrade] = useState(false);
const [upgradeReason, setUpgradeReason] = useState("");
```

- [ ] **Step 4: Add Pro badges on source tabs + intercept click**

For "image", "voice", "youtube" tabs, add a `🔒 Pro` badge if `plan === "free"`. On tab click when free, show upgrade modal instead of switching to the tab.

Pattern for gated tab:
```tsx
onClick={() => {
  if (["image", "voice", "youtube"].includes(tab.id) && plan === "free") {
    setUpgradeReason(`${tab.label} uploads are a Pro feature.`);
    setShowUpgrade(true);
  } else {
    setSourceType(tab.id as SourceType);
  }
}}
```

- [ ] **Step 5: Show seed limit error on 403 from process API**

In the submit handler, when API returns `SEED_LIMIT_REACHED`:
```typescript
if (data.error === "SEED_LIMIT_REACHED") {
  setUpgradeReason("You've planted 3 seeds this week — the Free plan limit.");
  setShowUpgrade(true);
  return;
}
```

- [ ] **Step 6: Add UpgradeModal to JSX**

```tsx
<UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason={upgradeReason} />
```

---

## Task 9: ChatTutor — Enforce Flowy Limit + Upgrade Prompt

**Files:** Modify `src/components/chat-tutor.tsx`

- [ ] **Step 1: Import usePlan + UpgradeModal**

```typescript
import { usePlan } from "@/hooks/use-plan";
import { UpgradeModal } from "@/components/upgrade-modal";
```

- [ ] **Step 2: Add limit state and upgrade modal state**

```typescript
const { plan } = usePlan();
const [dailyUsed, setDailyUsed] = useState(0);
const [showUpgrade, setShowUpgrade] = useState(false);
const DAILY_LIMIT = 10;
const isAtLimit = plan === "free" && dailyUsed >= DAILY_LIMIT;
```

- [ ] **Step 3: Handle 403 FLOWY_LIMIT_REACHED from API**

In `handleSend`, when `res.status === 403`:
```typescript
const data = await res.json();
if (data.error === "FLOWY_LIMIT_REACHED") {
  setDailyUsed(data.used);
  setShowUpgrade(true);
  // Remove the optimistically added user message from state
  setMessages((prev) => prev.slice(0, -1));
  return;
}
```

- [ ] **Step 4: Disable input + show limit banner when at limit**

```tsx
{plan === "free" && dailyUsed >= DAILY_LIMIT && (
  <div className="text-xs text-center text-amber-600 bg-amber-50 rounded-xl py-2 px-3 mb-2">
    10 messages used today.{" "}
    <button onClick={() => setShowUpgrade(true)} className="font-bold underline">
      Upgrade to Pro
    </button>{" "}
    for unlimited Flowy.
  </div>
)}
```

- [ ] **Step 5: Track usage on successful send**

After getting a successful response, increment `dailyUsed`:
```typescript
setDailyUsed((n) => n + 1);
```

- [ ] **Step 6: Add UpgradeModal to JSX**

```tsx
<UpgradeModal
  open={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  reason="You've used all 10 free Flowy messages for today."
/>
```

---

## Task 10: Landing Page Pricing Section

**Files:**
- Create: `src/components/pricing-section.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create the PricingSection component**

Design: Two cards side by side. Free card is clean/neutral. Pro card has a bold green gradient, "Most Popular" badge, and a glowing shadow. Both have feature lists with checkmarks/locks for gated items.

```tsx
// src/components/pricing-section.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { PiCheckBold, PiLockBold, PiSparkle, PiFlowerBold, PiInfinityBold } from "react-icons/pi";

const FREE_FEATURES = [
  { text: "3 seeds per week", included: true },
  { text: "PDF uploads", included: true },
  { text: "All study units & quizzes", included: true },
  { text: "Audio recaps (TTS)", included: true },
  { text: "Concept maps (Mermaid)", included: true },
  { text: "Weak areas analysis", included: true },
  { text: "Practice quizzes", included: true },
  { text: "AI Tutor Flowy (10 msg/day)", included: true },
  { text: "Voice input uploads", included: false },
  { text: "Image uploads (AI analysis)", included: false },
  { text: "YouTube link uploads", included: false },
  { text: "Unlimited Flowy messages", included: false },
  { text: "Unlimited seeds", included: false },
];

const PRO_FEATURES = [
  { text: "Unlimited seeds", included: true, highlight: true },
  { text: "PDF uploads", included: true },
  { text: "All study units & quizzes", included: true },
  { text: "Audio recaps (TTS)", included: true },
  { text: "Concept maps (Mermaid)", included: true },
  { text: "Weak areas analysis", included: true },
  { text: "Practice quizzes", included: true },
  { text: "Unlimited Flowy messages", included: true, highlight: true },
  { text: "Voice input uploads", included: true, highlight: true },
  { text: "Image uploads (AI analysis)", included: true, highlight: true },
  { text: "YouTube link uploads", included: true, highlight: true },
  { text: "Export study notes as PDF", included: true },
];

export function PricingSection() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleProCheckout() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-32">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-[#39AB54]/10 text-[#39AB54] rounded-full px-4 py-2 text-sm font-bold mb-6">
          <PiSparkle /> Simple pricing
        </div>
        <h2 className="font-heading text-4xl lg:text-6xl font-black text-[#1c1c18] mb-5 tracking-tight">
          Start free.<br />
          <span className="text-transparent bg-clip-text bg-linear-to-br from-[#39AB54] to-[#2A8040]">
            Grow unlimited.
          </span>
        </h2>
        <p className="text-on-surface-variant text-lg font-medium max-w-lg mx-auto">
          Everything you need to master your studies, with a plan that grows with you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Free Card */}
        <div className="bg-white border-2 border-[#e5e2db] rounded-[2rem] p-8 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <PiFlowerBold className="text-2xl text-[#39AB54]" />
              <span className="font-heading font-black text-xl text-[#1c1c18]">Free</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-5xl font-black text-[#1c1c18]">$0</span>
              <span className="text-on-surface-variant font-medium">/forever</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2 font-medium">
              Perfect for getting started with 3 flowers a week.
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className={`flex items-center gap-3 text-sm font-medium ${f.included ? "text-[#1c1c18]" : "text-gray-300"}`}>
                {f.included
                  ? <PiCheckBold className="text-[#39AB54] shrink-0" />
                  : <PiLockBold className="text-gray-300 shrink-0" />
                }
                {f.text}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="w-full py-4 rounded-2xl border-2 border-[#e5e2db] text-center font-bold text-[#1c1c18] hover:border-[#39AB54] hover:text-[#39AB54] transition-all duration-300 block"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Card */}
        <div className="relative bg-linear-to-br from-[#39AB54] to-[#1d7535] rounded-[2rem] p-8 flex flex-col shadow-2xl shadow-[#39AB54]/30 overflow-hidden">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/20 pointer-events-none" />
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-24 -translate-x-24 pointer-events-none" />

          <div className="relative mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PiInfinityBold className="text-2xl text-white" />
                <span className="font-heading font-black text-xl text-white">Pro</span>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                Most Popular
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-5xl font-black text-white">$5.99</span>
              <span className="text-white/70 font-medium">/month</span>
            </div>
            <p className="text-sm text-white/80 mt-2 font-medium">
              Unlimited growth. No limits, no compromises.
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8 relative">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className={`flex items-center gap-3 text-sm font-medium ${f.highlight ? "text-white font-bold" : "text-white/80"}`}>
                <PiCheckBold className={`shrink-0 ${f.highlight ? "text-white" : "text-white/70"}`} />
                {f.text}
              </li>
            ))}
          </ul>

          <button
            onClick={handleProCheckout}
            disabled={isLoading}
            className="relative w-full py-4 rounded-2xl bg-white text-[#39AB54] font-bold text-base hover:bg-[#f7f2ea] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-70"
          >
            {isLoading ? "Redirecting to checkout..." : "Start Pro — $5.99/month"}
          </button>
          <p className="text-center text-white/50 text-xs mt-3">Cancel anytime. No commitment.</p>
        </div>
      </div>

      {/* Compare note */}
      <p className="text-center text-on-surface-variant text-sm font-medium mt-8">
        Already a Pro member?{" "}
        <Link href="/garden" className="text-[#39AB54] font-bold hover:underline">
          Go to your garden →
        </Link>
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Add PricingSection + Pricing nav link to landing page**

In `src/app/page.tsx`:

1. Import `PricingSection`:
   ```typescript
   import { PricingSection } from "@/components/pricing-section";
   ```

2. Add "Pricing" nav link in the header after "Features":
   ```tsx
   <a href="#pricing" className="text-on-surface-variant hover:text-[#39AB54] transition-colors duration-300">Pricing</a>
   ```

3. Add `<PricingSection />` after the features section and before the footer CTA.

---

## Task 11: Env Variables

- [ ] **Step 1: Verify .env.local has all required Stripe vars**

Required additions:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

- [ ] **Step 2: Register Stripe webhook endpoint in Stripe dashboard**

Webhook URL: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
Events to listen for:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## Task 12: Navigation — Manage Subscription Link

**Files:** Modify `src/components/nav-bar.tsx`

- [ ] **Step 1: Add "Manage Plan" or "Upgrade" in the nav for logged-in users**

```tsx
// If pro: show "Manage Plan" → calls /api/stripe/portal
// If free: show "Upgrade" → calls /api/stripe/checkout
```

This can be a simple dropdown item or a small badge button.

---

## Execution Notes

### Stripe MCP Commands
- `stripe.products.create({ name, description })` → get product ID
- `stripe.prices.create({ product, unit_amount: 599, currency: "usd", recurring: { interval: "month" } })` → get price ID

### Testing
1. Use Stripe test card `4242 4242 4242 4242` for Pro checkout
2. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook` for local webhook testing
3. Verify: after checkout, `subscriptions` table shows `plan=pro` for user
4. Verify: 4th seed creation attempt on Free shows upgrade modal
5. Verify: 11th Flowy message on Free shows upgrade modal

### Order of Implementation
1. Task 1 (Stripe) + Task 2 (Supabase) — infrastructure first
2. Task 3 (lib files) + Task 4 (hook) — utilities
3. Task 5 (API routes) — backend
4. Task 6 (upgrade modal) — shared UI
5. Task 7 (API enforcement) — server gating
6. Task 8 (upload page) + Task 9 (chat tutor) — client gating
7. Task 10 (landing page pricing) — marketing
8. Task 11 + 12 — env + nav cleanup
