
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
 * Updates a single baglet status and logs the history.
 * Creates its own transaction - use for single baglet updates.
 */
export async function updateBagletStatusWithLog(
  sql: any,
  params: UpdateStatusParams
) {
  const { bagletId, batchId, currentStatus, newStatus, notes, user } = params;

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

/**
 * Updates a single baglet status and logs the history.
 * MUST be called within an existing transaction - use for bulk updates.
 */
export async function updateBagletStatusWithLogInTransaction(
  sql: any,
  params: UpdateStatusParams
) {
  const { bagletId, batchId, currentStatus, newStatus, notes, user } = params;

  await sql`
    UPDATE baglet
    SET 
      current_status = ${newStatus},
      status_updated_at = NOW()
    WHERE baglet_id = ${bagletId}
  `;

  await sql`
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
  `;
}
