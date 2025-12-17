// Database client for Neon serverless PostgreSQL
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in environment variables');
}

// Create SQL client
export const sql = neon(DATABASE_URL);

/**
 * Returns a SQL client, optionally configured to bypass cache.
 * @param forceRefresh If true, returns a client with cache: 'no-store'
 */
export function getSql(forceRefresh = false) {
  if (forceRefresh) {
    return neon(DATABASE_URL!, {
      fetchOptions: { cache: 'no-store' }
    });
  }
  return sql;
}

export default { sql, getSql };
