-- Migration script to convert existing TIMESTAMP columns to TIMESTAMPTZ
-- This script handles dependencies by temporarily removing defaults and indexes

-- 1. Remove dependencies temporarily
ALTER TABLE batch ALTER COLUMN logged_timestamp DROP DEFAULT;
ALTER TABLE baglet ALTER COLUMN logged_timestamp DROP DEFAULT;
ALTER TABLE baglet_status_log ALTER COLUMN status_timestamp DROP DEFAULT;
ALTER TABLE baglet_status_log ALTER COLUMN logged_timestamp DROP DEFAULT;
ALTER TABLE harvest ALTER COLUMN logged_timestamp DROP DEFAULT;
ALTER TABLE baglet_contamination ALTER COLUMN logged_timestamp DROP DEFAULT;
ALTER TABLE substrate_expansion_history ALTER COLUMN changed_at DROP DEFAULT;

-- Drop functional index that depends on timestamp column
DROP INDEX IF EXISTS idx_harvest_baglet_day_unique;

-- 2. Update column data types (Explicitly treat existing values as Asia/Kolkata)
ALTER TABLE batch 
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp SET DEFAULT now();

ALTER TABLE baglet 
  ALTER COLUMN status_updated_at TYPE TIMESTAMPTZ USING status_updated_at AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp SET DEFAULT now();

ALTER TABLE baglet_status_log 
  ALTER COLUMN status_timestamp TYPE TIMESTAMPTZ USING status_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN status_timestamp SET DEFAULT now(),
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp SET DEFAULT now();

ALTER TABLE harvest 
  ALTER COLUMN harvested_timestamp TYPE TIMESTAMPTZ USING harvested_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp SET DEFAULT now();

ALTER TABLE baglet_contamination 
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp SET DEFAULT now();

ALTER TABLE substrate_expansion_history
  ALTER COLUMN changed_at SET DEFAULT now();

-- 3. Re-create the functional index
-- We must explicitly cast using a specific timezone to ensure the "Day" is consistent
CREATE UNIQUE INDEX idx_harvest_baglet_day_unique ON harvest (baglet_id, ((harvested_timestamp AT TIME ZONE 'Asia/Kolkata')::DATE));

-- 4. FINAL CLEANUP: Delete the redundant function
DROP FUNCTION IF EXISTS now_ist();
