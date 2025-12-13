# Tech Debt Refactor Revert & Feature Plan

**Date:** 2025-12-12  
**Status:** In Progress (Tasks 1, 2, 4, 5 & 6 ✅ Complete)

This report details the reversion of the "Hardcoded Batch Workflow Transitions" refactor. We have reverted to a clean state. Going forward, we will refactor the code **one business feature at a time** to ensure stability and testability.

## Key Principles

1. **One Feature at a Time** - Each feature should be completable and testable independently
2. **Dependency First** - If feature B uses shared code also used by feature A, refactor the shared code first
3. **Centralize Once** - Logic should live in ONE place (helpers/config), not scattered across callers
4. **Clear Impact** - Each change should have a clear, testable impact area

## Business Feature Breakdown

### ✅ Tasks 1 & 2: Initial Baglet Status (COMPLETE)
**Features:** Batch Planning + Ad-hoc Baglet Addition  
**Why Together:** Both use the same helper function (`createBagletWithLog`)

**What Changed:**
- **File:** `lib/baglet-workflow.ts`
  - Added `INITIAL_BAGLET_STATUS = BagletStatus.PLANNED`
- **File:** `lib/batch-actions.ts`
  - Updated `createBagletWithLog` helper to use `INITIAL_BAGLET_STATUS` internally
  - Removed `initialStatus` parameter from interface
  - Updated `planBatch` call (removed hardcoded `'PLANNED'`)
  - Updated `addBagletToBatch` call (removed hardcoded reference)

**Impact:**
- Both features automatically share same initial status config
- Future changes: edit one constant, both features update
- **Test:** Create new batch + Add surplus baglet, verify both start as PLANNED

---

### 3. Batch Preparation Workflow (PLANNED → PREPARED)
**Current Issue:**
- **Backend:** Individual baglet status update API (`/api/baglets/[id]/status`) hardcodes `'PREPARED'` 
- **Frontend:** `PrepareBatchModal` component hardcodes `newStatus: 'PREPARED'` (line 168)

**Refactor Approach:**
1. Create preparation config in `lib/baglet-workflow.ts`:
   ```typescript
   export const PREPARATION_TRANSITION = {
     from: BagletStatus.PLANNED,
     to: BagletStatus.PREPARED,
   };
   ```
2. Update `PrepareBatchModal` component to use config
3. (Backend already flexible - accepts any valid transition)
4. **Test ONLY:** Preparation workflow

**Files to Touch:**
- `lib/baglet-workflow.ts` (add config)
- `components/batches/PrepareBatchModal.tsx` (use config instead of hardcoded 'PREPARED')

**Note:** This is a single-baglet operation (user prepares baglets one-by-one), different from bulk batch operations.

---

### ✅ Task 4: Batch Sterilization (Bulk Action: PREPARED → STERILIZED) - COMPLETE
**What Changed:**
- **File:** `lib/baglet-workflow.ts`
  - Added `STERILIZATION_TRANSITION` constant with `from: PREPARED` and `to: STERILIZED`
- **File:** `lib/batch-actions.ts`
  - Updated `updateBatchStatus` function to use `STERILIZATION_TRANSITION.from` and `STERILIZATION_TRANSITION.to`
  - Removed hardcoded `'PREPARED'` and `'STERILIZED'` strings
- **File:** `app/batches/[id]/page.tsx`
  - Updated `actionConfig` for sterilize action to use `STERILIZATION_TRANSITION`
  - Removed hardcoded status strings from frontend

**Impact:**
- Sterilization workflow now uses centralized config
- Single source of truth for PREPARED → STERILIZED transition
- Both backend and frontend share same configuration
- **Test:** Sterilization workflow (PREPARED → STERILIZED)

---

### ✅ Task 5: Batch Inoculation (Bulk Action: STERILIZED → INOCULATED) - COMPLETE
**What Changed:**
- **File:** `lib/baglet-workflow.ts`
  - Added `INOCULATION_TRANSITION` constant with `from: STERILIZED` and `to: INOCULATED`
- **File:** `lib/batch-actions.ts`
  - Updated `updateBatchStatus` function to use `INOCULATION_TRANSITION.from` and `INOCULATION_TRANSITION.to`
  - Removed hardcoded `'STERILIZED'` and `'INOCULATED'` strings
- **File:** `app/batches/[id]/page.tsx`
  - Updated `actionConfig` for inoculate action to use `INOCULATION_TRANSITION`
  - Removed hardcoded status strings from frontend

**Impact:**
- Inoculation workflow now uses centralized config
- Single source of truth for STERILIZED → INOCULATED transition
- Both backend and frontend share same configuration
- **Test:** Inoculation workflow (STERILIZED → INOCULATED)

---

### ✅ Task 6: Workflow UI State (Smart Buttons) - COMPLETE
**What Changed:**
- **File:** `lib/baglet-workflow.ts`
  - Added `getStatusCount` helper function to get count for a specific status
  - Added `hasStatus` helper function to check if batch has baglets in a specific status
  - Updated `getBatchWorkflowStage` to use `INITIAL_BAGLET_STATUS`, `STERILIZATION_TRANSITION.from`, and `INOCULATION_TRANSITION.from` instead of hardcoded strings

