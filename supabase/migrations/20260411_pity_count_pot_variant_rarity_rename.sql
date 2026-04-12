-- Migration: add pity_count to learner_profiles, pot_variant to flowers, rename rarity values

-- Step 1a: Add pity_count to learner_profiles
ALTER TABLE learner_profiles
ADD COLUMN IF NOT EXISTS pity_count INT NOT NULL DEFAULT 0;

-- Step 1b: Add pot_variant to flowers
ALTER TABLE flowers
ADD COLUMN IF NOT EXISTS pot_variant INT NOT NULL DEFAULT 1;

-- Step 1c: Rename rarity values (common->basic, uncommon->vintage, epic->antique, legendary->relic)
-- Note: 'rare' rows are intentionally left unchanged
UPDATE flowers
SET pot_rarity = CASE
  WHEN pot_rarity = 'common'    THEN 'basic'
  WHEN pot_rarity = 'uncommon'  THEN 'vintage'
  WHEN pot_rarity = 'epic'      THEN 'antique'
  WHEN pot_rarity = 'legendary' THEN 'relic'
  ELSE pot_rarity
END
WHERE pot_rarity IN ('common','uncommon','epic','legendary');
