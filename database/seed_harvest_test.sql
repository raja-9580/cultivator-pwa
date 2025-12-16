-- Seed Data for Harvest Logic Testing (Realistic & Varied)
-- 50 batches, GUARANTEED varied strains (Round Robin), realistic lifecycle status

WITH batch_dates AS (
  SELECT 
    d::date as p_date,
    row_number() OVER (ORDER BY d) as seq_num
  FROM generate_series(CURRENT_DATE - 210, CURRENT_DATE, '3.5 days'::interval) d
),
strain_list AS (
  SELECT 
    strain_code, 
    strain_vendor_id,
    ROW_NUMBER() OVER (ORDER BY strain_code) as rn,
    COUNT(*) OVER () as total_strains
  FROM strain
),
substrate_list AS (
  SELECT 
    substrate_id,
    ROW_NUMBER() OVER (ORDER BY substrate_id) as rn,
    COUNT(*) OVER () as total_subs
  FROM substrate
),
new_batches_data AS (
  SELECT 
    'FPR-' || to_char(bd.p_date, 'YYYYMMDD') || '-B' || to_char(bd.seq_num, 'FM000') as batch_id,
    bd.p_date,
    bd.seq_num,
    s.strain_code,
    s.strain_vendor_id,
    sub.substrate_id
  FROM batch_dates bd
  -- Round Robin for Strain
  JOIN strain_list s ON s.rn = ((bd.seq_num - 1) % s.total_strains) + 1
  -- Round Robin for Substrate (offset by 1 to mix combinations)
  JOIN substrate_list sub ON sub.rn = ((bd.seq_num) % sub.total_subs) + 1
),
batch_insert AS (
  INSERT INTO batch (batch_id, farm_id, prepared_date, batch_sequence, substrate_id, strain_code, baglet_count, baglet_weight_g, logged_by)
  SELECT 
    nbd.batch_id, 'FPR', nbd.p_date, nbd.seq_num, nbd.substrate_id, nbd.strain_code, 10, 2000, 'tester'
  FROM new_batches_data nbd
  ON CONFLICT (batch_id) DO NOTHING
  RETURNING batch_id, prepared_date, strain_code, substrate_id
)
INSERT INTO baglet (baglet_id, batch_id, baglet_sequence, current_status, harvest_count, status_updated_at, logged_by)
SELECT 
  -- Reconstruct ID: BatchID-Strain-Vendor-Substrate-Seq
  nbd.batch_id || '-' || nbd.strain_code || '-' || nbd.strain_vendor_id || '-' || nbd.substrate_id || '-' || to_char(seq, 'FM000'),
  nbd.batch_id,
  seq,
  -- Status Logic
  CASE 
    WHEN (CURRENT_DATE - nbd.p_date) < 18 THEN 'INCUBATED'
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 18 AND 22 THEN 'PINNED'
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 23 AND 30 THEN 'HARVESTED'
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 31 AND 40 THEN 'REHARVESTED_1'
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 41 AND 50 THEN 'REHARVESTED_2'
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 51 AND 60 THEN 'REHARVESTED_3'
    -- Old batches are DISPOSED (Inactive)
    ELSE 'DISPOSED' 
  END,
  -- Harvest Count
  CASE 
    WHEN (CURRENT_DATE - nbd.p_date) < 23 THEN 0
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 23 AND 30 THEN 1
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 31 AND 40 THEN 2
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 41 AND 50 THEN 3
    WHEN (CURRENT_DATE - nbd.p_date) BETWEEN 51 AND 60 THEN 4
    ELSE 5
  END,
  now_ist() - ((seq * 2) || ' hours')::interval,
  'tester'
FROM new_batches_data nbd
CROSS JOIN generate_series(1, 10) as seq
ON CONFLICT (baglet_id) DO UPDATE SET current_status = EXCLUDED.current_status, harvest_count = EXCLUDED.harvest_count;
