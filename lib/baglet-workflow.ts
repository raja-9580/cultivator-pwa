import { BagletStatus } from './types';

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
