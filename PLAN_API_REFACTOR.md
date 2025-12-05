# API & Backend Refactoring Plan

**Goal:** Centralize business logic, improve validation, and clean up API routes for better maintainability and testability.

## 1. Abstract "Batch" Logic
*   **Target:** `app/api/batches/route.ts` and `app/api/batches/[id]/...`
*   **Action:**
    *   Create `lib/services/batch-service.ts`.
    *   Move `createBatch` transaction (validation -> strain check -> insertion) into a function `createBatchTransaction(data)`.
    *   Move `updateBatchStatus` logic into `updateBatchStatus(batchId, status)`.
*   **Outcome:** API routes become thin wrappers that just handle Request/Response and Auth.

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
