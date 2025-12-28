/**
 * Date and time utilities - simple IST handling
 * Assumes all users are in IST timezone
 */

/**
 * Get current datetime in browser's local timezone
 */
export function getCurrentISTDateTime(): Date {
    return new Date();
}

/**
 * Get current datetime formatted for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export function getCurrentISTForInput(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert any Date to datetime-local input format (YYYY-MM-DDTHH:mm)
 */
export function toISTInputFormat(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get maximum allowed datetime for datetime-local input
 */
export function getMaxDateTimeForInput(): string {
    return getCurrentISTForInput();
}

/**
 * Pass datetime-local value directly (no conversion needed)
 * Database treats all timestamps as IST
 */
export function inputToISOString(input: string): string {
    return input || '';
}
