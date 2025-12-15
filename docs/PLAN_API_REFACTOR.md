# API & Backend Refactoring Plan

**Goal:** Centralize business logic, improve validation, and clean up API routes for better maintainability and testability.

## 1. Abstract "Batch" Logic ✅ COMPLETED

*   **Target:** `app/api/batches/route.ts` and `app/api/batches/[id]/...`
*   **Action:**
    *   ✅ Created `lib/validation-schemas.ts` for centralized validation schemas.
    *   ✅ Created `lib/batch-actions.ts` with `planBatch()` function (renamed from "create" to "plan").
    *   ✅ Moved batch creation transaction (validation → strain check → insertion) into `planBatch(data)`.
    *   ✅ API route is now a thin wrapper (35 lines vs 200+ lines).
*   **Outcome:** API routes are thin wrappers that handle Request/Response and Auth. Business logic is reusable and testable.
*   **Convention Change:** "Create Batch" → "Plan Batch" throughout the codebase.


## 2. Refactor "Baglet" Logic
*   **Target:** `app/api/baglets/...`
*   **Action:**
    *   Standardize `lib/baglet-actions.ts` to be the single source of truth for Baglet updates.
    *   Ensure all baglet queries utilize a `getBagletById` or `searchBaglets` service function instead of raw SQL in the route.
*   **Outcome:** Consistent logic for "single" vs "bulk" updates and logging.

## 3. Enhanced Validation Layer
*   **Target:** All write operations.
*   **Action:**
    *   Ensure all `POST` / `PUT` requests use **Zod** schemas for input validation.
    *   Centralize these schemas in `lib/validation-schemas.ts` (or similar) so they can be shared with the frontend forms.
*   **Outcome:** "Invalid Data" is caught at the door; Database never sees bad data.

## 4. Error Handling Standardization
*   **Target:** Global API responses.
*   **Action:**
    *   Create a consistent `AppError` class or helper.
    *   Ensure all 500/400 responses return the exact same JSON shape (e.g., `{ error: { code: string, message: string, details?: any } }`).
*   **Outcome:** Frontend can have a single global error handler.

## 5. Pending Refactors (To Do)
The following routes have not yet been fully refactored to the new standard (Thin Wrapper + Zod + Actions + Shared DB):

*   `app/api/baglets/[id]/status/route.ts`:
    *   Uses raw SQL SELECT.
    *   Uses manual `neon()` initialization.
    *   Needs Zod Validation.
*   `app/api/batches/[id]/update-status/route.ts`:
    *   Uses deprecated `request: Request`.
    *   Uses manual `neon()` initialization.
*   `app/api/batches/[id]/add-baglet/route.ts`:
    *   Needs inspection and modernization.
