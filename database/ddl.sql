SET search_path TO "cultivator-db";

CREATE OR REPLACE FUNCTION now_ist() RETURNS TIMESTAMP LANGUAGE sql AS $$
  SELECT NOW() AT TIME ZONE 'Asia/Kolkata';
$$;

-- farm
CREATE TABLE farm (
  farm_id TEXT PRIMARY KEY,
  farm_name TEXT
);

-- mushroom
CREATE TABLE mushroom (
  mushroom_id TEXT PRIMARY KEY,
  mushroom_name TEXT NOT NULL
);

-- strain vendor
CREATE TABLE strain_vendor (
  strain_vendor_id TEXT PRIMARY KEY,
  vendor_name TEXT NOT NULL
);

-- strain
CREATE TABLE strain (
  strain_code TEXT PRIMARY KEY,
  mushroom_id TEXT NOT NULL REFERENCES mushroom(mushroom_id),
  strain_vendor_id TEXT NOT NULL REFERENCES strain_vendor(strain_vendor_id),
  -- strain_desc: Detailed description of strain characteristics, genetics, 
-- growing conditions, expected yields, and other relevant cultivation information
  strain_desc TEXT
);

-- medium master
CREATE TABLE medium (
  medium_id INTEGER PRIMARY KEY,
  medium_name TEXT NOT NULL
);

-- supplements master
CREATE TABLE supplement (
  supplement_id INTEGER PRIMARY KEY,
  supplement_name TEXT NOT NULL,
  measure_type TEXT NOT NULL  -- 'g' or 'ml'
);

-- substrate master
-- substrate_desc: Detailed description of the substrate composition and purpose
-- expected_expansion_ratio: Typical expected expansion during preparation (planning assumption)
-- is_test: Identifies whether this is a test/experimental substrate
-- origin_substrate_id: Reference to the original substrate when derived (e.g., test promoted to prod)
CREATE TABLE substrate (
  substrate_id TEXT PRIMARY KEY,
  substrate_name TEXT NOT NULL,
  substrate_desc TEXT,
  is_test BOOLEAN DEFAULT FALSE,
  expected_expansion_ratio NUMERIC DEFAULT 2.5,
  origin_substrate_id TEXT REFERENCES substrate(substrate_id)
);

-- substrate mediums
CREATE TABLE substrate_medium (
  id SERIAL PRIMARY KEY,
  substrate_id TEXT NOT NULL REFERENCES substrate(substrate_id),
  medium_id INTEGER NOT NULL REFERENCES medium(medium_id),
  qty_g NUMERIC NOT NULL
);

-- substrate supplements
CREATE TABLE substrate_supplement (
  id SERIAL PRIMARY KEY,
  substrate_id TEXT NOT NULL REFERENCES substrate(substrate_id),
  supplement_id INTEGER NOT NULL REFERENCES supplement(supplement_id),
  qty NUMERIC NOT NULL
);

