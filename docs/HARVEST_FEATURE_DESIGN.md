# Harvest Feature Design & Implementation Plan

## 1. Overview
The "Harvest" feature allows tracking the yield output from each baglet. Given that a baglet typically yields 2-3 harvests in its lifecycle, this feature will record individual harvest events (weight, time) while maintaining performant aggregates on the baglet and batch levels for reporting.

## 2. Database Schema Design

### 2.1 New Table: `harvest`
This table captures the granular details of every harvest event.

**Key Design Decision: Foreign Keys**
*   **Selected Approach**: Link `harvest` ONLY to `baglet_id`.
*   **Reasoning**: 
    *   The `baglet` table already references `batch_id`.
    *   Adding `batch_id` to the `harvest` table would introduce data redundancy (normalization violation) and potential data anomalies.
    *   Join performance in Postgres for `harvest -> baglet -> batch` is negligible for this scale.

```sql
CREATE TABLE harvest (
  harvest_id BIGSERIAL PRIMARY KEY,
  baglet_id TEXT NOT NULL REFERENCES baglet(baglet_id),
  harvest_weight_gms NUMERIC NOT NULL,
  harvested_timestamp TIMESTAMPTZ NOT NULL, -- The actual time harvest happened
  logged_by TEXT,                           -- User who entered the record
  logged_timestamp TIMESTAMPTZ DEFAULT now(), -- System time of entry
  
  -- Constraint to prevent future dates
  CONSTRAINT check_harvest_time CHECK (harvested_timestamp <= now())
);
```

### 2.2 Table Modification: `baglet`
We will denormalize specific aggregate data onto the `baglet` table to optimize read performance for dashboards and lists.

**Key Design Decision: Aggregates on Parent Table**
*   **Selected Approach**: Store `harvest_count` and `total_harvest_weight` on the `baglet` table.
*   **Reasoning**:
    *   **Performance**: Batch-level reports often need the total weight. Summing a column in the `baglet` table is significantly faster than joining and summing the `harvest` table history every time a report is viewed.
    *   **UX sorting**: Allows users to sort baglet lists by "Highest Yield" instantly.
    *   **Low Write Overhead**: Since updates (harvests) happen rarely (2-3 times per baglet), the strict write cost of updating the parent row is acceptable.

```sql
-- Add aggregate columns to existing baglet table
ALTER TABLE baglet
ADD COLUMN harvest_count INT DEFAULT 0,
ADD COLUMN total_harvest_weight NUMERIC DEFAULT 0;
```

## 3. Implementation Workflow

### 3.1 Backend Logic (API)
The "Add Harvest" action will be an atomic transaction that performs two actions:

1.  **Insert Record**: Create a new row in the `harvest` table.
2.  **Update Aggregates**: Immediately increment the counters on the parent `baglet` record.

**Pseudo-Code (Transaction):**
```typescript
await db.transaction(async (tx) => {
  // 1. Insert detailed record
  await tx.insert(harvest).values({
    bagletId,
    weight,
    harvestedAt,
    loggedBy
  });

  // 2. Update parent aggregates
  await tx.update(baglet)
    .set({
      harvestCount: sql`harvest_count + 1`,
      totalHarvestWeight: sql`total_harvest_weight + ${weight}`
    })
    .where(eq(baglet.id, bagletId));
});
```

### 3.2 Frontend Implications
*   **Baglet Details View**: Show a list of harvest history (date, weight) from the `harvest` table.
*   **Baglet List/Batch View**: Display the `total_harvest_weight` directly from the `baglet` table (no complex joins needed).
*   **Forms**: The "Add Harvest" form only needs to ask for `Weight` (and optionally `Time`, defaulting to now).
