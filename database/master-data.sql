--farm insert
INSERT INTO farm (farm_id, farm_name) VALUES
  ('PR', 'Akaththi Farms - Research & Cultivation Hub, Pozhichalur');

 -- MUSHROOM
INSERT INTO mushroom (mushroom_id, mushroom_name) VALUES
  ('PK', 'Pink Oyster'),
  ('GN', 'Golden Oyster'),
  ('EM', 'Elm Oyster'),
  ('GY', 'Grey Oyster'),
  ('LM', 'Lion''s Mane');
  
-- STRAIN_VENDOR 
INSERT INTO strain_vendor (strain_vendor_id, vendor_name) VALUES
  ('AD', 'Adam Mushrooms Private Limited'),
  ('IH', 'Indian Institute of Horticulture Research Bangalore'),
  ('NV', 'Nuvedo Labs Private Limited'),
  ('PG', 'Progeny Mushroom Spawn Lab'),
  ('AK', 'Akaththi Farms Private Limited');
  
--STRAIN
INSERT INTO strain (strain_code, mushroom_id, strain_vendor_id) VALUES
  ('PK01', 'PK', 'AD'),
  ('PK02', 'PK', 'IH'),
  ('PK03', 'PK', 'PG'),
  ('GN01', 'GN', 'NV'),
  ('EM01', 'EM', 'IH'),
  ('EM02', 'EM', 'AK'),
  ('GY01', 'GY', 'IH'),
  ('LM01', 'LM', 'IH');

------------------------------------------------------------
-- MEDIUM (base ingredients)
------------------------------------------------------------
--medium_id will be changed to number from string

INSERT INTO medium (medium_id, medium_name) VALUES
  (1, 'Mush Pellets'),
  (2, 'Sawdust'),
  (3, 'Rice Bran'),
  (4, 'Rice husk');

------------------------------------------------------------
-- SUPPLEMENT (additives)
------------------------------------------------------------
INSERT INTO supplement (supplement_id, supplement_name, measure_type) VALUES
  (1, 'Coconut Water', 'ml'),
  (2, 'Eggshell Powder', 'g'),
  (3, 'Water', 'ml');


------------------------------------------------------------
-- SUBSTRATE (6 final combinations)
------------------------------------------------------------
INSERT INTO substrate (substrate_id, substrate_name) VALUES
  ('A01', '100% Mush Pellets'),
  ('A02', '100% Mush Pellets + Coconut Water'),
  ('A03', '40% Mush Pellets + 40% Sawdust + 20% Rice Bran'),
  ('A04', '40% Mush Pellets + 40% Sawdust + 20% Rice Bran + Eggshell Powder'),
  ('A05', '40% Mush Pellets + 40% Sawdust + 20% Rice Bran + Coconut Water'),
  ('A06', '40% Mush Pellets + 40% Sawdust + 20% Rice Bran + Coconut Water + Eggshell Powder');
 
------------------------------------------------------------
-- SUBSTRATE_MEDIUM (main medium composition)
-- Total medium weight assumed = 1000 g
------------------------------------------------------------

INSERT INTO substrate_medium (substrate_id, medium_id, qty_g) VALUES

-- A01: 100% Mush Pellets
('A01', 1, 1000),

-- A02: 100% Mush Pellets
('A02', 1, 1000),

-- A03: 40% Mush Pellets + 40% Sawdust + 20% Rice Bran
('A03', 1, 400),
('A03', 2, 400),
('A03', 3, 200),

-- A04: same as A03
('A04', 1, 400),
('A04', 2, 400),
('A04', 3, 200),

-- A05: same as A03
('A05', 1, 400),
('A05', 2, 400),
('A05', 3, 200),

-- A06: same as A03
('A06', 1, 400),
('A06', 2, 400),
('A06', 3, 200);


------------------------------------------------------------
-- SUBSTRATE_SUPPLEMENT (additives)
------------------------------------------------------------
INSERT INTO substrate_supplement (substrate_id, supplement_id, qty) VALUES
-- A01: no supplements
('A01', 3, 1600);

-- A02: Coconut Water
('A02', 1, 300),  -- Coconut Water (ml)
('A02', 3, 1300),


-- A03: no supplements
('A03', 3, 1600);

-- A04: Eggshell Powder
('A04', 2, 10),   -- Eggshell Powder (g)
('A04', 3, 1600);

-- A05: Coconut Water
('A05', 1, 300),  -- Coconut Water (ml)
('A05', 3, 1300),

-- A06: Coconut Water + Eggshell Powder
('A06', 1, 300),  -- Coconut Water (ml)
('A06', 2, 10),   -- Eggshell Powder (g)
('A06', 3, 1300);


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
