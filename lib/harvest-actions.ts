import { NeonQueryFunction } from '@neondatabase/serverless';
import { RecordHarvestInput } from './validation-schemas';
import { BagletStatus } from './types';
import { getBagletById } from './baglet-actions';
import { getAvailableTransitions, HARVEST_READY_STATUSES } from './baglet-workflow';
import { APP_CONFIG } from './config';

// ============================================================
// VALIDATE BAGLET FOR HARVEST
// ============================================================

export interface ValidateBagletResult {
  valid: boolean;
  baglet?: {
    id: string;
    batchId: string;
    mushroomType: string;
    currentStatus: BagletStatus;
    harvestCount: number;
    totalHarvestWeight: number;
  };
  error?: string;
}

/**
 * Validates if a baglet is ready for harvest
 * Uses shared baglet retrieval function
 */
export async function validateBagletForHarvest(
  sql: NeonQueryFunction<false, false>,
  bagletId: string
): Promise<ValidateBagletResult> {
  const baglet = await getBagletById(sql, bagletId);

  if (!baglet) {
    return { valid: false, error: 'Baglet not found' };
  }

  // Check if baglet is in a harvest-ready status (using centralized constant)
  // We need to cast the readonly array to a regular array for .includes check, or check presence manually
  const isReady = (HARVEST_READY_STATUSES as readonly string[]).includes(baglet.current_status);

  if (!isReady) {
    return {
      valid: false,
      error: `Baglet is not ready for harvest. Current status: ${baglet.current_status}`,
    };
  }

  return {
    valid: true,
    baglet: {
      id: baglet.baglet_id,
      batchId: baglet.batch_id,
      mushroomType: baglet.mushroom_name,
      currentStatus: baglet.current_status as BagletStatus,
      harvestCount: baglet.harvest_count || 0,
      totalHarvestWeight: parseFloat(baglet.total_harvest_weight_g || '0'),
    },
  };
}

// ============================================================
// HARVEST STATS
// ============================================================

export interface HarvestStats {
  readyCount: number;
  harvestedCount: number;
  harvestedWeight: number;
}

/**
 * Get harvest statistics for dashboard
 */
export async function getHarvestStats(
  sql: NeonQueryFunction<false, false>
): Promise<HarvestStats> {
  const stats = await sql`
    SELECT 
      (SELECT COUNT(*)::int FROM baglet 
       WHERE current_status = ANY(${HARVEST_READY_STATUSES})
       AND is_deleted = FALSE) as ready_count,
    
    (SELECT COUNT(*)::int FROM harvest 
     WHERE harvested_timestamp::DATE >= (now_ist()::DATE)) as harvested_count,

    (SELECT COALESCE(SUM(harvest_weight_g), 0)::float FROM harvest 
     WHERE harvested_timestamp::DATE >= (now_ist()::DATE)) as harvested_weight
  `;

  return {
    readyCount: stats[0].ready_count,
    harvestedCount: stats[0].harvested_count,
    harvestedWeight: stats[0].harvested_weight,
  };
}

// ============================================================
// READY BAGLETS LIST
// ============================================================

export interface ReadyBaglet {
  id: string;
  batchId: string;
  mushroomType: string;
  currentStatus: string;
  daysSincePinned: number;
  harvestCount: number;
}

/**
 * Get list of baglets ready for harvest
 * Uses HARVEST_MIN_DAYS from config to filter by days since pinned
 */
export async function getReadyBaglets(
  sql: NeonQueryFunction<false, false>
): Promise<ReadyBaglet[]> {
  const result = await sql`
    SELECT 
      b.baglet_id,
      b.batch_id,
      b.current_status,
      b.harvest_count,
      b.status_updated_at,
      m.mushroom_name,
      EXTRACT(DAY FROM now_ist() - b.status_updated_at) as days_since_pinned
    FROM baglet b
    JOIN batch ba ON b.batch_id = ba.batch_id
    JOIN strain s ON ba.strain_code = s.strain_code
    JOIN mushroom m ON s.mushroom_id = m.mushroom_id
    WHERE b.current_status = ANY(${HARVEST_READY_STATUSES})
      AND b.is_deleted = FALSE
      AND (
        (b.current_status = 'PINNED' AND (now_ist() - b.status_updated_at) >= ${`${APP_CONFIG.HARVEST_READY_HOURS_FROM_PIN} hours`}::interval)
        OR
        (b.current_status != 'PINNED' AND (now_ist() - b.status_updated_at) >= ${`${APP_CONFIG.HARVEST_READY_DAYS_FROM_HARVEST} days`}::interval)
      )
    ORDER BY b.status_updated_at ASC
  `;

  return result.map(row => ({
    id: row.baglet_id,
    batchId: row.batch_id,
    mushroomType: row.mushroom_name,
    currentStatus: row.current_status,
    daysSincePinned: parseInt(row.days_since_pinned) || 0,
    harvestCount: row.harvest_count || 0,
  }));
}

