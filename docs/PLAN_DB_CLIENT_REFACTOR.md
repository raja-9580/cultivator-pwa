# Database Client Refactor Plan

This document outlines the strategy for migrating API routes from manual `neon()` initialization (or direct `sql` exports) to the centralized `getSql()` helper. This migration improves maintainability and allows for consistent control over database caching (via Neon's `fetchOptions`).

## Categorization Rationale

- **Cached (`getSql()`)**: Used for data that changes infrequently (e.g., lookups, catalogs). Improves performance by leveraging Neon's serverless cache.
- **Fresh (`getSql(true)`)**: Used for real-time dashboards, status checks, and all mutation (POST/PUT/PATCH/DELETE) operations. Ensures data consistency and prevents stale reads following updates by bypassing the cache (`no-store`).
- **User-Controlled**: Used when the UI specifically requests a refresh (e.g., history logs).

## Refactor Checklist

### 1. Lookup Routes (Cached)
These routes return stable reference data.
- [ ] `app/api/strains/route.ts` -> `getSql()`
- [ ] `app/api/substrates/route.ts` -> `getSql()`
- [ ] `app/api/crc/catalog/route.ts` -> `getSql()`

### 2. Batch Management (Fresh)
Critical for tracking production state.
- [ ] `app/api/batches/route.ts` (GET & POST) -> `getSql(true)`
- [ ] `app/api/batches/[id]/route.ts` -> `getSql(true)`
- [ ] `app/api/batches/[id]/add-baglet/route.ts` -> `getSql(true)`
- [ ] `app/api/batches/[id]/update-status/route.ts` -> `getSql(true)`
- [ ] `app/api/batches/[id]/export-labels/route.ts` -> `getSql(true)`

### 3. Baglet Management (Fresh)
Highly dynamic baglet-level data.
- [ ] `app/api/baglets/route.ts` -> `getSql(true)`
- [ ] `app/api/baglets/[id]/status/route.ts` -> `getSql(true)`
- [ ] `app/api/baglets/[id]/metrics/route.ts` -> `getSql(true)`
- [ ] `app/api/baglets/[id]/prepare/route.ts` -> `getSql(true)`

### 4. Harvest Module (Fresh)
High visibility and impact on reporting.
- [ ] `app/api/harvest/dashboard/route.ts` -> `getSql(true)`
- [ ] `app/api/harvest/validate/route.ts` -> `getSql(true)`
- [ ] `app/api/harvest/record/route.ts` -> `getSql(true)`

### 5. CRC Module (Fresh)
New module requiring accurate analysis checks.
- [x] `app/api/crc/validate/route.ts` -> `getSql(true)` (DONE)
- [x] `app/api/crc/dashboard/route.ts` -> `getSql(true)` (DONE)
- [ ] `app/api/crc/analyze/route.ts` -> `getSql(true)`

### 6. Specialized Routes
- [ ] `app/api/harvest/history/route.ts` -> Already uses `getSql(forceRefresh)` (via query param).
- [ ] `app/api/debug/batch/[id]/route.ts` -> `getSql(true)`

## Execution Strategy
1. **Selection**: Pick one route from the checklist.
2. **Implementation**: Replace `neon(...)` with `getSql(...)`.
3. **Verification**: 
   - Verify data is returned correctly.
   - If "Fresh", verify that updates are immediately reflected without stale lag.
4. **Completion**: Mark the route as done in this document.
