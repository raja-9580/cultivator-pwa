-- Seed Data for Harvest Logic Testing
-- Uses CORRECT complex ID format:
-- Batch: FPR-YYYYMMDD-Bxx
-- Baglet: BatchID-Strain-Vendor-Substrate-00x

WITH test_config AS (
  SELECT 
    s.strain_code, 
    s.strain_vendor_id, 
    sub.substrate_id
  FROM strain s
  CROSS JOIN substrate sub
  LIMIT 1
)
-- 1. BATCH 91 (30 Days Ago)
, batch_91 AS (
  INSERT INTO batch (batch_id, farm_id, prepared_date, batch_sequence, substrate_id, strain_code, baglet_count, baglet_weight_g, logged_by)
  SELECT 
    'FPR-20251115-B91', 
    'FPR', 
    CURRENT_DATE - 30, 
    91, 
    tc.substrate_id, 
    tc.strain_code, 
    10, 
    2000, 
    'tester'
  FROM test_config tc
  WHERE EXISTS (SELECT 1 FROM substrate)
  ON CONFLICT (batch_id) DO NOTHING
  RETURNING batch_id, strain_code, substrate_id
)
INSERT INTO baglet (baglet_id, batch_id, baglet_sequence, current_status, harvest_count, status_updated_at, logged_by)
SELECT 
  -- Construct Complex ID: BatchID-Strain-Vendor-Substrate-Seq
  'FPR-20251115-B91' || '-' || tc.strain_code || '-' || tc.strain_vendor_id || '-' || tc.substrate_id || '-' || to_char(seq, 'FM000'),
  'FPR-20251115-B91',
  seq,
  CASE seq
    WHEN 1 THEN 'PINNED'
    WHEN 2 THEN 'PINNED'
    WHEN 3 THEN 'PINNED'
    WHEN 4 THEN 'PINNED'
    WHEN 5 THEN 'INCUBATED'
    WHEN 6 THEN 'PINNED'
    WHEN 7 THEN 'INCUBATED'
    WHEN 8 THEN 'PINNED'
    WHEN 9 THEN 'PINNED'
    ELSE 'PREPARED'
  END,
  0, -- Harvest Count 0
  CASE seq
    WHEN 1 THEN now_ist() - INTERVAL '3 days' -- Ready
    WHEN 2 THEN now_ist() - INTERVAL '1 day' -- Not Ready
    WHEN 3 THEN now_ist() - INTERVAL '50 hours' -- Ready
    WHEN 4 THEN now_ist() - INTERVAL '12 hours' -- Not Ready
    WHEN 5 THEN now_ist() - INTERVAL '10 days'
    WHEN 6 THEN now_ist() - INTERVAL '4 days' -- Ready
    WHEN 7 THEN now_ist() - INTERVAL '5 days'
    WHEN 8 THEN now_ist() - INTERVAL '47 hours'
    WHEN 9 THEN now_ist() - INTERVAL '49 hours' -- Ready
    ELSE now_ist() - INTERVAL '20 days'
  END,
  'tester'
FROM test_config tc
CROSS JOIN generate_series(1, 10) as seq
ON CONFLICT (baglet_id) DO UPDATE SET current_status = EXCLUDED.current_status, harvest_count = EXCLUDED.harvest_count, status_updated_at = EXCLUDED.status_updated_at;


