import { BagletStatus } from './types';
import { INITIAL_BAGLET_STATUS } from './baglet-workflow';
import { APP_CONFIG } from './config';

interface UpdateStatusParams {
  bagletId: string;
  batchId: string;
  currentStatus: BagletStatus;
  newStatus: BagletStatus;
  notes?: string;
  user?: string;
  skipCalculation?: boolean;
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

  if (!params.skipCalculation) {
    // Fire-and-forget calculation check (don't await to keep UI snappy)
    checkAndCalculateExpansionRatio(sql, batchId).catch(err =>
      console.error('Failed to calculate expansion ratio:', err)
    );
  }
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

  // Fetch batchId for the baglet to run calculation
  // (Optimization: We could pass batchId if caller knows it, but fetching ensures safety)
  try {
    const b = await sql`SELECT batch_id FROM baglet WHERE baglet_id = ${bagletId}`;
    if (b.length > 0) {
      checkAndCalculateExpansionRatio(sql, b[0].batch_id).catch(err =>
        console.error('Failed to calculate expansion ratio:', err)
      );
    }
  } catch (e) {
    console.warn('Could not trigger expansion calc for metrics update', e);
  }
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
  prepared_date: Date;
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
    startDate?: string;
    endDate?: string;
    mushroomType?: string;
    orderBy?: string;
    limit?: number;
  }
): Promise<BagletWithDetails[]> {
  const {
    bagletId,
    batchId,
    status,
    startDate,
    endDate,
    mushroomType,
    orderBy = 'b.logged_timestamp DESC',
    limit
  } = filters;

  return await sql`
    SELECT 
      b.batch_id,
      b.baglet_id as id,
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
      ba.substrate_id,
      ba.prepared_date
    FROM baglet b
    JOIN batch ba ON b.batch_id = ba.batch_id
    JOIN strain s ON ba.strain_code = s.strain_code
    JOIN mushroom m ON s.mushroom_id = m.mushroom_id
    WHERE b.is_deleted = FALSE
    AND (${bagletId || null}::text IS NULL OR b.baglet_id = ${bagletId || null})
    AND (${batchId || null}::text IS NULL OR b.batch_id = ${batchId || null})
    AND (${status || null}::text IS NULL OR b.current_status = ${status || null})
    AND (${startDate || null}::date IS NULL OR ba.prepared_date >= ${startDate || null}::date)
    AND (${endDate || null}::date IS NULL OR ba.prepared_date <= ${endDate || null}::date)
    AND (${mushroomType || null}::text IS NULL OR m.mushroom_name = ${mushroomType || null})
    ORDER BY 
      CASE WHEN ${orderBy} = 'ba.prepared_date ASC' THEN ba.prepared_date END ASC,
      CASE WHEN ${orderBy} = 'ba.prepared_date DESC' THEN ba.prepared_date END DESC,
      CASE WHEN ${orderBy} = 'b.status_updated_at DESC' THEN b.status_updated_at END DESC,
      CASE WHEN ${orderBy} = 'b.baglet_sequence' THEN b.baglet_sequence END ASC
    LIMIT ${limit || null}
  `;
}

// ============================================================
// EXPORTED ACTIONS
// ============================================================

/**
 * Searches for baglets within specific date ranges.
 */
export async function searchBaglets(
  sql: any,
  params: {
    startDate?: string;
    endDate?: string;
  }
): Promise<BagletWithDetails[]> {
  return await _fetchBagletsDetails(sql, { ...params, orderBy: 'b.status_updated_at DESC' });
}

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

/**
 * Get all status changes for a specific baglet.
 */
export async function getBagletStatusHistory(
  sql: any,
  bagletId: string
) {
  return await sql`
    SELECT 
      status as status,
      previous_status as previousStatus,
      notes,
      logged_by as loggedBy,
      status_timestamp as timestamp
    FROM baglet_status_log
    WHERE baglet_id = ${bagletId}
    ORDER BY status_timestamp DESC
  `;
}

/**
 * Get all harvest records for a specific baglet.
 */
