// Database client for Neon serverless PostgreSQL
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Database queries will fail.');
}

// Create SQL client
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export default { sql };
