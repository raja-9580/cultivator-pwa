-- Views
DROP VIEW IF EXISTS v_substrate_full;
DROP VIEW IF EXISTS v_strain_full;

-- Tables (Child tables first to respect foreign keys)
DROP TABLE IF EXISTS substrate_expansion_history;
DROP TABLE IF EXISTS baglet_contamination;
DROP TABLE IF EXISTS contamination_catalog;
DROP TABLE IF EXISTS harvest;
DROP TABLE IF EXISTS baglet_status_log;
DROP TABLE IF EXISTS baglet;
DROP TABLE IF EXISTS batch;
DROP TABLE IF EXISTS substrate_supplement;
DROP TABLE IF EXISTS substrate_medium;
DROP TABLE IF EXISTS substrate;
DROP TABLE IF EXISTS supplement;
DROP TABLE IF EXISTS medium;
DROP TABLE IF EXISTS strain;
DROP TABLE IF EXISTS strain_vendor;
DROP TABLE IF EXISTS mushroom;
DROP TABLE IF EXISTS farm;

-- Functions
DROP FUNCTION IF EXISTS now_ist;
