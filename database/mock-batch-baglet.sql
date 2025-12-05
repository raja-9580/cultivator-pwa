-- ONE batch (from your real Excel ID)
INSERT INTO batch (
  batch_id, farm_id, prepared_date, batch_sequence,
  substrate_id, strain_code, baglet_count
)
VALUES (
  'FPR-24092025-B01', 'FPR', '2025-09-24', 1,
  'SUB001', 'GN1', 5
);

-- 5 baglets (your real ID pattern)
INSERT INTO baglet (baglet_id, batch_id, baglet_sequence, current_status)
VALUES
('FPR-24092025-B01-GN1-NVD-M07-001', 'FPR-24092025-B01', 1, 'Colonizing'),
('FPR-24092025-B01-GN1-NVD-M07-002', 'FPR-24092025-B01', 2, 'Colonizing'),
('FPR-24092025-B01-GN1-NVD-M07-003', 'FPR-24092025-B01', 3, 'Colonizing'),
('FPR-24092025-B01-GN1-NVD-M07-004', 'FPR-24092025-B01', 4, 'Colonizing'),
('FPR-24092025-B01-GN1-NVD-M07-005', 'FPR-24092025-B01', 5, 'Colonizing');
