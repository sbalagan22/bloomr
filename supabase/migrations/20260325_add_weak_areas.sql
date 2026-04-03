-- Add weak_areas column to quiz_attempts
-- Each entry: { concept: string, unitId: string, unitTitle: string }
ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS weak_areas JSONB DEFAULT NULL;
