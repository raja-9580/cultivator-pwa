
/**
 * Utility to calculate date ranges for filtering
 */
export type TimeRangeMode = 'active' | '1m' | '3m' | '6m' | 'all';

export interface DateRange {
    from: string;
    to: string;
}

export function calculateDateRange(mode: TimeRangeMode): DateRange {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    let from = '';

    const d = new Date();
    if (mode === '1m') {
        d.setMonth(d.getMonth() - 1);
        from = d.toISOString().split('T')[0];
    } else if (mode === '3m') {
        d.setMonth(d.getMonth() - 3);
        from = d.toISOString().split('T')[0];
    } else if (mode === '6m') {
        d.setMonth(d.getMonth() - 6);
        from = d.toISOString().split('T')[0];
    } else if (mode === 'all') {
        from = '';
    }

    return { from, to };
}
