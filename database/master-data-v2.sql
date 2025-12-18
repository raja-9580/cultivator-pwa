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

-- ==========================================
-- Contamination Catalog (Reference Table)
-- ==========================================
INSERT INTO contamination_catalog (contamination_code, contamination_type, contaminant, symptoms, notes) VALUES
('BAC01', 'Bacterial', 'Bacillus spp.', 'Slimy, sour-smelling substrate; discolored patches', 'Often from poor pasteurization or unclean water'),
('BAC02', 'Bacterial', 'Pseudomonas spp.', 'Wet spots, blue-green discoloration', 'Thrives in anaerobic spots or unclean conditions'),
('BAC03', 'Bacterial', 'Erwinia spp.', 'Strong foul odor, soft rot', 'Occurs in warm, overly wet conditions'),
('BAC04', 'Bacterial', 'Actinomycetes', 'Earthy smell, crusty patches', 'Sometimes mistaken for mold'),
('FUN01', 'Fungal', 'Trichoderma spp.', 'Bright green patches, aggressive overgrowth', 'Most aggressive competitor to mushroom mycelium'),
('FUN02', 'Fungal', 'Penicillium spp.', 'Blue-green powdery mold', 'Common airborne mold'),
('FUN03', 'Fungal', 'Aspergillus spp.', 'Yellow-green powder, aflatoxin risk', 'Allergenic and toxin-producing in some cases'),
('FUN04', 'Fungal', 'Mucor spp.', 'White, cotton-like mold', 'Grows in unsterilized substrate'),
('FUN05', 'Fungal', 'Rhizopus spp.', 'Black fuzzy mold', 'Appears in humid, poorly ventilated bags'),
('FUN06', 'Fungal', 'Cladosporium spp.', 'Olive-gray patches', 'Less aggressive but persistent'),
('FUN07', 'Fungal', 'Neurospora (Monilia)', 'Orange-pink mold', 'From incomplete sterilization'),
('FUN08', 'Fungal', 'Verticillium fungicola', 'Dry bubble disease', 'Affects button mushrooms'),
('FUN09', 'Fungal', 'Mycogone perniciosa', 'Wet bubble, malformed fruit bodies', 'Affects fruiting stage'),
('FUN10', 'Fungal', 'Sepedonium spp.', 'Yellow mold, mimics primordia', 'Hard to identify early'),
('VIR01', 'Viral', 'La France Disease (MVX)', 'Malformed caps, slow pinning', 'Known in button mushrooms'),
('VIR02', 'Viral', 'OMSV (Oyster mushroom spherical virus)', 'Stunted or malformed fruit bodies', 'Rare but serious'),
('VIR03', 'Viral', 'Mycoviruses', 'Low vigor, abnormal growth', 'Often crypticspread via spawn'),
('INS01', 'Insect', 'Fungus gnats', 'Larvae damage mycelium', 'Enter through open bags or unclean areas'),
('INS02', 'Insect', 'Springtails', 'Jumping insects on substrate', 'Indicate decomposing substrate'),
('INS03', 'Insect', 'Mites', 'Webbing, substrate damage', 'Spread through tools or casing'),
('OTH01', 'Others', 'Nematodes', 'Patchy mycelial growth', 'Enter via contaminated casing'),
('OTH02', 'Others', 'Algae', 'Green slime on casing or walls', 'Moisture + light combo'),
('OTH03', 'Others', 'Yeasts', 'Sweet odor, slimy patches', 'Sugar-rich or wet environments'),
('UNK01', 'Unknown', 'Airborne Dust/Spore', 'Triggers mold colonies', 'Keep airflow clean');
