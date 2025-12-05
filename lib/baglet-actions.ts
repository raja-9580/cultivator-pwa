
import { BagletStatus } from './types';

interface UpdateStatusParams {
  bagletId: string;
  batchId: string;
  currentStatus: BagletStatus;
  newStatus: BagletStatus;
  notes?: string;
  user?: string;
}

/**
 * Reusable function to update baglet status and log the history.
 * Executes within a transaction context if provided, or creates a new transaction.
 */
export async function updateBagletStatusWithLog(
  sql: any, // Using any for Neon client type to avoid strict typing issues with serverless driver
  params: UpdateStatusParams
) {
  const { bagletId, batchId, currentStatus, newStatus, notes, user } = params;

  // We assume the caller is handling the transaction scope if they pass a transaction object,
  // but the neon driver's `transaction` method works by passing a list of queries.
  // So to be reusable in both single and bulk contexts (where bulk is already in a loop inside a transaction),
  // we need to return the queries so they can be executed by the caller, OR execute them directly.

  // However, the cleanest way for the SINGLE update (which is our target) is to just run the transaction here.
  // For the BULK update later, we might need to adjust this to return the query objects.

  // For now, let's implement this specifically for the "Single Update" use case as requested,
  // ensuring it encapsulates the logic we just wrote.

  return await sql.transaction([
    sql`
      UPDATE baglet
      SET 
        current_status = ${newStatus},
        status_updated_at = NOW()
      WHERE baglet_id = ${bagletId}
    `,
    sql`
      INSERT INTO baglet_status_log (
        baglet_id, 
        batch_id, 
        previous_status, 
        status, 
        notes, 
        logged_by
      ) VALUES (
        ${bagletId}, 
        ${batchId}, 
        ${currentStatus}, 
        ${newStatus}, 
        ${notes || null}, 
        ${user || 'system'}
      )
    `
  ]);
}
