# Cultivation System Optimization Plan

This plan outlines a step-by-step approach to optimizing the application, focusing on code quality, performance, and structure. We will execute these one by one, verifying each change.

## Phase 1: Logic Refactoring & Abstraction (High Value)
**Goal:** Clean up large API routes and improve reusability by moving business logic to the `lib/` service layer.

*   [ ] **Step 1: Extract "Create Batch" Logic**
    *   **Current State:** `api/batches/route.ts` contains ~200 lines of complex transaction logic (validation, strain check, substrate check, batch ID generation, baglet loop).
    *   **Action:** Create `lib/batch-services.ts`. Move the `createBatch` transaction logic there.
    *   **Benefit:** deeply simplifies the API route, makes batch creation testable and reusable (e.g., for bulk import tools later).

*   [ ] **Step 2: Extract "Batch Status Update" Logic**
    *   **Current State:** `api/batches/[id]/update-status/route.ts` has logic for bulk updating baglets.
    *   **Action:** Move this to `lib/batch-services.ts` as `updateBatchStatus`.
    *   **Benefit:** Centralizes all batch-related heavy lifting.

## Phase 2: React Performance & Best Practices (Medium Value)
**Goal:** Improve frontend performance and follow Next.js recommended patterns.

*   [ ] **Step 3: Optimization of Image Assets**
    *   **Current State:** `Logo.tsx` uses standard `<img>` tags.
    *   **Action:** Replace with `next/image` to allow for automatic resizing, lazy loading, and format optimization (WebP).
    *   **Benefit:** Faster Initial Contentful Paint (LCP) and lower bandwidth usage.

*   [ ] **Step 4: Strict Type Safety Improvements**
    *   **Current State:** Some `try/catch` blocks use `error: any` and some Neondb calls use `any` for the SQL client.
    *   **Action:** Create a standard `AppError` type and a typed wrapper for the database client if possible, or at least standardized error utilities.
    *   **Benefit:** Fewer runtime surprises and better autocomplete.

## Phase 3: Accessibility & UX Polish (Medium Value)
**Goal:** Ensure the app is usable by everyone and complies with web standards.

*   [ ] **Step 5: Accessibility Audit**
    *   **Current State:** Icon-only buttons (like in Sidebar and BottomNav) may lack accessible labels.
    *   **Action:** Add `aria-label` to all icon buttons and ensure color contrast ratios are sufficient for text-on-dark backgrounds.
    *   **Benefit:** Better support for screen readers and "Power User" navigation.

## Phase 4: Testing Foundation (Long Term)
**Goal:** Ensure stability as the app grows.

*   [ ] **Step 6: Setup Unit Testing Framework**
    *   **Current State:** No testing framework.
    *   **Action:** Install `vitest` and proper dependencies. Create a sample test for `lib/baglet-workflow.ts`.
    *   **Benefit:** Safety net for future logic changes (especially heavily regulated things like organic certification tracking).

---
**Recommendation for Next Step:**
Start with **Step 1: Extract "Create Batch" Logic**. This gives you the biggest immediate win for code clarity and structure.
