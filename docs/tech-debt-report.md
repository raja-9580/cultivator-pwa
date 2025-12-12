# Tech Debt & Maintenance Report

This document outlines identified areas of technical debt, specifically focusing on "Magic Strings," duplicated logic, and hardcoded values that pose a maintenance risk.

## 🚨 MUST FIX
**Critical risks.** If logic changes in one place, these locations *will* break or create inconsistent data.

### 1. Hardcoded Batch Workflow Transitions
- **Location:** `lib/batch-actions.ts` (Lines 596-602)
- **Issue:** The transition from `PREPARED` → `STERILIZED` and `STERILIZED` → `INOCULATED` is hardcoded string comparisons inside `updateBatchStatus`.
- **Risk:** If the workflow changes (e.g., separating Sterilization into `STERILIZING` → `COOLED` → `STERILIZED`), this backend logic will become invalid or bypass the new steps.
- **Fix:** Move bulk transition logic to `lib/baglet-workflow.ts` (e.g., `getBulkTransitionTarget(action)`) and import it.

### 2. Duplicated UI Action Logic
- **Location:** `app/batches/[id]/page.tsx` (Lines 82-93)
- **Issue:** The frontend re-defines the business logic of which status leads to which target status (`actionConfig`).
- **Risk:** Frontend and Backend logic are decoupled. If backend changes valid transitions, frontend will still try to triggers old ones, confusing users.
- **Fix:** Derive available actions and targets from a shared config in `lib/baglet-workflow.ts` or fetch valid next actions from API.

---

## ⚠️ SHOULD FIX
**Maintenance hazards.** Hardcoded values that make refactoring difficult.

### 1. hardcoded 'PLANNED' Status
- **Location:** `lib/batch-actions.ts` (Lines 390, 447, 467, 554) and `app/batches/page.tsx` (Line 289)
- **Issue:** The string literal `'PLANNED'` is used as the default initial status in multiple places.
- **Risk:** Renaming this status (e.g. to `CREATED`) would require a full codebase search-and-replace, prone to errors.
- **Fix:** Define `export const INITIAL_BAGLET_STATUS = BagletStatus.PLANNED` in `lib/baglet-workflow.ts` and use it everywhere.

### 2. Hardcoded 'PREPARED'/'STERILIZED' Strings for Searching
- **Location:** `lib/batch-actions.ts` (Lines 597, 600)
- **Issue:** Hardcoded SQL filter values.
- **Fix:** Use `BagletStatus.PREPARED` and `BagletStatus.STERILIZED` enums/constants instead of raw strings.

---

## 💡 GOOD TO FIX
**Cleanliness and clarity improvements.**

### 1. Duplicated "Active Baglet" Definition in SQL
- **Location:** `lib/batch-actions.ts` (getAllBatches, getBatchDetails), `lib/harvest-actions.ts`
- **Issue:** The logic `is_deleted = FALSE` is repeated in every query.
- **Risk:** If "Active" logic changes (e.g. `is_archived = FALSE`), all queries need updating.
- **Fix:** Harder to fix in raw SQL without an ORM builder, but considered acceptable for now. Just be aware of it.

### 2. Hardcoded Action Names
- **Location:** `update-status` API routes expecting 'sterilize' | 'inoculate' strings.
- **Issue:** API input values are magic strings.
- **Fix:** Define an `BatchAction` enum or type in shared types.

## Fix Plan
1. Centralize Bulk Transition logic in `lib/baglet-workflow.ts`.
2. Refactor `lib/batch-actions.ts` to use these centralized definitions.
3. Refactor `app/batches/[id]/page.tsx` to key off the same definitions.
4. Replace `'PLANNED'` string literals with a constant.
