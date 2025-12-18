# CRC (Contamination Root Cause) Implementation Guide

## Overview
This document details the implementation of the Contamination Reporting and Root Cause Analysis workflow. This feature allows Farm Assistants to flag contaminated baglets and Mycologists to perform detailed analysis (diagnosing specific pathogens like Trichoderma, Bacteria, etc.) with a re-analysis loop.

## 1. Database Schema
Updated `database/ddl.sql` to include:
*   **`contamination_catalog`**: Reference table for contamination types (Codes: `FUN01`, `BAC01`, etc.).
*   **`baglet_contamination`**: Transactional table linking baglets to one or more contamination codes. 
    *   Constraint: `UNIQUE(baglet_id, contamination_code)` to prevent duplicates.

## 2. Workflow Logic
Files modified: `lib/baglet-workflow.ts`
*   **Status Map**: Updated `CRC_ANALYZED` to allow self-transition (`CRC_ANALYZED -> CRC_ANALYZED`) to enable the re-analysis loop (adding new findings later).
*   **Logger Logic**: Added `getGeneralTransitions()` helper to exclude specialized actions (Harvest, CRC) from the generic status scanner.

## 3. Backend Implementation (API & Actions)

### Business Logic Library
*   **`lib/crc-actions.ts`** (New): Centralized logic module.
    *   `getCRCDashboard(sql)`: Fetches stats (Loss Rate, Analyzed Today) and the "Ready to Analyze" list.
    *   `validateBagletForCRC(sql, id)`: Checks if a bag is eligible (must be `CONTAMINATED` or `CRC_ANALYZED`) review using `getBagletById`.
    *   `submitCRCAnalysis(sql, data)`: Transactional function that:
        1.  Verifies baglet existence.
        2.  Upserts findings into `baglet_contamination`.
        3.  Updates status to `CRC_ANALYZED` via `updateBagletStatus`.

### Validation
*   **`lib/validation-schemas.ts`**: Added Zod schemas.
    *   `ContaminationFindingSchema`: Validates individual finding codes/notes.
    *   `SubmitCRCAnalysisSchema`: Validates the full submission payload.

### API Routes (Thin Wrappers)
*   **`app/api/crc/dashboard/route.ts`**: GET endpoint for Main Dashboard.
*   **`app/api/crc/validate/route.ts`**: GET endpoint to check baglet details before analysis.
*   **`app/api/crc/catalog/route.ts`**: GET endpoint for the Dropdown/Multi-select options.
*   **`app/api/crc/analyze/route.ts`**: POST endpoint to submit findings. Matches `SubmitCRCAnalysisSchema`.

## 4. Frontend Implementation

### CRC Main Dashboard
*   **`app/crc/page.tsx`** (New):
    *   **Theme**: Accent Purple/Neon style.
    *   **Stats Cards**: Displays "Ready Count", "Analyzed Today", and "Loss Rate %".
    *   **Action**: Scan or Search baglet ID.
    *   **List**: Shows all baglets currently in `CONTAMINATED` state waiting for analysis.

### Analysis Detail Screen
*   **`app/crc/analyze/[id]/page.tsx`** (New):
    *   **Context**: Shows Mushroom Type and Batch ID.
    *   **Form**: Dynamic Multi-select list grouped by Contamination Type (Fungal, Bacterial, Pest).
    *   **Interaction**: Users can toggle multiple bugs and add specific notes for each.
    *   **State**: Pre-fills existing findings if the bag was already analyzed (Re-analysis).

### Generic Status Logger
*   **`app/status-logger/page.tsx`**: Refactored to use `getGeneralTransitions()`. It no longer filters transitions manually, ensuring separation of concerns.

## 5. Security & Access
*   Current implementation relies on the global user context (placeholder `current-user-placeholder` in frontend).
*   API Routes check for `DATABASE_URL`.

## 6. Future Improvements
*   **Role-Based Access Control**: Restrict `analyze` route to Mycologist role.
*   **History View**: Implement `app/crc/history/page.tsx` (placeholder button currently exists).
