# Harvest History Implementation Progress (Dec 2025)

## Overview
This document summarizes the implementation of the Harvest History feature, covering the UI, backend logic, and database seeding strategy. The goal was to provide a comprehensive, filterable view of harvest records with dynamic statistics.

## Key Features Implemented

1.  **Time Range Filters**:
    *   **1M / 3M / 6M**: Fetches data from the server for the last 1, 3, or 6 months.
    *   Replaced the initial "Active Batches" filter for simpler time-based navigation.

2.  **Client-Side Filtering**:
    *   **Mushroom Type**: Filter records by specific mushroom variety (e.g., Pink Oyster, Grey Oyster). derived dynamically from the fetched data.
    *   **Specific Date**: Filter records by a single specific date.
    *   **Dynamic Stats**: Top Summary Cards (Yield, Count, Variety) now **recalculate instantaneously** based on these client-side filters.

3.  **Grouping Modes**:
    *   **Day**: Groups harvests by specific date.
    *   **Week**: Groups harvests by week (showing Mon-Sun range).
    *   **Month**: Groups harvests by Month + Year.
    *   **Collapsible**: All groups are collapsible, defaulting to expanded or collapsed (current behavior: collapsed by default logic was requested, currently implementation resets to collapsed on filter change).

4.  **Data Integrity & Variety**:
    *   Ensured test data contains multiple mushroom strains (Pink, Grey, Elm, etc.) using a Round-Robin seeding strategy.
    *   Resolved "Static Stats" issue where cards didn't reflect filters.
    *   Resolved "Grey Oyster Only" issue caused by caching and random seeding.

## Files Modified & Content

### 1. `app/harvest/history/page.tsx` (Frontend)
*   **State Management**:
    *   `filterMode` ('1m', '3m', '6m'): Controls API fetch parameters.
    *   `selectedMushroom` / `selectedDate`: Controls client-side filtering.
    *   `groupedItems`: Memoized logic to group raw items by Day/Week/Month.
    *   `filteredStats`: Memoized logic to calculate Total Yield, Count, and Top Variety from the *filtered* dataset.
*   **Rendering**:
    *   Refactored Stats Cards to use `filteredStats`.
    *   Added Cache-Busting (`_t=${Date.now()}`) to the API fetch to prevent stale data.
    *   Implemented Filter Pills (Mushroom Types) and Date Input.

### 2. `lib/harvest-actions.ts` (Backend Logic)
*   **`getHarvestHistory` Function**:
    *   **Refactored Query**: Changed the SQL JOIN path to `harvest -> batch` directly, instead of `harvest -> baglet -> batch`. This ensures reliable Strain/Mushroom info even if unexpected baglet states exist.
    *   **Left Join on Baglet**: Changed `JOIN baglet` to `LEFT JOIN` to ensure harvest history is preserved even if the associated baglet is deleted/disposed.
    *   **Removed Legacy Filters**: Removed the broken `activeOnly` logic that tried to reference non-existent batch status columns.

### 3. `database/seed_harvest_test.sql` (Test Data)
*   **Round-Robin Seeding**:
    *   Modified the seed script to cycle through ALL available strains in the `strain` table (Pink, Grey, etc.) sequentially (Modulus operator) instead of Random.
    *   This guarantees that every test run generates a diverse dataset, essential for verifying the dashboard's variety.

### 4. `app/api/harvest/history/route.ts` (API Endpoint)
*   **Parameter Handling**:
    *   Accepts `startDate` and `activeOnly` (legacy/default false) from search params.
    *   Calls `getHarvestHistory`.

## Known Issues / To-Do
*   **Mobile Layout**: User reported layout issues on mobile (specifics pending screenshot/review).
*   **Review**: User mentioned "lots of issues" remaining. A visual review of the UI spacing, alignment, and responsiveness is recommended after the break.
*   **Date UTC/IST**: Ensure date filtering (client side string match) perfectly aligns with Server side timestamps (IST). Currently checks `startsWith` on ISO string/Timestamp string.

## How to Resume
1.  **Verify Data**: Run `database/cleanup_harvest_test.sql` then `database/seed_harvest_test.sql` to get a fresh, varied dataset.
2.  **Generate History**: Run `database/seed_harvest_history.sql` to populate harvest records.
3.  **Test UI**: Navigate to `/harvest/history`, toggle filters, and check mobile responsiveness.
