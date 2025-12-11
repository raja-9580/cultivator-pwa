/**
 * Application-wide UI labels and copy
 * Centralized to follow DRY principle and ease future updates
 */

// ============================================================
// BATCH LABELS
// ============================================================

export const BATCH_LABELS = {
    // Actions
    PLAN_BATCH: 'Plan Batch',
    PLAN_NEW_BATCH: 'Plan New Batch',
    PREPARE_BATCH: 'Prepare Batch',
    RESUME_PREPARATION: 'Resume Preparation',
    STERILIZE_BATCH: 'Sterilize Batch',
    INOCULATE_BATCH: 'Inoculate Batch',

    // States
    PLANNING: 'Planning...',

    // Success Messages
    BATCH_PLANNED_SUCCESS: 'Batch Planned Successfully!',
    STERILIZATION_COMPLETE: (count: number) => `✅ Sterilization complete - ${count} baglets sterilized`,
    INOCULATION_COMPLETE: (count: number) => `✅ Inoculation complete - ${count} baglets inoculated`,

    // Error Messages
    FAILED_TO_PLAN_BATCH: 'Failed to plan batch',
} as const;

// ============================================================
// BAGLET LABELS
// ============================================================

export const BAGLET_LABELS = {
    MARK_STERILIZED: 'Mark Sterilized',
    MARK_INOCULATED: 'Mark Inoculated',
    ADD_BAGLET: 'Add',
} as const;

// ============================================================
// COMMON LABELS
// ============================================================

export const COMMON_LABELS = {
    DETAILS: 'Details',
    CANCEL: 'Cancel',
    DONE: 'Done',
    QR_SCAN: 'QR Scan',
} as const;
