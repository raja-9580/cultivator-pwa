/**
 * Application Configuration
 * Central place for app-wide constants and limits
 */

export const APP_CONFIG = {
    // Batch Creation Limits
    MAX_BAGLETS_PER_BATCH: 20,
    MIN_BAGLETS_PER_BATCH: 1,
    DEFAULT_BAGLET_COUNT: 10,
    DEFAULT_BAGLET_WEIGHT_G: 2500,

    // Farm Configuration
    DEFAULT_FARM_ID: 'FPR',

    // Pagination
    DEFAULT_PAGE_SIZE: 20,

    // API Timeouts (ms)
    API_TIMEOUT: 30000,

    // Harvest Settings
    /** Minimum days since PINNED to show in ready list (0 = all) */
    HARVEST_MIN_DAYS: 0,
} as const;

export type AppConfig = typeof APP_CONFIG;
