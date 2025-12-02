/**
 * Application Configuration
 * Central place for app-wide constants and limits
 */

export const APP_CONFIG = {
    // Batch Creation Limits
    MAX_BAGLETS_PER_BATCH: 20,
    MIN_BAGLETS_PER_BATCH: 1,
    DEFAULT_BAGLET_COUNT: 10,

    // Farm Configuration
    DEFAULT_FARM_ID: 'FPR',

    // Pagination
    DEFAULT_PAGE_SIZE: 20,

    // API Timeouts (ms)
    API_TIMEOUT: 30000,
} as const;

export type AppConfig = typeof APP_CONFIG;
