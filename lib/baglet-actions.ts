
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
 * 
 * MUST be called within a transaction context (sql`BEGIN` ... sql`COMMIT`).
 * For single baglet updates, wrap in a transaction:
 * 
 * @example
 * // Single baglet update
 * await sql`BEGIN`;
 * try {
 *   await updateBagletStatus(sql, {...});
 *   await sql`COMMIT`;
 * } catch (e) {
 *   await sql`ROLLBACK`;
 * }
 * 
 * @example
 * // Bulk update (existing transaction)
 * await sql`BEGIN`;
 * for (const baglet of baglets) {
 *   await updateBagletStatus(sql, {...});
 * }
 * await sql`COMMIT`;
 */
export async function updateBagletStatus(
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

// ============================================================
// BAGLET RETRIEVAL LOGIC
// ============================================================

export interface BagletWithDetails {
  batch_id: string;
  baglet_id: string;
  baglet_sequence: number;
  current_status: string;
  weight_in_grams: number | null;
  status_updated_at: Date | null;
  mushroom_name: string;
  strain_code: string;
  substrate_id: string;
  harvest_count?: number;
  total_harvest_weight_g?: string;
}

/**
 * Retrieves baglets for a batch filtered by status.
 * Reusable core query for various workflows (harvest, QR export, status logger, etc.)
 * 
 * @param sql - Neon SQL client
 * @param batchId - ID of the batch
 * @param status - Optional status filter (if not provided, returns all active baglets)
 * @returns Array of baglets with joined details
 * 
 * @example
 * // Get all inoculated baglets for harvest workflow
 * const baglets = await getBagletsByBatchAndStatus(sql, 'FPR-10122025-B01', 'INOCULATED');
 * 
 * @example
 * // Get all baglets in a batch (no status filter)
 * const allBaglets = await getBagletsByBatchAndStatus(sql, 'FPR-10122025-B01');
 */
export async function getBagletsByBatchAndStatus(
  sql: any,
  batchId: string,
  status?: BagletStatus
): Promise<BagletWithDetails[]> {
  // Single smart query with conditional status filter
  // If status is provided, it filters; if not, the condition becomes "TRUE AND TRUE" which optimizes away
  const query = sql`
    SELECT 
      b.batch_id,
      b.baglet_id,
      b.baglet_sequence,
      b.current_status,
      b.latest_weight_g as weight_in_grams,
      b.status_updated_at,
      m.mushroom_name,
      ba.strain_code,
      ba.substrate_id
    FROM baglet b
    JOIN batch ba ON b.batch_id = ba.batch_id
    JOIN strain s ON ba.strain_code = s.strain_code
    JOIN mushroom m ON s.mushroom_id = m.mushroom_id
    WHERE b.batch_id = ${batchId}
    AND (${status === undefined} OR b.current_status = ${status})
    AND b.is_deleted = FALSE
    ORDER BY b.baglet_sequence
  `;

  return await query;
}

/**
 * Get single baglet by ID with full details including mushroom type and harvest data
 * Used by harvest validation and other single-baglet workflows
 */
export async function getBagletById(
  sql: any,
  bagletId: string
): Promise<BagletWithDetails | null> {
  const result = await sql`
    SELECT 
      b.batch_id,
      b.baglet_id,
      b.baglet_sequence,
      b.current_status,
      b.harvest_count,
      b.total_harvest_weight_g,
      b.latest_weight_g as weight_in_grams,
      b.status_updated_at,
      m.mushroom_name,
      ba.strain_code,
      ba.substrate_id
    FROM baglet b
    JOIN batch ba ON b.batch_id = ba.batch_id
    JOIN strain s ON ba.strain_code = s.strain_code
    JOIN mushroom m ON s.mushroom_id = m.mushroom_id
    WHERE b.baglet_id = ${bagletId}
      AND b.is_deleted = FALSE
  `;

  return result.length > 0 ? result[0] : null;
}
