# Implementation Plan: Baglet Lifecycle State Machine

## 1. Approach: Code-First Configuration
We recommend defining the **Status Enum** and **Transition Rules** in the application code (TypeScript), rather than in a database table.

### Why?
*   **Type Safety:** TypeScript ensures we never use an invalid status string in our logic.
*   **Performance:** Validation happens instantly in memory; no database query is needed to check "Can I go from A to B?".
*   **Developer Experience:** IDE autocompletion for statuses makes development faster and less error-prone.
*   **Versioning:** Changes to the workflow are tracked in Git history.

## 2. The Data Structure

### A. Updated Status Enum (`lib/types.ts`)
We will expand the `BagletStatus` enum to include all 22 requested states.

```typescript
export enum BagletStatus {
  NONE = 'NONE',
  PLANNED = 'PLANNED',
  PREPARED = 'PREPARED',
  STERILIZED = 'STERILIZED',
  INOCULATED = 'INOCULATED',
  INCUBATED = 'INCUBATED',
  PINNED = 'PINNED',
  HARVESTED = 'HARVESTED',
  REPINNED_1 = 'REPINNED_1',
  REHARVESTED_1 = 'REHARVESTED_1',
  REPINNED_2 = 'REPINNED_2',
  REHARVESTED_2 = 'REHARVESTED_2',
  REPINNED_3 = 'REPINNED_3',
  REHARVESTED_3 = 'REHARVESTED_3',
  REPINNED_4 = 'REPINNED_4',
  REHARVESTED_4 = 'REHARVESTED_4',
  CONTAMINATED = 'CONTAMINATED',
  CRC_ANALYZED = 'CRC_ANALYZED',
  DISPOSED = 'DISPOSED',
  RECYCLED = 'RECYCLED',
  DAMAGED = 'DAMAGED',
  DELETED = 'DELETED',
}
```

### B. Transition Map (`lib/workflow.ts`)
We will create a constant object that defines the *Allowed Next States* for every state.

```typescript
export const BAGLET_TRANSITIONS: Record<BagletStatus, BagletStatus[]> = {
  [BagletStatus.NONE]: [BagletStatus.PLANNED],
  [BagletStatus.PLANNED]: [BagletStatus.PREPARED, BagletStatus.DELETED],
  [BagletStatus.PREPARED]: [BagletStatus.STERILIZED, BagletStatus.DELETED],
  [BagletStatus.STERILIZED]: [BagletStatus.INOCULATED, BagletStatus.DAMAGED, BagletStatus.DELETED],
  // ... and so on for all rules
};
```

## 3. Implementation Steps

### Step 1: Update Types
*   Modify `lib/types.ts` to replace the current simple Enum with the full 22-state Enum.

### Step 2: Create Workflow Logic
*   Create `lib/workflow.ts`.
*   Implement `getAvailableTransitions(currentStatus: BagletStatus): BagletStatus[]`.
*   Implement `validateTransition(current: BagletStatus, next: BagletStatus): boolean`.

### Step 3: Database Migration
*   Since we are using string storage for enums in Postgres (likely), we just need to ensure the column length is sufficient (usually `text` or `varchar`).
*   If we are using a Postgres ENUM type, we will need to run an `ALTER TYPE` command to add the new values.

### Step 4: Backend Enforcement
*   Update the API endpoint (e.g., `POST /api/baglets/[id]/status`) to use `validateTransition`.
*   If a user tries to force an invalid state (e.g., `PLANNED` -> `HARVESTED`), the API returns `400 Bad Request`.

### Step 5: Frontend UI
*   Update the Baglet Detail View.
*   Instead of a generic dropdown, show **Action Buttons** based on the allowed transitions.
    *   *Example:* If status is `PINNED`, show buttons for [Harvest], [Contaminated].

## 4. Decision Required
Do you approve this **Code-First** plan?
*   **Yes:** I will proceed with updating `types.ts` and creating `workflow.ts`.
*   **No:** If you prefer a Database-Table approach (where rules are stored in SQL), please let me know, and I will adjust the plan.