// ============================================================
// RECORD HARVEST
// ==============================================================

export interface RecordHarvestResult {
  harvestId: number;
  bagletId: string;
  flushNumber: number;
  weight: number;
  newStatus: BagletStatus;
}

/**
 * Records a harvest in a transaction
 * Updates baglet aggregates and status in a single atomic operation
 */
export async function recordHarvest(
  sql: NeonQueryFunction<false, false>,
  input: RecordHarvestInput
): Promise<RecordHarvestResult> {
  const { bagletId, weight, notes, harvestedBy } = input;

  await sql`BEGIN`;

  try {
    // 1. Get baglet with row lock
    const bagletResult = await sql`
      SELECT 
        baglet_id,
        batch_id,
        current_status,
        harvest_count,
        total_harvest_weight_g
      FROM baglet
      WHERE baglet_id = ${bagletId}
        AND is_deleted = FALSE
      FOR UPDATE
    `;

    if (bagletResult.length === 0) {
      throw new Error('Baglet not found');
    }

    const baglet = bagletResult[0];
    const currentStatus = baglet.current_status as BagletStatus;
    const flushNumber = (baglet.harvest_count || 0) + 1;

    // 2. Insert harvest record
    const harvestInsert = await sql`
      INSERT INTO harvest (
        baglet_id,
        batch_id,
        harvest_weight_g,
        harvested_timestamp,
        notes,
        logged_by,
        logged_timestamp
      ) VALUES (
        ${bagletId},
        ${baglet.batch_id},
        ${weight},
        now_ist(),
        ${notes || null},
        ${harvestedBy},
        now_ist()
      )
      RETURNING harvest_id
    `;

    const harvestId = harvestInsert[0].harvest_id;

    // 3. Determine next status using workflow transitions
    const availableTransitions = getAvailableTransitions(currentStatus);

    const nextStatus = availableTransitions.find(status =>
      status === BagletStatus.HARVESTED ||
      status.startsWith('REHARVESTED')
    );

    if (!nextStatus) {
      throw new Error(`No harvest transition available from status: ${currentStatus}`);
    }

    // 4. Update baglet - aggregates AND status in ONE statement
    await sql`
      UPDATE baglet
      SET 
        harvest_count = harvest_count + 1,
        total_harvest_weight_g = COALESCE(total_harvest_weight_g, 0) + ${weight},
        current_status = ${nextStatus},
        status_updated_at = now_ist()
      WHERE baglet_id = ${bagletId}
    `;

    // 5. Log status change
    await sql`
      INSERT INTO baglet_status_log (
        baglet_id,
        batch_id,
        previous_status,
        status,
        notes,
        logged_by,
        status_timestamp
      ) VALUES (
        ${bagletId},
        ${baglet.batch_id},
        ${currentStatus},
        ${nextStatus},
        ${`Harvest recorded: ${weight}g (Flush #${flushNumber})`},
        ${harvestedBy},
        now_ist()
      )
    `;

    await sql`COMMIT`;

    console.log(`✅ Recorded harvest for ${bagletId}: ${weight}g (Flush #${flushNumber})`);

    return {
      harvestId: parseInt(harvestId),
      bagletId,
      flushNumber,
      weight,
      newStatus: nextStatus,
    };
  } catch (error: any) {
    await sql`ROLLBACK`;

    // Handle unique constraint violation (duplicate harvest per day)
    if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('idx_harvest_baglet_day_unique')) {
      throw new Error(`This baglet has already been harvested today.`);
    }

    throw error;
  }
}

// ============================================================
// HARVEST HISTORY & REPORTS
// ============================================================

export interface HarvestHistoryParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  mushroomId?: string; // Optional filter
}

