# Tech Debt Refactor Revert & Feature Plan

**Date:** 2025-12-12  
**Status:** In Progress (Tasks 1, 2, 4 & 5 ✅ Complete)

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

### 6. Workflow UI State (Smart Buttons)
**Current Issue:**
- Dashboard/Batch Details decide button visibility using hardcoded status string checks
- Example: `batch.bagletStatusCounts?.['PLANNED']`, `statusCounts['PREPARED']`

**Refactor Approach:**
- This depends on Tasks 3-5 being complete (needs transition configs)
- Already has `getBatchWorkflowStage` helper, but individual status checks are still hardcoded
- Create additional helpers if needed or update existing checks to use transition configs
- **Test:** All batch action buttons display correctly

**Files to Touch:**
- `lib/baglet-workflow.ts` (potentially add helpers)
- `app/batches/[id]/page.tsx` (status count checks)
- `app/batches/page.tsx` (status count checks)

---

## Execution Order

1. ✅ **Tasks 1 & 2** - Initial Status (shared helper refactor) - COMPLETE
2. **Task 3** - Preparation workflow (PLANNED → PREPARED) - Individual operation
3. **Task 4** - Sterilization (PREPARED → STERILIZED) - Bulk operation
4. **Task 5** - Inoculation (STERILIZED → INOCULATED) - Bulk operation
5. **Task 6** - UI Smart Buttons (depends on 3, 4, 5)

**Dependency Reasoning:**
- Task 3 comes before 4 & 5 because preparation must happen before sterilization
- Tasks 4 & 5 are similar patterns (bulk operations) but kept separate for clean testing
- Task 6 depends on all transition configs being defined

---

## Additional Hardcoded Patterns (Fix When Time Permits)

### 📍 Batch List Page (`app/batches/page.tsx`)

**Lines 90-92** - `handleStatusUpdate` function:
```typescript
const actionName = action === 'sterilize' ? 'STERILIZED' : 'INOCULATED';
const currentStatus = action === 'sterilize' ? 'PREPARED' : 'STERILIZED';
```
**Fix:** Use `BATCH_ACTIONS[action].to` and `BATCH_ACTIONS[action].from` from centralized config

**Line 323** - Add Baglet button visibility:
```typescript
{(batch.bagletStatusCounts?.['PLANNED'] ?? 0) > 0 && (
```
**Fix:** Create helper like `hasStatusCount(statusCounts, INITIAL_BAGLET_STATUS)`

**Line 399** - Export Labels button visibility:
```typescript
{(batch.bagletStatusCounts?.['INOCULATED'] ?? 0) > 0 && (
```
**Fix:** Use `INOCULATION_TRANSITION.to` or create helper `hasInoculatedBaglets(statusCounts)`

**Line 408** - Export button label:
```typescript
📊 Export ({batch.bagletStatusCounts?.['INOCULATED'] ?? 0})
```
**Fix:** Same as above

---

### 📍 Batch Detail Page (`app/batches/[id]/page.tsx`)

**Line 217** - Prepared count for Sterilize button:
```typescript
const preparedCount = batch.bagletStatusCounts?.['PREPARED'] ?? 0;
```
**Fix:** Use `STERILIZATION_TRANSITION.from`

**Line 226** - Sterilized count for Inoculate button:
```typescript
const sterilizedCount = batch.bagletStatusCounts?.['STERILIZED'] ?? 0;
```
**Fix:** Use `INOCULATION_TRANSITION.from`

**Line 238** - Export Labels visibility:
```typescript
{(batch.bagletStatusCounts?.['INOCULATED'] ?? 0) > 0 && (
```
**Fix:** Use `INOCULATION_TRANSITION.to`

**Line 248** - Export Labels count display:
```typescript
<span>Export Labels ({batch.bagletStatusCounts['INOCULATED']})</span>
```
**Fix:** Use `INOCULATION_TRANSITION.to`

**Line 257** - Add Baglet button visibility:
```typescript
{(batch.bagletStatusCounts?.['PLANNED'] ?? 0) > 0 && (
```
**Fix:** Use `INITIAL_BAGLET_STATUS`

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

## Recommended Helper Functions

To eliminate UI hardcoded strings, consider adding these helpers to `lib/baglet-workflow.ts`:

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

These helpers would centralize the pattern and make UI code cleaner.

---


