# Batch Preparation Workflow & Implementation Plan

## Overview
This document outlines the implementation plan for the "Batch Preparation" phase. This phase bridges the gap between **Planning** (data entry) and **Sterilization** (physical processing).

It corresponds to the manual "Mixing & Bagging" step where substrate is prepared, measurements (pH, Moisture) are verified, and baglets are physically filled.

## 1. Domain Logic & Workflow

### 1.1 "Active" vs "Terminal" Baglets
We need to distinguish between baglets that are part of the production flow and those that have been removed.
*   **Active:** Part of the batch progress.
*   **Terminal:** Removed/Dead. Ignored in progress calculations.

**Change:**
*   Move `TERMINAL_STATUSES` to `lib/baglet-workflow.ts`.
*   Statuses: `DELETED`, `CONTAMINATED`, `CRC_ANALYZED`, `DAMAGED`, `DISPOSED`, `RECYCLED`.

### 1.2 The "Preparation" Flow
*   **Transition:** `PLANNED` → `PREPARED`.
*   **Gatekeeper:** A checklist (Ingredients, Mix, Validated).
*   **Data Capture:** Initial Metrics (Weight, Temp, Humidity, **pH**).

---

## 2. Implementation Steps

### Step 1: Workflow Refinement (Backend/Lib)
*   [ ] **Move Logic:** Move `TERMINAL_STATUSES` and `isBagletActive` to `lib/baglet-workflow.ts`.
*   [ ] **Cleanup:** Delete `lib/status-helpers.ts`.

### Step 2: Database & API
*   [ ] **Verify DB:** `baglet` table already has `latest_ph`. (Confirmed in DDL).
*   [ ] **Update API:** `POST /api/baglets/[id]/metrics`
    *   Add `ph` to Zod Schema.
    *   Add `latest_ph` to SQL UPDATE query.

### Step 3: UI - `PrepareBatchModal`
A new modal component replacing the simple "Mark Sterilized" action.

**State 1: Checklist (The Safety Gate)**
*   displayed *every time* the modal opens (even when resuming).
*   Items:
    1.  Substrate ingredients confirmed.
    2.  Moisture content verified.
    3.  pH level verified.
*   Action: "Next: Log Baglets" (Enabled only when all checked).

**State 2: Baglet Wizard (The Data Entry)**
*   Filters: Shows only baglets where `status === 'PLANNED'` AND `isActive === true`.
*   Display: "Baglet X of Y".
*   Inputs:
    *   Weight (g)
    *   Temp (°C)
    *   Humidity (%)
    *   **pH Level** (New)
*   Action "Next":
    1.  Save Metrics (API call).
    2.  Update Status to `PREPARED` (API call).
    3.  Slide to next baglet.

### Step 4: Page Integration (`BatchesPage`)
Replace the static "Mark Sterilized" button with smart logic.

**Logic (Strict Phase Gate):**
We enforce a strict sequence. A batch cannot be sterilized if any baglets are still `PLANNED`.
1.  **Preparation Phase:** If `PLANNED > 0`
    *   Action: **"Prepare Batch"** (or "Resume" if some prepared).
    *   *Constraint:* Sterilization is BLOCKED. User must prepare or delete remaining baglets.
2.  **Sterilization Phase:** If `PLANNED == 0` AND `PREPARED > 0`
    *   Action: **"Start Sterilization"**.

**Button States:**
*   **"Prepare Batch"**
    *   *Condition:* `Planned > 0` (and `Prepared == 0`)
    *   *Action:* Opens Modal (Checklist -> Wizard).
*   **"Resume Preparation"**
    *   *Condition:* `Planned > 0` (and `Prepared > 0`)
    *   *Action:* Opens Modal (Checklist -> Wizard for *remaining* items).
*   **"Start Sterilization"**
    *   *Condition:* `Planned == 0` AND `Prepared > 0`
    *   *Action:* Opens existing Sterilization logic (bulk update).

---

## 3. User Experience (UX) Notes
*   **Strict Sequencing:** The user cannot skip preparation. They cannot have a "mixed state" batch proceed to sterilization.
*   **Interruption:** If user closes modal halfway, finished baglets stay `PREPARED`. Remaining stay `PLANNED`.
*   **Resuming:** User clicks "Resume Preparation" -> Must re-confirm checklist -> Wizards starts at first `PLANNED` baglet.
*   **Visuals:** Add progress indicator (e.g., "5/20 Batches Prepared").