export interface HarvestHistoryItem {
  id: number;
  bagletId: string;
  weight: number;
  timestamp: string; // ISO string
  mushroomName: string;
  mushroomId: string;
  currentStatus: string;
  notes?: string;
  loggedBy: string;
  flushNumber: number;
  totalFlushes: number;
  bagletAverageWeight: number;
}

export interface HarvestHistorySummary {
  totalWeight: number;
  totalCount: number;
  topMushroom: string;
}

export interface HarvestHistoryResult {
  items: HarvestHistoryItem[];
  summary: HarvestHistorySummary;
}

/**
 * Retrieves harvest history with optional filters.
 * Returns both the list of records and summary stats for the filtered period.
 */
export async function getHarvestHistory(
  sql: NeonQueryFunction<false, false>,
  params: HarvestHistoryParams
): Promise<HarvestHistoryResult> {
  const { startDate, endDate, mushroomId } = params;

  if (!startDate || !endDate) {
    throw new Error('Start Date and End Date are required for fetching harvest history.');
  }



  // Base conditions
  // We use sql.raw or dynamic fragment construction if needed, but here simple conditions suffice.
  // Note: timestamps are IST wall time.

  const historyData = await sql`
    WITH filtered_harvests AS (
      SELECT 
        h.harvest_id,
        h.baglet_id,
        h.harvest_weight_g,
        h.harvested_timestamp,
        h.notes,
        h.logged_by,
        b.current_status,
        m.mushroom_name,
        (SELECT COUNT(*)::int FROM harvest h2 WHERE h2.baglet_id = h.baglet_id AND h2.harvested_timestamp <= h.harvested_timestamp) as flush_number,
        (SELECT COUNT(*)::int FROM harvest h_all WHERE h_all.baglet_id = h.baglet_id) as total_flushes,
        (SELECT COALESCE(SUM(harvest_weight_g), 0) FROM harvest h_all WHERE h_all.baglet_id = h.baglet_id) as total_baglet_weight,
        m.mushroom_id
      FROM harvest h
      LEFT JOIN baglet b ON h.baglet_id = b.baglet_id
      JOIN batch ba ON h.batch_id = ba.batch_id
      JOIN strain s ON ba.strain_code = s.strain_code
      JOIN mushroom m ON s.mushroom_id = m.mushroom_id
      WHERE 
        h.harvested_timestamp::DATE >= ${startDate}::DATE
        AND h.harvested_timestamp::DATE <= ${endDate}::DATE
        AND (${mushroomId || null}::text IS NULL OR m.mushroom_id = ${mushroomId || null})
    )
    SELECT *,
      -- Calculate aggregates over the whole filtered set (window function equivalent or separate/CTE)
      (SELECT SUM(harvest_weight_g) FROM filtered_harvests) as total_weight_sum,
      (SELECT COUNT(*) FROM filtered_harvests) as total_count,
      (SELECT mushroom_name FROM filtered_harvests GROUP BY mushroom_name ORDER BY COUNT(*) DESC LIMIT 1) as top_mushroom_name
    FROM filtered_harvests
    ORDER BY harvested_timestamp DESC
    LIMIT 3000;
  `;

  // Process results
  const items: HarvestHistoryItem[] = historyData.map(row => ({
    id: row.harvest_id,
    bagletId: row.baglet_id,
    weight: parseFloat(row.harvest_weight_g),
    timestamp: row.harvested_timestamp,
    mushroomName: row.mushroom_name,
    mushroomId: row.mushroom_id,
    currentStatus: row.current_status,
    notes: row.notes,
    loggedBy: row.logged_by,
    flushNumber: row.flush_number,
    totalFlushes: row.total_flushes || 0,
    bagletAverageWeight: (row.total_flushes > 0) ? (parseFloat(row.total_baglet_weight || '0') / row.total_flushes) : 0
  }));

  // Extract summary from first row (same for all rows due to subqueries/window nature, or null if empty)
  // If no rows, defaults to 0.
  const first = historyData[0];
  const summary: HarvestHistorySummary = {
    totalWeight: first ? parseFloat(first.total_weight_sum || '0') : 0,
    totalCount: first ? parseInt(first.total_count || '0') : 0,
    topMushroom: first?.top_mushroom_name || 'None'
  };

  return { items, summary };
}