-- 2. BATCH 92 (45 Days Ago)
WITH test_config AS (
  SELECT s.strain_code, s.strain_vendor_id, sub.substrate_id FROM strain s CROSS JOIN substrate sub LIMIT 1
)
, batch_92 AS (
  INSERT INTO batch (batch_id, farm_id, prepared_date, batch_sequence, substrate_id, strain_code, baglet_count, baglet_weight_g, logged_by)
  SELECT 'FPR-20251101-B92', 'FPR', CURRENT_DATE - 45, 92, tc.substrate_id, tc.strain_code, 10, 2000, 'tester'
  FROM test_config tc WHERE EXISTS (SELECT 1 FROM substrate)
  ON CONFLICT (batch_id) DO NOTHING
)
INSERT INTO baglet (baglet_id, batch_id, baglet_sequence, current_status, harvest_count, status_updated_at, logged_by)
SELECT 
  'FPR-20251101-B92' || '-' || tc.strain_code || '-' || tc.strain_vendor_id || '-' || tc.substrate_id || '-' || to_char(seq, 'FM000'),
  'FPR-20251101-B92', seq,
  CASE seq 
    WHEN 4 THEN 'PINNED' WHEN 8 THEN 'PINNED' ELSE 'HARVESTED' END,
  1, -- Harvest Count 1
  CASE seq
    WHEN 1 THEN now_ist() - INTERVAL '8 days' -- Ready
    WHEN 2 THEN now_ist() - INTERVAL '3 days'
    WHEN 3 THEN now_ist() - INTERVAL '10 days' -- Ready
    WHEN 4 THEN now_ist() - INTERVAL '3 days' -- Ready
    WHEN 5 THEN now_ist() - INTERVAL '6 days'
    WHEN 6 THEN now_ist() - INTERVAL '7 days 1 hour' -- Ready
    WHEN 7 THEN now_ist() - INTERVAL '6 days 23 hours'
    WHEN 8 THEN now_ist() - INTERVAL '5 days' -- Ready
    WHEN 9 THEN now_ist() - INTERVAL '15 days' -- Ready
    ELSE now_ist() - INTERVAL '1 day'
  END,
  'tester'
FROM test_config tc CROSS JOIN generate_series(1, 10) as seq
ON CONFLICT (baglet_id) DO UPDATE SET current_status = EXCLUDED.current_status, harvest_count = EXCLUDED.harvest_count, status_updated_at = EXCLUDED.status_updated_at;


-- 3. BATCH 93 (60 Days Ago)
WITH test_config AS (
  SELECT s.strain_code, s.strain_vendor_id, sub.substrate_id FROM strain s CROSS JOIN substrate sub LIMIT 1
)
, batch_93 AS (
  INSERT INTO batch (batch_id, farm_id, prepared_date, batch_sequence, substrate_id, strain_code, baglet_count, baglet_weight_g, logged_by)
  SELECT 'FPR-20251015-B93', 'FPR', CURRENT_DATE - 60, 93, tc.substrate_id, tc.strain_code, 10, 2000, 'tester'
  FROM test_config tc WHERE EXISTS (SELECT 1 FROM substrate)
  ON CONFLICT (batch_id) DO NOTHING
)
INSERT INTO baglet (baglet_id, batch_id, baglet_sequence, current_status, harvest_count, status_updated_at, logged_by)
SELECT 
  'FPR-20251015-B93' || '-' || tc.strain_code || '-' || tc.strain_vendor_id || '-' || tc.substrate_id || '-' || to_char(seq, 'FM000'),
  'FPR-20251015-B93', seq,
  CASE seq 
    WHEN 2 THEN 'CONTAMINATED' WHEN 5 THEN 'DISPOSED' WHEN 6 THEN 'REHARVESTED_2' WHEN 7 THEN 'REHARVESTED_2' WHEN 8 THEN 'CONTAMINATED' WHEN 10 THEN 'RECYCLED' ELSE 'REHARVESTED_1' END,
  CASE WHEN seq IN (6,7,8,10) THEN 3 ELSE 2 END, -- Harvest Count
  CASE seq
    WHEN 1 THEN now_ist() - INTERVAL '10 days' -- Ready
    WHEN 2 THEN now_ist() - INTERVAL '5 days'
    WHEN 3 THEN now_ist() - INTERVAL '15 days' -- Ready
    WHEN 4 THEN now_ist() - INTERVAL '1 day'
    WHEN 5 THEN now_ist() - INTERVAL '20 days'
    WHEN 6 THEN now_ist() - INTERVAL '8 days' -- Ready
    WHEN 7 THEN now_ist() - INTERVAL '6 days'
    WHEN 8 THEN now_ist() - INTERVAL '1 day'
    WHEN 9 THEN now_ist() - INTERVAL '30 days' -- Ready
    ELSE now_ist() - INTERVAL '1 day'
  END,
  'tester'
FROM test_config tc CROSS JOIN generate_series(1, 10) as seq
ON CONFLICT (baglet_id) DO UPDATE SET current_status = EXCLUDED.current_status, harvest_count = EXCLUDED.harvest_count, status_updated_at = EXCLUDED.status_updated_at;
