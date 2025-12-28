# Migrate to TIMESTAMPTZ (The "Right Way")

The "Right Way" to handle timezones in a global application is to store timestamps with timezone information (`TIMESTAMPTZ`). This ensures that the database, server, and client all agree on the exact moment in time without manual string manipulation.

## Proposed Changes

### Database Migration (Safe SQL)
We will use the `AT TIME ZONE` clause to ensure existing data is interpreted as IST during the conversion. This prevents the database from accidentally shifting times based on its own default settings.

#### [MODIFY] [ddl.sql](file:///d:/akathi/nextjs/cultivator-akaththi/database/ddl.sql)
Update the DDL file and run these commands in the Neon console:

```sql
-- 1. Update the function
CREATE OR REPLACE FUNCTION now_ist() RETURNS TIMESTAMPTZ LANGUAGE sql AS $$
  SELECT NOW();
$$;

-- 2. Update tables (Explicitly treat existing values as Asia/Kolkata)
ALTER TABLE batch 
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata';

ALTER TABLE baglet 
  ALTER COLUMN status_updated_at TYPE TIMESTAMPTZ USING status_updated_at AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata';

ALTER TABLE baglet_status_log 
  ALTER COLUMN status_timestamp TYPE TIMESTAMPTZ USING status_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata';

ALTER TABLE harvest 
  ALTER COLUMN harvested_timestamp TYPE TIMESTAMPTZ USING harvested_timestamp AT TIME ZONE 'Asia/Kolkata',
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata';

ALTER TABLE baglet_contamination 
  ALTER COLUMN logged_timestamp TYPE TIMESTAMPTZ USING logged_timestamp AT TIME ZONE 'Asia/Kolkata';
```

> [!NOTE]
> `substrate_expansion_history.changed_at` is already `TIMESTAMPTZ`. This change brings the rest of the schema in line.

### Frontend Utility Cleanup
#### [MODIFY] [time-utils.ts](file:///d:/akathi/nextjs/cultivator-akaththi/lib/time-utils.ts)
- Simplify or remove the `parseIST` "hack" (the `+05:30` string appending).
- Since the DB will now return strings like `2024-11-11 13:50:38+05:30`, the standard `new Date()` will handle it perfectly regardless of whether the server is UTC or IST.

## Verification Plan
### Manual Verification
1. Run migration script in Neon Console.
2. Verify Baglet Details page on Localhost and Vercel.
3. Confirm that both show exactly the same IST time without needing the `TZ` environment variable.
