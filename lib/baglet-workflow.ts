import { BagletStatus } from './types';

/**
 * Initial status for newly created baglets.
 * Shared configuration for Batch Planning and Ad-hoc Baglet Addition.
 */
export const INITIAL_BAGLET_STATUS = BagletStatus.PLANNED;

/**
 * Preparation transition configuration for single baglet operations.
 * Used by frontend (BatchPreparationGrid).
 */
export const PREPARATION_TRANSITION = {
    from: BagletStatus.PLANNED,
    to: BagletStatus.PREPARED,
};

/**
 * Sterilization transition configuration for bulk batch operations.
 * Used by both backend (updateBatchStatus) and frontend (batch detail page).
 */
export const STERILIZATION_TRANSITION = {
    from: BagletStatus.PREPARED,
    to: BagletStatus.STERILIZED,
};

/**
 * Inoculation transition configuration for bulk batch operations.
 * Used by both backend (updateBatchStatus) and frontend (batch detail page).
 */
export const INOCULATION_TRANSITION = {
    from: BagletStatus.STERILIZED,
    to: BagletStatus.INOCULATED,
};

/**
 * Centralized mapping of bulk batch actions to their status transitions.
 * This eliminates the need for if/else ladders in the backend.
 */
export const BATCH_ACTIONS = {
    sterilize: STERILIZATION_TRANSITION,
    inoculate: INOCULATION_TRANSITION,
} as const;

export const BAGLET_TRANSITIONS: Record<BagletStatus, BagletStatus[]> = {
    [BagletStatus.NONE]: [BagletStatus.PLANNED],
    [BagletStatus.PLANNED]: [BagletStatus.PREPARED, BagletStatus.DELETED],
    [BagletStatus.PREPARED]: [BagletStatus.STERILIZED, BagletStatus.DELETED],
    [BagletStatus.STERILIZED]: [BagletStatus.INOCULATED, BagletStatus.DAMAGED, BagletStatus.DELETED],
    [BagletStatus.INOCULATED]: [BagletStatus.INCUBATED, BagletStatus.CONTAMINATED, BagletStatus.DELETED],
    [BagletStatus.INCUBATED]: [BagletStatus.PINNED, BagletStatus.CONTAMINATED, BagletStatus.DELETED],
    [BagletStatus.PINNED]: [BagletStatus.HARVESTED, BagletStatus.CONTAMINATED],
    [BagletStatus.HARVESTED]: [BagletStatus.REHARVESTED_1, BagletStatus.DISPOSED, BagletStatus.CONTAMINATED],
    [BagletStatus.REHARVESTED_1]: [BagletStatus.REHARVESTED_2, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REHARVESTED_2]: [BagletStatus.REHARVESTED_3, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REHARVESTED_3]: [BagletStatus.REHARVESTED_4, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REHARVESTED_4]: [BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.CONTAMINATED]: [BagletStatus.CRC_ANALYZED, BagletStatus.DISPOSED],
    [BagletStatus.CRC_ANALYZED]: [BagletStatus.DISPOSED],
    [BagletStatus.DAMAGED]: [BagletStatus.DISPOSED],
    [BagletStatus.DISPOSED]: [BagletStatus.RECYCLED],
    [BagletStatus.RECYCLED]: [], // End of life
    [BagletStatus.DELETED]: [], // End of life
};

/**
 * Returns the list of valid next statuses for a given current status.
 */
export function getAvailableTransitions(currentStatus: BagletStatus): BagletStatus[] {
    return BAGLET_TRANSITIONS[currentStatus] || [];
}

/**
 * Validates if a transition from currentStatus to nextStatus is allowed.
 */
export function validateTransition(currentStatus: BagletStatus, nextStatus: BagletStatus): boolean {
    const allowed = BAGLET_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(nextStatus) : false;
}

/**
 * Statuses that indicate a baglet is no longer active in the production line.
 * These are ignored when calculating batch progress (e.g., preparation %, sterilization %).
 */
export const TERMINAL_STATUSES = [
    BagletStatus.DELETED,
    BagletStatus.CONTAMINATED,
    BagletStatus.CRC_ANALYZED,
    BagletStatus.DAMAGED,
    BagletStatus.DISPOSED,
    BagletStatus.RECYCLED,
] as const;

