
import { BagletStatus } from './types';
import { INITIAL_BAGLET_STATUS } from './baglet-workflow';

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
      status_updated_at = now_ist()
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


interface UpdateMetricsParams {
  bagletId: string;
  weight?: number;
  temperature?: number;
  humidity?: number;
  ph?: number;
}

/**
 * Updates baglet physical metrics.
 * Uses COALESCE strategy to only update provided fields.
 */
export async function updateBagletMetrics(
  sql: any,
  params: UpdateMetricsParams
) {
  const { bagletId, weight, temperature, humidity, ph } = params;

  await sql`
    UPDATE baglet
    SET 
      latest_weight_g = COALESCE(${weight}::numeric, latest_weight_g),
      latest_temp_c = COALESCE(${temperature}::numeric, latest_temp_c),
      latest_humidity_pct = COALESCE(${humidity}::numeric, latest_humidity_pct),
      latest_ph = COALESCE(${ph}::numeric, latest_ph),
      logged_timestamp = now_ist() 
    WHERE baglet_id = ${bagletId}
  `;
}


interface PrepareBagletParams {
  bagletId: string;
  batchId: string;
  currentStatus: BagletStatus;
  user?: string;
  metrics: {
    weight?: number;
    temperature?: number;
    humidity?: number;
    ph?: number;
  };
}

/**
 * Atomically prepares a baglet:
 * 1. Updates metrics (weights, pH, etc)
 * 2. Updates status to PREPARED
 * 3. Logs the action
 */
export async function prepareBaglet(
  sql: any,
  params: PrepareBagletParams
) {
  const { bagletId, batchId, currentStatus, user, metrics } = params;

  // Transaction managed by caller or we can start one if sql is a pool
  // But standard pattern here is caller handles transaction or we assume unsafe context if not passed explicit transaction object.
  // Ideally, this function manages the transaction for atomicity.

  await sql`BEGIN`;

  try {
    // 1. Update Metrics
    await updateBagletMetrics(sql, {
      bagletId,
      ...metrics
    });

    // 2. Update Status to PREPARED
    await updateBagletStatus(sql, {
      bagletId,
      batchId,
      currentStatus,
      newStatus: 'PREPARED' as BagletStatus, // Hardcoded as this is 'prepareBaglet'
      notes: 'Batch Preparation: Metrics logged',
      user
    });

    await sql`COMMIT`;
  } catch (error) {
    await sql`ROLLBACK`;
    throw error;
  }
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
  latest_temp_c?: number | null;
  latest_humidity_pct?: number | null;
  latest_ph?: number | null;
  logged_by?: string;
  logged_timestamp?: Date;
}

// ============================================================
// SHARED RETRIEVAL HELPERS (Private)
// ============================================================

/**
 * Base query helper to ensure all baglet retrieval methods return consistent data.
 */
async function _fetchBagletsDetails(
  sql: any,
  filters: {
    bagletId?: string;
    batchId?: string;
    status?: BagletStatus;
    orderBy?: string;
  }
): Promise<BagletWithDetails[]> {
  const { bagletId, batchId, status, orderBy = 'b.baglet_sequence' } = filters;

  // Use a single query with conditional filters. 
  // Combined with Neon/Next.js caching logic, this ensures consistency.
  return await sql`
    SELECT 
      b.batch_id,
      b.baglet_id,
      b.baglet_sequence,
      b.current_status,
      b.latest_weight_g as weight_in_grams,
      b.latest_temp_c,
      b.latest_humidity_pct,
      b.latest_ph,
      b.status_updated_at,
      b.logged_by,
      b.logged_timestamp,
      b.harvest_count,
      b.total_harvest_weight_g,
      m.mushroom_name,
      ba.strain_code,
      ba.substrate_id
    FROM baglet b
    JOIN batch ba ON b.batch_id = ba.batch_id
    JOIN strain s ON ba.strain_code = s.strain_code
    JOIN mushroom m ON s.mushroom_id = m.mushroom_id
    WHERE b.is_deleted = FALSE
    AND (${bagletId || null}::text IS NULL OR b.baglet_id = ${bagletId || null})
    AND (${batchId || null}::text IS NULL OR b.batch_id = ${batchId || null})
    AND (${status || null}::text IS NULL OR b.current_status = ${status || null})
    ORDER BY 
      CASE WHEN ${orderBy} = 'b.status_updated_at ASC' THEN b.status_updated_at END ASC,
      CASE WHEN ${orderBy} = 'b.baglet_sequence' THEN b.baglet_sequence END ASC
  `;
}

// ============================================================
// EXPORTED ACTIONS
// ============================================================

/**
 * Retrieves all baglets matching a specific status across all batches.
 */
export async function getBagletsByStatus(
  sql: any,
  status: BagletStatus
): Promise<BagletWithDetails[]> {
  return await _fetchBagletsDetails(sql, { status, orderBy: 'b.status_updated_at ASC' });
}

/**
 * Retrieves baglets for a batch filtered by status.
 */
export async function getBagletsByBatchAndStatus(
  sql: any,
  batchId: string,
  status?: BagletStatus
): Promise<BagletWithDetails[]> {
  return await _fetchBagletsDetails(sql, { batchId, status });
}

/**
 * Get single baglet by ID with full details.
 */
export async function getBagletById(
  sql: any,
  bagletId: string
): Promise<BagletWithDetails | null> {
  const results = await _fetchBagletsDetails(sql, { bagletId });
  return results.length > 0 ? results[0] : null;
}

// ============================================================
// BAGLET CREATION LOGIC
// ============================================================

interface CreateBagletParams {
  bagletId: string;
  batchId: string;
  bagletSequence: number;
  notes?: string;
  createdBy: string;
}

/**
 * Creates a new baglet with initial status and logs it.
 * This is a reusable helper to ensure status logging is always done.
 * 
 * @param sql - Neon SQL client
 * @param params - Baglet creation parameters
 */
export async function createBagletWithLog(
  sql: any,
  params: CreateBagletParams
): Promise<void> {
  const {
    bagletId,
    batchId,
    bagletSequence,
    notes = 'Initial baglet planning',
    createdBy
  } = params;

  // Use centralized initial status configuration
  const initialStatus = INITIAL_BAGLET_STATUS;

  // Insert baglet
  await sql`
    INSERT INTO baglet (
      baglet_id, batch_id, baglet_sequence,
      current_status, status_updated_at,
      latest_weight_g, latest_temp_c, latest_humidity_pct,
      logged_by, logged_timestamp, is_deleted
    ) VALUES (
      ${bagletId}, ${batchId}, ${bagletSequence},
      ${initialStatus}, now_ist(),
      NULL, NULL, NULL,
      ${createdBy}, now_ist(), FALSE
    )
  `;

  // Insert status log (ensures audit trail from creation)
  await sql`
    INSERT INTO baglet_status_log (
      baglet_id, batch_id, previous_status, status,
      notes, logged_by, logged_timestamp
    ) VALUES (
      ${bagletId}, ${batchId}, NULL, ${initialStatus},
      ${notes}, ${createdBy}, now_ist()
    )
  `;
}
