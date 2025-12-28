import { sql } from './db';

/**
 * SQL fragment to apply current system precision (seconds/microseconds) to a manual date selection.
 * If no date is provided, it defaults to now_ist().
 * 
 * Logic: (manual_date::timestamp + (now_ist() - date_trunc('minute', now_ist())))
 * 
 * @param manualDate - The YYYY-MM-DD HH:mm string from a datetime-local input
 */
export function applySystemPrecision(manualDate: string | null | undefined) {
    return sql`COALESCE((${manualDate || null}::timestamp + (now() - date_trunc('minute', now()))), now())`;
}
