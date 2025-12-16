# Known Issues

## 1. Harvest Dashboard Mismatch (Ready vs Listed)

**Severity**: Medium
**Status**: Open
**Reported**: 2025-12-16

### Description
The Harvest Dashboard displays a "Ready" count (e.g., 130) but often lists fewer or zero items in the "Ready for Harvest" list below it.

### Root Cause
There is a logic discrepancy between the two SQL queries used in `lib/harvest-actions.ts`:

1.  **Count Query (`getHarvestStats`)**:
    *   Counts ALL baglets where `current_status` is in `HARVEST_READY_STATUSES` (e.g., 'PINNED', 'REPINNED').
    *   **Missing Logic**: It does *not* apply the time-based maturity filter.

2.  **List Query (`getReadyBaglets`)**:
    *   Selects baglets where `current_status` is in `HARVEST_READY_STATUSES`.
    *   **Applied Logic**: It STRICTLY applies a time filter:
        *   If 'PINNED': Must be > 48 hours since status update.
        *   Others: Must be > 7 days since status update.

### Result
Baglets that were marked as 'PINNED' recently (e.g., today) are counted in the "Ready" stat but hidden from the "Ready" list, causing user confusion.

### Proposed Fix
Update `getHarvestStats` in `lib/harvest-actions.ts` to include the same time-interval logic (`status_updated_at` check) as `getReadyBaglets`.
