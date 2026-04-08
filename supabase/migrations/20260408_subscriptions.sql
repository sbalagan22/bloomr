-- Bloomr Monetization: subscriptions + flowy usage tracking

-- Subscriptions table: tracks Stripe plan per user
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

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can upsert (webhook handler uses service role)
CREATE POLICY "Service role can upsert subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Flowy daily usage tracking (Free plan: 10 messages/day/flower)
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

-- RPC: atomically increment flowy usage (upsert pattern)
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
