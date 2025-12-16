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
    /** Minimum hours after PINNED status before considered ready */
    HARVEST_READY_HOURS_FROM_PIN: 48,
    /** Minimum days after previous HARVEST before considered ready again */
    HARVEST_READY_DAYS_FROM_HARVEST: 7,
} as const;

export type AppConfig = typeof APP_CONFIG;
