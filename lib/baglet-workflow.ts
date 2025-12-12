import { BagletStatus } from './types';

/**
 * Initial status for newly created baglets.
 * Shared configuration for Batch Planning and Ad-hoc Baglet Addition.
 */
export const INITIAL_BAGLET_STATUS = BagletStatus.PLANNED;

export const BAGLET_TRANSITIONS: Record<BagletStatus, BagletStatus[]> = {
    [BagletStatus.NONE]: [BagletStatus.PLANNED],
    [BagletStatus.PLANNED]: [BagletStatus.PREPARED, BagletStatus.DELETED],
    [BagletStatus.PREPARED]: [BagletStatus.STERILIZED, BagletStatus.DELETED],
    [BagletStatus.STERILIZED]: [BagletStatus.INOCULATED, BagletStatus.DAMAGED, BagletStatus.DELETED],
    [BagletStatus.INOCULATED]: [BagletStatus.INCUBATED, BagletStatus.CONTAMINATED, BagletStatus.DELETED],
    [BagletStatus.INCUBATED]: [BagletStatus.PINNED, BagletStatus.CONTAMINATED, BagletStatus.DELETED],
    [BagletStatus.PINNED]: [BagletStatus.HARVESTED, BagletStatus.CONTAMINATED],
    [BagletStatus.HARVESTED]: [BagletStatus.REPINNED_1, BagletStatus.DISPOSED, BagletStatus.CONTAMINATED],
    [BagletStatus.REPINNED_1]: [BagletStatus.REHARVESTED_1, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REHARVESTED_1]: [BagletStatus.REPINNED_2, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REPINNED_2]: [BagletStatus.REHARVESTED_2, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REHARVESTED_2]: [BagletStatus.REPINNED_3, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REPINNED_3]: [BagletStatus.REHARVESTED_3, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REHARVESTED_3]: [BagletStatus.REPINNED_4, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
    [BagletStatus.REPINNED_4]: [BagletStatus.REHARVESTED_4, BagletStatus.CONTAMINATED, BagletStatus.DISPOSED],
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
 * Statuses that indicate a baglet is currently growing/pinning and potentially ready for harvest.
 * Used for filtering "Ready to Harvest" lists.
 */
export const HARVEST_READY_STATUSES = [
    BagletStatus.PINNED,
    BagletStatus.REPINNED_1,
    BagletStatus.REPINNED_2,
    BagletStatus.REPINNED_3,
    BagletStatus.REPINNED_4,
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
 * Determines the current workflow stage for a batch based on its baglet status counts.
 * This effectively implements the "Strict Phase Gate" logic centrally.
 */
export function getBatchWorkflowStage(statusCounts: Record<string, number> | undefined): BatchStage {
    if (!statusCounts) return 'NONE';

    const planned = statusCounts['PLANNED'] ?? 0;
    const prepared = statusCounts['PREPARED'] ?? 0;
    const sterilized = statusCounts['STERILIZED'] ?? 0;

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