- **File:** `app/batches/[id]/page.tsx` (Batch Detail Page)
  - Updated import to include `getStatusCount` and `INITIAL_BAGLET_STATUS`
  - Replaced `batch.bagletStatusCounts?.['PREPARED']` with `getStatusCount(batch.bagletStatusCounts, STERILIZATION_TRANSITION.from)` (line 217)
  - Replaced `batch.bagletStatusCounts?.['STERILIZED']` with `getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.from)` (line 226)
  - Replaced `batch.bagletStatusCounts?.['INOCULATED']` checks with `getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to)` (lines 238, 248)
  - Replaced `batch.bagletStatusCounts?.['PLANNED']` with `getStatusCount(batch.bagletStatusCounts, INITIAL_BAGLET_STATUS)` (line 257)

- **File:** `app/batches/page.tsx` (Batch List Page)
  - Updated import to include `BATCH_ACTIONS`, `INITIAL_BAGLET_STATUS`, `INOCULATION_TRANSITION`, and `getStatusCount`
  - Updated `handleStatusUpdate` to use `BATCH_ACTIONS[action]` mapping instead of hardcoded if/else (lines 89-92)
  - Replaced hardcoded 'PLANNED' check with `getStatusCount(batch.bagletStatusCounts, INITIAL_BAGLET_STATUS)` (line 323)
  - Replaced hardcoded 'INOCULATED' checks with `getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to)` (lines 399, 408)

**Impact:**
- All UI button visibility logic now uses centralized configuration
- Helper functions provide consistent, type-safe access to status counts
- Eliminated ~12 instances of hardcoded status strings across UI code
- Single source of truth for all status transitions
- **Test:** Verify all batch action buttons (Prepare, Sterilize, Inoculate, Add Baglet, Export Labels) display correctly based on batch state


---

## Execution Order

1. ✅ **Tasks 1 & 2** - Initial Status (shared helper refactor) - COMPLETE
2. **Task 3** - Preparation workflow (PLANNED → PREPARED) - Individual operation - TODO
3. ✅ **Task 4** - Sterilization (PREPARED → STERILIZED) - Bulk operation - COMPLETE
4. ✅ **Task 5** - Inoculation (STERILIZED → INOCULATED) - Bulk operation - COMPLETE
5. ✅ **Task 6** - UI Smart Buttons (depends on 3, 4, 5) - COMPLETE

**Dependency Reasoning:**
- Task 3 comes before 4 & 5 because preparation must happen before sterilization
- Tasks 4 & 5 are similar patterns (bulk operations) but kept separate for clean testing
- Task 6 depended on transition configs being defined (Tasks 4 & 5 complete, Task 3 still uses hardcoded value but doesn't block Task 6)

---

## Additional Hardcoded Patterns (Fix When Time Permits)

### 📍 Batch List Page (`app/batches/page.tsx`)

**Lines 90-92** - ~~`handleStatusUpdate` function~~ ✅ FIXED in Task 6:
- Now uses `BATCH_ACTIONS[action].to` and `BATCH_ACTIONS[action].from`

**Line 323** - ~~Add Baglet button visibility~~ ✅ FIXED in Task 6:
- Now uses `getStatusCount(batch.bagletStatusCounts, INITIAL_BAGLET_STATUS)`

**Line 399** - ~~Export Labels button visibility~~ ✅ FIXED in Task 6:
- Now uses `getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to)`

**Line 408** - ~~Export button label~~ ✅ FIXED in Task 6:
- Now uses `getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to)`

---

### 📍 Batch Detail Page (`app/batches/[id]/page.tsx`)

**Line 217** - ~~Prepared count for Sterilize button~~ ✅ FIXED in Task 6:
- Now uses `getStatusCount(batch.bagletStatusCounts, STERILIZATION_TRANSITION.from)`

**Line 226** - ~~Sterilized count for Inoculate button~~ ✅ FIXED in Task 6:
- Now uses `getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.from)`

**Line 238** - ~~Export Labels visibility~~ ✅ FIXED in Task 6:
- Now uses `getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to)`

**Line 248** - ~~Export Labels count display~~ ✅ FIXED in Task 6:
- Now uses `getStatusCount(batch.bagletStatusCounts, INOCULATION_TRANSITION.to)`

**Line 257** - ~~Add Baglet button visibility~~ ✅ FIXED in Task 6:
- Now uses `getStatusCount(batch.bagletStatusCounts, INITIAL_BAGLET_STATUS)`

---

### 📍 Prepare Batch Modal (`components/batches/PrepareBatchModal.tsx`)

**Line 168** - Status transition:
```typescript
newStatus: 'PREPARED',
```
**Fix:** Create `PREPARATION_TRANSITION` config (Task 3)

---

### 📍 Workflow Configuration (`lib/baglet-workflow.ts`)

**Lines 106-108** - Status checks in `getBatchWorkflowStage`:
```typescript
const planned = statusCounts['PLANNED'] ?? 0;
const prepared = statusCounts['PREPARED'] ?? 0;
const sterilized = statusCounts['STERILIZED'] ?? 0;
```
**Fix:** Use centralized transition configs instead of hardcoded strings

---

## ✅ Recommended Helper Functions (IMPLEMENTED in Task 6)

The following helper functions were added to `lib/baglet-workflow.ts` in Task 6:

```typescript
// Get count for a specific status
export function getStatusCount(
  statusCounts: Record<string, number> | undefined, 
  status: BagletStatus
): number {
  return statusCounts?.[status] ?? 0;
}

// Check if batch has baglets in specific status
export function hasStatus(
  statusCounts: Record<string, number> | undefined,
  status: BagletStatus
): boolean {
  return getStatusCount(statusCounts, status) > 0;
}
```

These helpers have been integrated throughout the UI code to eliminate hardcoded status strings.

---


