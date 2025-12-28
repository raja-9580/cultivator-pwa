
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

export function formatDate(dateString: string | Date): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Formats a date string or object into a date-time string.
 * Uses native browser localization.
 * e.g., "Nov 12, 2024, 02:30 PM"
 */
export function formatDateTime(dateString: string | Date): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}



/**
 * Formats a date string or object into a time string.
 * Uses native browser localization.
 * e.g., "02:30 PM"
 */
export function formatTime(dateString: string | Date): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