export async function getBagletHarvests(
  sql: any,
  bagletId: string
) {
  return await sql`
    SELECT 
      harvest_id as id,
      harvest_weight_g as weight,
      harvested_timestamp as date,
      notes,
      logged_by as loggedBy
    FROM harvest
    WHERE baglet_id = ${bagletId}
    ORDER BY harvested_timestamp DESC
  `;
}

/**
 * Get all contamination findings for a specific baglet.
 */
export async function getBagletContaminationFindings(
  sql: any,
  bagletId: string
) {
  return await sql`
    SELECT 
      c.contamination_code as code, 
      c.contamination_type as type, 
      c.contaminant, 
      bc.notes,
      bc.logged_by as loggedBy,
      bc.logged_timestamp as timestamp
    FROM baglet_contamination bc
    JOIN contamination_catalog c ON bc.contamination_code = c.contamination_code
    WHERE bc.baglet_id = ${bagletId}
    ORDER BY bc.logged_timestamp DESC
  `;
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

/**
 * Checks if batch preparation is complete and calculates the actual expansion ratio.
 * Triggered on every baglet update.
 * 
 * Logic:
 * 1. Checks if 0 baglets remain in 'PLANNED' status.
 * 2. Sums weights of ALL baglets in the batch (including deleted/damaged).
 * 3. Calculates 'Dry Input' based on original plan and expected ratio.
 * 4. Derives 'Actual Ratio' = Total Actual Weight / Total Dry Input.
 * 5. Updates the batch record.
 */
export async function checkAndCalculateExpansionRatio(
  sql: any,
  batchId: string
): Promise<void> {

  // 1. Fetch baglet data (Status check + Weights) in ONE query
  const baglets = await sql`
    SELECT current_status, latest_weight_g
    FROM baglet
    WHERE batch_id = ${batchId}
      AND is_deleted = FALSE
  `;

  // Check if any remain PLANNED
  const hasPlanned = baglets.some((b: any) => b.current_status === 'PLANNED');

  if (hasPlanned) {
    return;
  }

  // Filter for valid weights
  const weighedBaglets = baglets.filter((b: any) => b.latest_weight_g !== null);

  if (weighedBaglets.length === 0) {
    return;
  }

  // 3. Fetch Batch Planning Details & Substrate Ratio (Joined)
  const batchData = await sql`
     SELECT 
       b.baglet_count, 
       b.baglet_weight_g, 
       b.substrate_id,
       s.expected_expansion_ratio
     FROM batch b
     LEFT JOIN substrate s ON b.substrate_id = s.substrate_id
     WHERE b.batch_id = ${batchId}
  `;
  const batch = batchData[0];
  const expectedRatio = parseFloat(batch.expected_expansion_ratio || APP_CONFIG.DEFAULT_EXPANSION_RATIO);


  // 5. Calculate Metrics
  const totalActualWeightG = weighedBaglets.reduce((sum: number, b: any) => sum + parseFloat(b.latest_weight_g), 0);
  const totalActualWeightKg = totalActualWeightG / 1000;

  // Dry Input = (Target Wet Weight) / (Expected Ratio)
  const targetBagletWeightG = batch.baglet_weight_g || APP_CONFIG.DEFAULT_BAGLET_WEIGHT_G;
  const totalTargetWetWeightKg = (batch.baglet_count * targetBagletWeightG) / 1000;
  // Protect against division by zero (though default config prevents this)
  const totalDryInputKg = totalTargetWetWeightKg / expectedRatio;

  // Actual Ratio = Actual Wet / Dry Input
  const actualExpansionRatio = totalActualWeightKg / totalDryInputKg;

  // 6. Update Batch
  await sql`
    UPDATE batch
    SET actual_expansion_ratio = ${actualExpansionRatio.toFixed(1)}
    WHERE batch_id = ${batchId}
  `;

  console.log(`✅ Calculated Actual Expansion Ratio for ${batchId}: ${actualExpansionRatio.toFixed(2)}`);
}