/**
 * Statuses that refer to the result of a harvest action.
 * These transitions should typically be handled by the Harvest screen (to capture weight),
 * not the generic Status Logger.
 */
export const HARVESTED_STATES = [
    BagletStatus.HARVESTED,
    BagletStatus.REHARVESTED_1,
    BagletStatus.REHARVESTED_2,
    BagletStatus.REHARVESTED_3,
    BagletStatus.REHARVESTED_4,
] as const;

/**
 * Statuses that indicate a baglet is currently growing/pinning and potentially ready for harvest.
 * Used for filtering "Ready to Harvest" lists.
 */
export const HARVEST_READY_STATUSES = [
    BagletStatus.PINNED,
    ...HARVESTED_STATES,
] as const;

/**
 * Statuses that indicate the batch has moved past the production/lab phase (Inoculation)
 * and is now in the incubation/fruiting process.
 */
export const POST_INOCULATION_STATUSES = [
    BagletStatus.INCUBATED,
    BagletStatus.PINNED,
    BagletStatus.HARVESTED,
    BagletStatus.REHARVESTED_1,
    BagletStatus.REHARVESTED_2,
    BagletStatus.REHARVESTED_3,
    BagletStatus.REHARVESTED_4,
    BagletStatus.CONTAMINATED,
    BagletStatus.DISPOSED,
    BagletStatus.RECYCLED,
] as const;

/**
 * Checks if a baglet is active (i.e., not in a terminal/ignored state).
 */
export function isBagletActive(status: BagletStatus | string): boolean {
    // Cast to BagletStatus to check against the list
    // We cast to readonly any[] to bypass the specific tuple type check since we know BagletStatus is a superset
    return !(TERMINAL_STATUSES as readonly any[]).includes(status);
}

/**
 * Calculates the total number of active baglets from a status count map.
 */
export function getActiveItemCount(statusCounts: Record<string, number>): number {
    let total = 0;
    Object.entries(statusCounts || {}).forEach(([status, count]) => {
        if (isBagletActive(status)) {
            total += count;
        }
    });
    return total;
}

// Workflow Stages for UI determination
export type BatchStage = 'PREPARE' | 'RESUME' | 'STERILIZE' | 'INOCULATE' | 'NONE';

/**
 * Get count for a specific status from a status counts map.
 * Returns 0 if statusCounts is undefined or status is not found.
 */
export function getStatusCount(
    statusCounts: Record<string, number> | undefined,
    status: BagletStatus
): number {
    return statusCounts?.[status] ?? 0;
}

/**
 * Check if batch has baglets in a specific status.
 * Returns true if count > 0.
 */
export function hasStatus(
    statusCounts: Record<string, number> | undefined,
    status: BagletStatus
): boolean {
    return getStatusCount(statusCounts, status) > 0;
}

/**
 * Check if batch has baglets in ANY of the provided statuses.
 */
export function hasAnyStatus(
    statusCounts: Record<string, number> | undefined,
    statuses: readonly BagletStatus[]
): boolean {
    if (!statusCounts) return false;
    return statuses.some(status => (statusCounts[status] ?? 0) > 0);
}

/**
 * Determines the current workflow stage for a batch based on its baglet status counts.
 * This effectively implements the "Strict Phase Gate" logic centrally.
 */
export function getBatchWorkflowStage(statusCounts: Record<string, number> | undefined): BatchStage {
    if (!statusCounts) return 'NONE';

    const planned = getStatusCount(statusCounts, INITIAL_BAGLET_STATUS);
    const prepared = getStatusCount(statusCounts, STERILIZATION_TRANSITION.from);
    const sterilized = getStatusCount(statusCounts, INOCULATION_TRANSITION.from);

    // Phase 1: Preparation (Gate: Must clear all PLANNED)
    if (planned > 0) {
        return prepared > 0 ? 'RESUME' : 'PREPARE';
    }

    // Phase 2: Sterilization (Gate: Must clear all PREPARED)
    if (prepared > 0) {
        return 'STERILIZE';
    }

    // Phase 3: Inoculation
    if (sterilized > 0) {
        return 'INOCULATE';
    }

    return 'NONE';
}
