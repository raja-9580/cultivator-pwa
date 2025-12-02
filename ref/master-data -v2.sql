-- MUSHROOM
INSERT INTO mushroom (mushroom_id, mushroom_name) VALUES
  ('PK', 'Pink Oyster'),
  ('GN', 'Golden Oyster'),
  ('EM', 'Elm Oyster'),
  ('GY', 'Grey Oyster'),
  ('LM', 'Lion''s Mane');
  
-- STRAIN_VENDOR 
INSERT INTO strain_vendor (strain_vendor_id, vendor_name) VALUES
  ('ADG', 'Adam Mushrooms Private Limited'),
  ('IHB', 'Indian Institute of Horticulture Research Bangalore'),
  ('NVD', 'Nuvedo Labs Private Limited'),
  ('PRG', 'Progeny Mushroom Spawn Lab');
  
--STRAIN
INSERT INTO strain (strain_code, mushroom_id, strain_vendor_id) VALUES
  ('PK1', 'PK', 'ADG'),
  ('PK2', 'PK', 'IHB'),
  ('PK3', 'PK', 'PRG'),
  ('GN1', 'GN', 'NVD'),
  ('EM1', 'EM', 'IHB'),
  ('GY1', 'GY', 'IHB'),
  ('LM1', 'LM', 'IHB');

------------------------------------------------------------
-- MEDIUM (base ingredients)
------------------------------------------------------------
INSERT INTO medium (medium_id, medium_name) VALUES
  ('MP01', 'Mush Pellets'),
  ('RB01', 'Rice Bran');

------------------------------------------------------------
-- SUPPLEMENT (additives)
------------------------------------------------------------
INSERT INTO supplement (supplement_id, supplement_name, measure_type) VALUES
  ('CW01', 'Coconut Water', 'ml'),
  ('CA01', 'Calcium Powder', 'g'),
  ('GY01', 'Gypsum Powder', 'g');

------------------------------------------------------------
-- SUBSTRATE (7 final combinations)
------------------------------------------------------------
INSERT INTO substrate (substrate_id, substrate_name) VALUES
  ('SUB001', '100% Mush Pellets'),
  ('SUB002', '100% Mush Pellets + Coconut Water'),
  ('SUB003', '90% Mush Pellets + 10% Rice Bran'),
  ('SUB004', '90% Mush Pellets + 10% Rice Bran + Coconut Water'),
  ('SUB005', '80% Mush Pellets + 20% Rice Bran'),
  ('SUB006', '80% Mush Pellets + 20% Rice Bran + Calcium + Gypsum'),
  ('SUB007', '90% Mush Pellets + 10% Rice Bran + Coconut Water + Calcium + Gypsum');

------------------------------------------------------------
-- SUBSTRATE_MEDIUM (main medium composition)
------------------------------------------------------------
INSERT INTO substrate_medium (substrate_id, medium_id, qty_g) VALUES
  -- SUB001: 100% Pellets
  ('SUB001', 'MP01', 1000),

  -- SUB002: 100% Pellets
  ('SUB002', 'MP01', 1000),

  -- SUB003: 90% Pellets + 10% Bran
  ('SUB003', 'MP01', 900),
  ('SUB003', 'RB01', 100),

  -- SUB004: 90% Pellets + 10% Bran
  ('SUB004', 'MP01', 900),
  ('SUB004', 'RB01', 100),

  -- SUB005: 80% Pellets + 20% Bran
  ('SUB005', 'MP01', 800),
  ('SUB005', 'RB01', 200),

  -- SUB006: 80% Pellets + 20% Bran
  ('SUB006', 'MP01', 800),
  ('SUB006', 'RB01', 200),

  -- SUB007: 90% Pellets + 10% Bran
  ('SUB007', 'MP01', 900),
  ('SUB007', 'RB01', 100);

------------------------------------------------------------
-- SUBSTRATE_SUPPLEMENT (additives)
------------------------------------------------------------
INSERT INTO substrate_supplement (substrate_id, supplement_id, qty) VALUES
  -- SUB001: no supplements

  -- SUB002: Coconut Water
  ('SUB002', 'CW01', 300),

  -- SUB003: none

  -- SUB004: Coconut Water
  ('SUB004', 'CW01', 300),

  -- SUB005: none

  -- SUB006: Calcium + Gypsum
  ('SUB006', 'CA01', 20),
  ('SUB006', 'GY01', 10),

  -- SUB007: Coconut Water + Calcium + Gypsum
  ('SUB007', 'CW01', 300),
  ('SUB007', 'CA01', 20),
  ('SUB007', 'GY01', 10);
