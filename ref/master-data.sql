-- mushroom
INSERT INTO mushroom (mushroom_id, mushroom_name) VALUES
('M07', 'Golden Oyster'),
('M02', 'Pink Oyster'),
('M03',  'Lion''s Mane');

-- strain vendor
INSERT INTO strain_vendor (strain_vendor_id, vendor_name) VALUES
('NVD', 'Nuvedo Labs Private Limited'),
('UFC', 'Urban Fungi Center');

-- strain (GN1 from your data, others added for completeness)
INSERT INTO strain (strain_code, mushroom_id, strain_vendor_id) VALUES
('GN1', 'M07', 'NVD'),
('GN2', 'M07', 'NVD'),
('PO1', 'M02', 'UFC');

-- substrate
INSERT INTO substrate (substrate_id, substrate_name) VALUES
('SUB001', '100% Mush Pellets'),
('SUB002', '90% Mush Pellets + 10% Rice Bran');

-- medium
INSERT INTO medium (medium_id, medium_name) VALUES
('MP01', 'Mush Pellets'),
('RB01', 'Rice Bran');

-- supplement
INSERT INTO supplement (supplement_id, supplement_name, measure_type) VALUES
('CA01', 'Calcium Powder', 'g'),
('GY01', 'Gypsum Powder', 'g'),
('CW01', 'Coconut Water', 'ml');

-- substrate mediums
INSERT INTO substrate_medium (substrate_id, medium_id, qty_g) VALUES
('SUB001', 'MP01', 1000),
('SUB002', 'MP01', 900),
('SUB002', 'RB01', 100);

-- substrate supplements
INSERT INTO substrate_supplement (substrate_id, supplement_id, qty) VALUES
('SUB002', 'CA01', 20),
('SUB002', 'GY01', 10),
('SUB002', 'CW01', 300);

-- farm
INSERT INTO farm (farm_id, farm_name) VALUES
('FPR', 'FPR Farm'),
('FPL', 'FPL Farm');
