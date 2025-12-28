-- Correction script to fix the 5.5 hour shift in historical data
-- This script only affects rows created before the migration was finalized.

DO $$
BEGIN
    -- Subtract 5.5 hours (5 hours 30 minutes) from all historical timestamps
    -- This brings them from "Mistakenly UTC" back to the correct "Absolute Moment for IST"

    UPDATE batch SET 
        logged_timestamp = logged_timestamp - INTERVAL '5 hours 30 minutes';

    UPDATE baglet SET 
        status_updated_at = status_updated_at - INTERVAL '5 hours 30 minutes',
        logged_timestamp = logged_timestamp - INTERVAL '5 hours 30 minutes';

    UPDATE baglet_status_log SET 
        status_timestamp = status_timestamp - INTERVAL '5 hours 30 minutes',
        logged_timestamp = logged_timestamp - INTERVAL '5 hours 30 minutes';

    UPDATE harvest SET 
        harvested_timestamp = harvested_timestamp - INTERVAL '5 hours 30 minutes',
        logged_timestamp = logged_timestamp - INTERVAL '5 hours 30 minutes';

    UPDATE baglet_contamination SET 
        logged_timestamp = logged_timestamp - INTERVAL '5 hours 30 minutes';

    UPDATE substrate_expansion_history SET 
        changed_at = changed_at - INTERVAL '5 hours 30 minutes';

END $$;
