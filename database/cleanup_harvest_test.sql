-- Cleanup Script for Harvest Test Data
-- Matches correct Batch ID format (FPR-YYYYMMDD-Bxx)

-- 1. Remove Harvest records for test batches
DELETE FROM harvest 
WHERE batch_id IN ('FPR-20251115-B91', 'FPR-20251101-B92', 'FPR-20251015-B93');

-- 2. Remove Baglet Status Logs for test batches
DELETE FROM baglet_status_log 
WHERE batch_id IN ('FPR-20251115-B91', 'FPR-20251101-B92', 'FPR-20251015-B93');

-- 3. Remove Baglets for test batches
DELETE FROM baglet 
WHERE batch_id IN ('FPR-20251115-B91', 'FPR-20251101-B92', 'FPR-20251015-B93');

-- 4. Remove Test Batches
DELETE FROM batch 
WHERE batch_id IN ('FPR-20251115-B91', 'FPR-20251101-B92', 'FPR-20251015-B93');
