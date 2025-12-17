import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date object to YYYY-MM-DD string strictly in IST (Indian Standard Time).
 * This ensures consistency with the database which stores IST timestamps.
 */
export function formatDateToIST(date: Date): string {
  // Force IST Timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // en-CA returns YYYY-MM-DD format directly
  return formatter.format(date);
}
