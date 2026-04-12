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

-- Step 2a: Add CHECK constraint on pot_variant (>= 1 allows future rarity tiers without migration)
ALTER TABLE flowers
ADD CONSTRAINT flowers_pot_variant_check
CHECK (pot_variant >= 1);

-- Step 2b: Add CHECK constraint on pity_count to prevent negative values
ALTER TABLE learner_profiles
ADD CONSTRAINT learner_profiles_pity_count_check
CHECK (pity_count >= 0);
