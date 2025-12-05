# Baglet Status Manager Implementation

## Overview
The Baglet Status Manager is a feature designed to track and update the lifecycle status of individual mushroom baglets. It ensures that status transitions follow a strict workflow and that every change is auditable.

## Features
1.  **Status Workflow Enforcement**: Prevents invalid state transitions (e.g., jumping from `PLANNED` to `HARVESTED` directly) using `lib/baglet-workflow.ts`.
2.  **Status Logger UI**: A dedicated page (`/status-logger`) for farm operators to:
    *   **Search** for baglets by ID.
    *   **Scan** QR codes to quickly load baglet details.
    *   **View** current status and last update time.
    *   **Update** status to the next logical step.
    *   **Add Notes** for specific updates.
3.  **Audit Logging**: Every status change is recorded in the `baglet_status_log` database table.

## Technical Implementation

### 1. Frontend (`app/status-logger/page.tsx`)
*   **Mode Selection**: Currently supports "Single" mode. "Rapid" mode is a placeholder for future bulk-scanning features.
*   **QR Scanning**: Integrates `html5-qrcode` via the `QrScanner` component.
*   **Dynamic Dropdown**: The "Next Status" dropdown is populated dynamically based on the current status using `getAvailableTransitions()`.

### 2. Backend (`app/api/baglets/[id]/status/route.ts`)
*   **Method**: `POST`
*   **Logic**:
    1.  Fetches the current baglet status and `batch_id`.
    2.  Validates the requested transition against the workflow rules.
    3.  Executes a **Database Transaction**:
        *   Updates `baglet.current_status` and `baglet.status_updated_at`.
        *   Inserts a new record into `baglet_status_log` with the `previous_status`, `new_status`, `batch_id`, and `notes`.

### 3. Workflow Logic (`lib/baglet-workflow.ts`)
*   Defines the state machine for baglet lifecycles.
*   Exports `BAGLET_TRANSITIONS` and helper functions `getAvailableTransitions` and `validateTransition`.

### 4. Reusable Actions (`lib/baglet-actions.ts`)
*   **Purpose**: Centralizes the logic for updating baglet status to avoid code duplication between single and bulk operations.
*   **Function**: `updateBagletStatusWithLog(sql, params)`
*   **Behavior**: Encapsulates the database transaction that:
    1.  Updates the `baglet` table (status + timestamp).
    2.  Inserts a record into `baglet_status_log`.
*   **Usage**: Currently used by the Single Update API (`app/api/baglets/[id]/status/route.ts`). Designed to be adopted by the Bulk Update API in the future.

## API Modifications & Impact Analysis

### Modified Endpoint: `POST /api/baglets/[id]/status`

**Changes Made:**
*   **Logic**: Added a step to fetch `batch_id` from the baglet record.
*   **Database Interaction**: Converted the simple `UPDATE` operation into a **Transaction** that performs both an `UPDATE` on the `baglet` table and an `INSERT` into the `baglet_status_log` table.

**Impact on Existing Functionality:**
*   **Backward Compatibility**: ✅ **YES**. The API request body (`{ newStatus }`) and response format remain unchanged. Any existing frontend components calling this API will continue to work without modification.
*   **New Capabilities**: The API now accepts an optional `notes` field in the request body.
*   **Dependencies**: The endpoint now strictly requires the `baglet_status_log` table to exist in the database. If this table is missing, status updates will fail (500 Error).
*   **Performance**: Negligible impact. The transaction ensures data integrity.

## Future Improvements
*   **Rapid Mode**: Implement the UI to scan multiple QR codes in succession and apply a status (e.g., "Sterilized") to all of them at once.
*   **User Auth**: Currently logs 'user' as the actor. This should be updated to use the actual logged-in user's ID once Authentication is fully integrated.
