# Test Plan: TIMESTAMPTZ & Timezone Migration

This document outlines the required verification steps to ensure the database migration and the switch to the `now()` standard are functioning correctly across the entire stack.

## 1. Database Schema Verification
Run these checks in the Neon SQL Console to ensure the migration script applied the correct structure.

- [ ] **Data Types**: Verify that `logged_timestamp`, `status_timestamp`, and `harvested_timestamp` in all tables are now `TIMESTAMPTZ`.
- [ ] **Default Values**: Verify that the default value for these columns is now `now()` or `CURRENT_TIMESTAMP`.
- [ ] **Indices**: Verify that `idx_harvest_baglet_day_unique` exists and uses the `AT TIME ZONE 'Asia/Kolkata'` logic.

## 2. Historical Data Integrity
Verify that existing records were not "shifted" incorrectly by 5.5 hours.

- [ ] **Check Existing Batches**: Find a batch created *before* the migration. Verify its `logged_timestamp` in the UI matches the actual lab clock time (IST).
- [ ] **Verify UTC Storage**: In the SQL console, run `SELECT logged_timestamp FROM batch WHERE ...`. It should show a UTC value (e.g., if it was 1:50 PM IST, it should be stored as 08:20 AM UTC).

## 3. Operational Workflow Testing
Perform these actions in the PWA to ensure the new `now()` logic is working in the application code.

- [ ] **Batch Preparation**: 
    - Create a new batch. 
    - Verify that the "Logged At" time in the Batch Details page matches your current time exactly.
- [ ] **Status Updates**: 
    - Move a baglet to a new status (e.g., "Inoculated").
    - Verify the "Last Updated" field updates correctly and reflects the current time.
- [ ] **CRC Findings**: 
    - Log a contamination finding for a baglet.
    - Verify that the `baglet_contamination` record's `logged_timestamp` is correct.

## 4. Harvest Logic & Constraints
This is the most critical area for timezone-sensitive logic.

- [ ] **Interval Calculation**: 
    - Check the "Ready to Harvest" list.
    - Ensure baglets are appearing/disappearing based on the correct age (e.g., 10 days since pinned).
- [ ] **Daily Harvest Limit**: 
    - Try to record two harvests for the *same baglet* on the *same calendar day*.
    - The second harvest should be blocked by the database unique index.
- [ ] **Cross-Midnight Edge Case**: 
    - (Optional) Record a harvest at 11:55 PM IST and another at 12:05 AM IST. 
    - Both should succeed as they belong to different calendar days (India time).

## 5. UI & Browser Localization
Verify that the PWA correctly localizes the UTC data from the server.

- [ ] **Browser Independence**: Check the app on both a Desktop browser and the Mobile PWA. Both should show the same IST time regardless of the device's system timezone (though typically they are both in IST).
- [ ] **Input Precision**: Use the manual date override in the Harvest form. Ensure that even if you pick a manual time, the "Seconds/Milliseconds" precision handling (`applySystemPrecision`) works correctly.