-- batch
CREATE TABLE batch (
  batch_id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farm(farm_id),
  substrate_id TEXT NOT NULL REFERENCES substrate(substrate_id),
  strain_code TEXT NOT NULL REFERENCES strain(strain_code),
  batch_sequence INT NOT NULL,
  prepared_date DATE NOT NULL,
  baglet_count INT DEFAULT 0,
  baglet_weight_g INT DEFAULT 2500,
  actual_expansion_ratio NUMERIC,
  logged_by TEXT,
  logged_timestamp TIMESTAMP DEFAULT now_ist(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- baglet
CREATE TABLE baglet (
  baglet_id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batch(batch_id),
  baglet_sequence INT NOT NULL,
  -- Stores the *latest* status for fast lookup.
  -- UI needs this for lists, dashboards, filters.
  -- Avoids expensive "get last log row" queries for every baglet.
  current_status TEXT, 
  latest_weight_g NUMERIC,
  latest_temp_c NUMERIC,
  latest_humidity_pct NUMERIC,
  latest_ph NUMERIC,
  harvest_count INT DEFAULT 0,              -- how many harvests done
  total_harvest_weight_g NUMERIC DEFAULT 0, -- running total if needed
  status_updated_at TIMESTAMP,
  logged_by TEXT,
  logged_timestamp TIMESTAMP DEFAULT now_ist(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE baglet_status_log (
  status_log_id BIGSERIAL PRIMARY KEY,
  baglet_id TEXT NOT NULL REFERENCES baglet(baglet_id),
  batch_id TEXT NOT NULL REFERENCES batch(batch_id),
  previous_status TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  status_timestamp TIMESTAMP DEFAULT now_ist(), -- When the status change actually occurred
  logged_by TEXT,
  logged_timestamp TIMESTAMP DEFAULT now_ist()  -- System entry time
);

CREATE TABLE harvest (
  harvest_id BIGSERIAL PRIMARY KEY,
  baglet_id TEXT NOT NULL REFERENCES baglet(baglet_id),
  batch_id TEXT NOT NULL REFERENCES batch(batch_id),      -- Added for efficient reporting
  harvest_weight_g NUMERIC NOT NULL,                      -- Standardized to _g
  harvested_timestamp TIMESTAMP NOT NULL,               -- The actual time harvest happened
  notes TEXT,                                             -- Added for quality/flush observations
  logged_by TEXT,                                         -- User who entered the record
  logged_timestamp TIMESTAMP DEFAULT now_ist()              -- System entry time
);

-- Constraint: A baglet can only be harvested once per day (IST)
CREATE UNIQUE INDEX idx_harvest_baglet_day_unique ON harvest (baglet_id, (harvested_timestamp::DATE));

-- ==========================================
-- Contamination Catalog (Reference Table)
-- ==========================================
CREATE TABLE contamination_catalog (
    contamination_code TEXT PRIMARY KEY,
    contamination_type TEXT NOT NULL,
    contaminant TEXT NOT NULL,
    symptoms TEXT,
    notes TEXT
);

-- ==========================================
-- Baglet Contamination Log (Association Table)
-- ==========================================
CREATE TABLE baglet_contamination (
    id BIGSERIAL PRIMARY KEY,
    baglet_id TEXT NOT NULL REFERENCES baglet(baglet_id),
    contamination_code TEXT NOT NULL REFERENCES contamination_catalog(contamination_code),
    notes TEXT,
    logged_by TEXT,
    logged_timestamp TIMESTAMP DEFAULT now_ist(),
    
    -- Constraint: Unique combination ensuring a specific contamination type is only logged once per baglet
    CONSTRAINT uq_baglet_contamination UNIQUE (baglet_id, contamination_code)
);

CREATE VIEW v_strain_full AS
SELECT
    s.strain_code,  
    m.mushroom_id,
    m.mushroom_name,
    sv.strain_vendor_id,
    sv.vendor_name,
    s.strain_desc
FROM strain s
JOIN mushroom m
    ON s.mushroom_id = m.mushroom_id
JOIN strain_vendor sv
    ON s.strain_vendor_id = sv.strain_vendor_id
ORDER BY
    m.mushroom_name,
    s.strain_code;


CREATE VIEW v_substrate_full AS
SELECT
  s.substrate_id,
  s.substrate_name,
  sm.medium_id,
  m.medium_name,
  sm.qty_g AS medium_qty_g,
  ss.supplement_id,
  sp.supplement_name,
  ss.qty AS supplement_qty,
  sp.measure_type AS supplement_unit,
  s.is_test,
  s.expected_expansion_ratio,
  s.origin_substrate_id,
  s.substrate_desc
FROM substrate s
LEFT JOIN substrate_medium sm ON s.substrate_id = sm.substrate_id
LEFT JOIN medium m ON sm.medium_id = m.medium_id
LEFT JOIN substrate_supplement ss ON s.substrate_id = ss.substrate_id
LEFT JOIN supplement sp ON ss.supplement_id = sp.supplement_id;

CREATE TABLE substrate_expansion_history (
  expansion_history_id BIGSERIAL PRIMARY KEY,

  substrate_id TEXT NOT NULL
    REFERENCES substrate(substrate_id),

  old_expected_ratio NUMERIC(5,2) NOT NULL,
  new_expected_ratio NUMERIC(5,2) NOT NULL,

  change_reason TEXT,
  -- Example: "Observed avg ~2.3 across 5 batches (Oct 2025)"

  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);
