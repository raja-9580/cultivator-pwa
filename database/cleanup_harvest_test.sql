-- Cleanup Script for Harvest Test Data
-- Removes all data created by seed_harvest_test.sql and seed_harvest_history.sql
-- identifiable by logged_by = 'tester'

DELETE FROM harvest WHERE logged_by = 'tester';
DELETE FROM baglet WHERE logged_by = 'tester';
DELETE FROM batch WHERE logged_by = 'tester';
