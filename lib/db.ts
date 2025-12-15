// Database client for Neon serverless PostgreSQL
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in environment variables');
}

// Create SQL client
export const sql = neon(DATABASE_URL);

export default { sql };
