# Harvest Feature Requirements

## Overview

The harvest feature has two tabs for different workflows:
1. **Quick Harvest** - Fast scan-and-enter workflow for recording harvests
2. **Active Harvests** - View harvests from active batches, grouped by batch

---

## Tab 1: Quick Harvest

### Purpose
Fast data entry for recording harvests in real-time during harvest operations.

### Workflow
1. **Scan/Enter Baglet ID**
   - QR scanner or manual input
   - System validates if baglet is ready for harvest
   
2. **View Baglet Details** (if valid)
   - Mushroom type
   - Batch ID
   - Harvest number (1st, 2nd, 3rd flush, etc.)
   - Current status
   
3. **Enter Data**
   - Weight (grams) - required
   - Notes - optional
   
4. **Submit**
   - Records harvest
   - Updates baglet status
   - Clears form for next scan

### UI Components
- Stats cards (ready count, harvested today)
- Baglet ID input with scanner
- Baglet details card
- Weight input
- Notes input
- Submit button

### Similar To
Status Logger pattern - scan, validate, enter data, submit, clear

---

## Tab 2: Active Harvests

### Purpose
View recent harvests from currently active batches (not historical data).

### Display Format
**Table grouped by batch**, showing:
- Harvest Date
- Baglet ID  
- Harvest Weight (grams)
- Batch ID (group header)
- Harvest Number (which flush)

### Example:
```
Batch: FPR-11122025-B01 (Oyster Mushroom)
---------------------------------------------
Date         Baglet ID                        Weight  Flush
12/11/2025   FPR-11122025-B01-P01-001        150g    #1
12/11/2025   FPR-11122025-B01-P01-002        180g    #1
12/10/2025   FPR-11122025-B01-P01-001        120g    #2

Batch: FPR-10122025-B02 (Shiitake)
---------------------------------------------
Date         Baglet ID                        Weight  Flush
12/11/2025   FPR-10122025-B02-P02-005        200g    #1
```

### Filtering
- **Show only active batches** (batches with status IN_PROGRESS or recent activity)
- **NOT all historical data** (that's for Reports)
- **Group by batch** for easy scanning
- **Sort by date descending** (most recent first)

### Features
- Search/filter by batch ID
- Expandable batch groups
- Shows batch summary (total harvests, total weight)

---

## Database Queries

### Quick Harvest Tab
1. Validate baglet: 1 query
2. Submit harvest: 1 transaction (insert + updates)
3. Stats: 2 queries (cached)

### Active Harvests Tab
```sql
-- Get harvests from active batches only
SELECT 
  h.harvest_id,
  h.baglet_id,
  h.batch_id,
  h.harvest_weight_g,
  h.harvested_timestamp,
  b.harvest_count as flush_number,
  ba.mushroom_type,
  ba.prepared_date
FROM harvest h
JOIN baglet b ON h.baglet_id = b.baglet_id
JOIN batch ba ON h.batch_id = ba.batch_id
WHERE ba.status = 'IN_PROGRESS'  -- Only active batches
  AND h.harvested_timestamp > NOW() - INTERVAL '30 days'  -- Recent only
ORDER BY h.batch_id, h.harvested_timestamp DESC;
```

---

## Implementation Notes

### Tab Navigation
- Use client-side tabs (no page reload)
- Active tab highlighted
- Each tab fetches data when opened (fresh data)

### Performance
- Quick Harvest: No list caching (avoid stale data)
- Active Harvests: Can cache briefly (1-2 minutes)
- Grouped display: Render batch headers with expand/collapse

### User Experience
- Default tab: Quick Harvest (primary workflow)
- Switch to Active Harvests to review recent work
- No pagination needed (limited to active batches)

---

**Document Version**: 2.0  
**Created**: 2025-12-11  
**Status**: Requirements Document
**Next Steps**: Implement according to this spec
