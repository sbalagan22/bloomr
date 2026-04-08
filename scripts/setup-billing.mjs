#!/usr/bin/env node
/**
 * Bloomr Billing Setup Script
 * Runs once to:
 *   1. Apply Supabase schema (subscriptions + flowy_usage tables)
 *   2. Create Stripe products + prices and write the price ID back to .env.local
 *
 * Usage:
 *   node scripts/setup-billing.mjs
 *
 * Prerequisites — add to .env.local:
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   STRIPE_SECRET_KEY=sk_live_... or sk_test_...
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env.local");

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  if (!existsSync(ENV_PATH)) throw new Error(".env.local not found");
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const env = loadEnv();

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// ── 1. Apply Supabase migration ───────────────────────────────────────────────
const SQL = `
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(stripe_customer_id),
  UNIQUE(stripe_subscription_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Users can view own subscription') THEN
    CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Service role can manage subscriptions') THEN
    CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flowy_usage' AND policyname='Users can read/write own flowy usage') THEN
    CREATE POLICY "Users can read/write own flowy usage" ON flowy_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION increment_flowy_usage(
  p_user_id UUID,
  p_flower_id UUID,
  p_date DATE
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS \$\$
BEGIN
  INSERT INTO flowy_usage (user_id, flower_id, usage_date, message_count)
  VALUES (p_user_id, p_flower_id, p_date, 1)
  ON CONFLICT (user_id, flower_id, usage_date)
  DO UPDATE SET message_count = flowy_usage.message_count + 1;
END;
\$\$;
`;

console.log("📦  Applying Supabase schema...");
const pgRestUrl = `${SUPABASE_URL}/rest/v1/rpc/`;

// Use Supabase's SQL endpoint via the management API
const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

// Actually, use the pg REST approach via service role + direct SQL via Supabase's
// /rest/v1/ doesn't support raw SQL. We use the Supabase service API.
// The correct endpoint is POST /sql on newer Supabase projects.
const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
  method: "HEAD",
  headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
});

// Use Supabase's pg-meta or direct postgres endpoint
const applyRes = await fetch(`${SUPABASE_URL}/pg/query`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: SQL }),
});

if (applyRes.ok) {
  console.log("✅  Supabase schema applied.");
} else {
  // Try the alternative endpoint
  const alt = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (!alt.ok) {
    const body = await applyRes.text();
    console.warn(`⚠️  Could not auto-apply schema (${applyRes.status}: ${body}).`);
    console.warn("   → Run supabase/migrations/20260408_subscriptions.sql manually in your Supabase SQL editor.");
  } else {
    console.log("✅  Supabase schema applied (alt endpoint).");
  }
}

// ── 2. Create Stripe products + price ────────────────────────────────────────
if (!STRIPE_SECRET_KEY) {
  console.warn("\n⚠️  STRIPE_SECRET_KEY not set — skipping Stripe setup.");
  console.warn("   Add it to .env.local then re-run: node scripts/setup-billing.mjs");
  process.exit(0);
}

console.log("\n💳  Setting up Stripe products...");

async function stripePost(path, body) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${path}: ${data.error?.message}`);
  return data;
}

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe GET ${path}: ${data.error?.message}`);
  return data;
}

// Check if Bloomr Pro product already exists
const products = await stripeGet("products?limit=100&active=true");
let proProduct = products.data?.find(p => p.name === "Bloomr Pro");

if (!proProduct) {
  proProduct = await stripePost("products", {
    name: "Bloomr Pro",
    description: "Unlimited seeds, unlimited Flowy messages, voice/image/YouTube uploads",
  });
  console.log(`✅  Created product: ${proProduct.id}`);
} else {
  console.log(`✓   Product already exists: ${proProduct.id}`);
}

// Check if $5.99/month price already exists for this product
const prices = await stripeGet(`prices?product=${proProduct.id}&active=true&limit=10`);
let proPrice = prices.data?.find(p => p.unit_amount === 599 && p.recurring?.interval === "month");

if (!proPrice) {
  proPrice = await stripePost("prices", {
    product: proProduct.id,
    unit_amount: "599",
    currency: "usd",
    "recurring[interval]": "month",
    nickname: "Bloomr Pro Monthly",
  });
  console.log(`✅  Created price: ${proPrice.id} ($5.99/month)`);
} else {
  console.log(`✓   Price already exists: ${proPrice.id} ($5.99/month)`);
}

// Write price ID back to .env.local
let envContent = readFileSync(ENV_PATH, "utf8");

const newVars = {
  STRIPE_SECRET_KEY,
  STRIPE_PRO_PRICE_ID: proPrice.id,
};

for (const [key, value] of Object.entries(newVars)) {
  if (envContent.includes(`${key}=`)) {
    envContent = envContent.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
}

// Add publishable key placeholder if missing
if (!envContent.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")) {
  const isTest = STRIPE_SECRET_KEY.startsWith("sk_test_");
  console.log(`\n⚠️  Add your Stripe publishable key to .env.local:`);
  console.log(`   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_${isTest ? "test" : "live"}_...`);
  console.log(`   STRIPE_WEBHOOK_SECRET=whsec_...`);
}

writeFileSync(ENV_PATH, envContent);
console.log(`\n✅  Written to .env.local: STRIPE_PRO_PRICE_ID=${proPrice.id}`);
console.log("\n🎉  Billing setup complete!");
console.log("\nNext steps:");
console.log("  1. Add STRIPE_WEBHOOK_SECRET to .env.local (from Stripe dashboard > Webhooks)");
console.log("  2. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local");
console.log("  3. Register webhook URL: https://your-app.vercel.app/api/stripe/webhook");
console.log("     Events: checkout.session.completed, customer.subscription.updated,");
console.log("             customer.subscription.deleted, invoice.payment_failed");
