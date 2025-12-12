
import { NeonQueryFunction } from '@neondatabase/serverless';
import { PlanBatchInput, UpdateBatchStatusInput } from './validation-schemas';
import { BatchListItem, BatchDetails, BagletStatus } from './types';
import { updateBagletStatus } from './baglet-actions';
import { INITIAL_BAGLET_STATUS, BATCH_ACTIONS } from './baglet-workflow';

// ============================================================
// BATCH RETRIEVAL LOGIC
// ============================================================


/**
 * Retrieves all batches with baglet counts and status distribution.
 * This is the core business logic for batch listing.
 * 
 * @param sql - Neon SQL client
 * @returns Array of batches with computed fields
 * @throws Error if query fails
 */
export async function getAllBatches(
  sql: NeonQueryFunction<false, false>
): Promise<BatchListItem[]> {
  const batchesData = await sql`
    SELECT 
      b.batch_id,
      b.farm_id,
      b.prepared_date,
      b.batch_sequence,
      b.substrate_id,
      b.strain_code,
      b.baglet_count,
      b.logged_timestamp,
      f.farm_name,
      s.substrate_name,
      st.strain_code,
      m.mushroom_name,
      -- Subquery for actual baglet count
      (SELECT COUNT(*) FROM baglet WHERE batch_id = b.batch_id AND is_deleted = FALSE) as actual_baglet_count,
      -- Subquery for status distribution
      (
        SELECT json_object_agg(current_status, count)
        FROM (
          SELECT current_status, COUNT(*) as count
          FROM baglet
          WHERE batch_id = b.batch_id AND is_deleted = FALSE
          GROUP BY current_status
        ) t
      ) as baglet_status_counts
    FROM batch b
    LEFT JOIN farm f ON b.farm_id = f.farm_id
    LEFT JOIN substrate s ON b.substrate_id = s.substrate_id
    LEFT JOIN strain st ON b.strain_code = st.strain_code
    LEFT JOIN mushroom m ON st.mushroom_id = m.mushroom_id
    WHERE b.is_deleted = FALSE
    ORDER BY b.prepared_date DESC, b.batch_sequence DESC
  `;

  // Transform database rows to application format
  return batchesData.map((row) => ({
    id: row.batch_id,
    mushroomType: row.mushroom_name,
    substrateCode: row.substrate_id,
    substrateDescription: row.substrate_name,
    plannedBagletCount: row.baglet_count,
    actualBagletCount: parseInt(row.actual_baglet_count || '0'),
    createdDate: row.logged_timestamp,
    preparedDate: row.prepared_date,
    bagletStatusCounts: row.baglet_status_counts || {},
  }));
}


/**
 * Retrieves detailed information about a specific batch.
 * Includes substrate mix details, baglet list, and status distribution.
 * 
 * @param sql - Neon SQL client
 * @param batchId - ID of the batch to retrieve
 * @returns Complete batch details with all related data
 * @throws Error if batch not found or query fails
 */
export async function getBatchDetails(
  sql: NeonQueryFunction<false, false>,
  batchId: string
): Promise<BatchDetails> {
  // Fetch batch details with all related information
  const batchData = await sql`
    SELECT 
      b.batch_id,
      b.farm_id,
      b.prepared_date,
      b.batch_sequence,
      b.substrate_id,
      b.strain_code,
      b.baglet_count,
      b.logged_by,
      b.logged_timestamp,
      f.farm_name,
      s.substrate_name,
      st.strain_code,
      st.mushroom_id,
      m.mushroom_name,
      st.strain_vendor_id,
      sv.vendor_name,
      -- Actual baglet count
      (SELECT COUNT(*) FROM baglet WHERE batch_id = b.batch_id AND is_deleted = FALSE) as actual_baglet_count,
      -- Status distribution
      (
        SELECT json_object_agg(current_status, count)
        FROM (
          SELECT current_status, COUNT(*) as count
          FROM baglet
          WHERE batch_id = b.batch_id AND is_deleted = FALSE
          GROUP BY current_status
        ) t
      ) as baglet_status_counts
    FROM batch b
    LEFT JOIN farm f ON b.farm_id = f.farm_id
    LEFT JOIN substrate s ON b.substrate_id = s.substrate_id
    LEFT JOIN strain st ON b.strain_code = st.strain_code
    LEFT JOIN mushroom m ON st.mushroom_id = m.mushroom_id
    LEFT JOIN strain_vendor sv ON st.strain_vendor_id = sv.strain_vendor_id
    WHERE b.batch_id = ${batchId} AND b.is_deleted = FALSE
  `;

  if (batchData.length === 0) {
    throw new Error('Batch not found');
  }

  const batch = batchData[0];

  // Fetch substrate mix details - mediums
  const mediumsData = await sql`
    SELECT
      sm.medium_id,
      m.medium_name,
      sm.qty_g
    FROM substrate_medium sm
    JOIN medium m ON sm.medium_id = m.medium_id
    WHERE sm.substrate_id = ${batch.substrate_id}
    ORDER BY sm.medium_id
  `;

  const mediumsArray = mediumsData.map((m) => ({
    medium_id: m.medium_id,
    medium_name: m.medium_name,
    qty_g: parseFloat(m.qty_g || 0),
  }));

  // Fetch substrate mix details - supplements
  const supplementsData = await sql`
    SELECT
      ss.supplement_id,
      s.supplement_name,
      ss.qty,
      s.measure_type as unit
    FROM substrate_supplement ss
    JOIN supplement s ON ss.supplement_id = s.supplement_id
    WHERE ss.substrate_id = ${batch.substrate_id}
    ORDER BY ss.supplement_id
  `;

  const supplementsArray = supplementsData.map((s) => ({
    supplement_id: s.supplement_id,
    supplement_name: s.supplement_name,
    qty: parseFloat(s.qty || 0),
    unit: s.unit,
  }));

  // Calculate total mix for the batch
  const bagletCount = batch.baglet_count;
  const mediumsForBatch = mediumsArray.map((m) => ({
    ...m,
    qty_g: m.qty_g * bagletCount,
  }));

  const supplementsForBatch = supplementsArray.map((s) => ({
    ...s,
    qty: s.qty * bagletCount,
  }));

  // Fetch baglet list for this batch
  const bagletsData = await sql`
    SELECT 
      baglet_id,
      batch_id,
      baglet_sequence,
      current_status,
      status_updated_at,
      latest_weight_g,
      latest_temp_c,
      latest_humidity_pct,
      latest_ph,
      contamination_flag,
      logged_timestamp
    FROM baglet
    WHERE batch_id = ${batchId} AND is_deleted = FALSE
    ORDER BY baglet_sequence ASC
  `;

  const baglets = bagletsData.map((b) => ({
    id: b.baglet_id,
    batchId: b.batch_id,
    sequence: b.baglet_sequence,
    status: b.current_status,
    statusUpdatedAt: b.status_updated_at,
    weight: b.latest_weight_g ? parseFloat(b.latest_weight_g) : null,
    temperature: b.latest_temp_c ? parseFloat(b.latest_temp_c) : null,
    humidity: b.latest_humidity_pct ? parseFloat(b.latest_humidity_pct) : null,
    ph: b.latest_ph ? parseFloat(b.latest_ph) : null,
    contaminated: b.contamination_flag,
    createdAt: b.logged_timestamp,
  }));

  // Build and return response (flattened structure)
  return {
    id: batch.batch_id,
    farmId: batch.farm_id,
    farmName: batch.farm_name,
    preparedDate: batch.prepared_date,
    sequence: batch.batch_sequence,
    mushroomType: batch.mushroom_name,
    mushroomId: batch.mushroom_id,
    strain: {
      code: batch.strain_code,
      vendorId: batch.strain_vendor_id,
      vendorName: batch.vendor_name,
    },
    substrate: {
      id: batch.substrate_id,
      name: batch.substrate_name,
      mediums: mediumsArray,
      supplements: supplementsArray,
      mediumsForBatch,
      supplementsForBatch,
    },
    plannedBagletCount: batch.baglet_count,
    actualBagletCount: parseInt(batch.actual_baglet_count || '0'),
    bagletStatusCounts: batch.baglet_status_counts || {},
    createdBy: batch.logged_by,
    createdAt: batch.logged_timestamp,
    baglets,
  };
}

// ============================================================
// BATCH PLANNING LOGIC
// ============================================================

interface StrainInfo {
  strain_code: string;
  mushroom_name: string;
  strain_vendor_id: string;
  vendor_name: string;
}

interface SubstrateInfo {
  substrate_id: string;
  substrate_name: string;
  mediums: Array<{ medium_id: string; medium_name: string; qty_g: number }>;
  supplements: Array<{ supplement_id: string; supplement_name: string; qty: number }>;
}

interface PlanBatchResult {
  batch_id: string;
  batch_sequence: number;
  prepared_date: string;
  baglet_count: number;
  strain: StrainInfo;
  substrate: {
    substrate_id: string;
    substrate_name: string;
    mediums_per_baglet: Array<any>;
    supplements_per_baglet: Array<any>;
    mediums_for_batch: Array<any>;
    supplements_for_batch: Array<any>;
  };
  created_baglet_ids: string[];
}

/**
 * Plans a new batch with baglets in a single transaction.
 * This is the core business logic for batch planning.
 * 
 * @param sql - Neon SQL client (must be transaction-capable)
 * @param input - Validated batch input data
 * @returns Created batch details with all related information
 * @throws Error if validation fails or transaction fails
 */
export async function planBatch(
  sql: NeonQueryFunction<false, false>,
  input: PlanBatchInput
): Promise<PlanBatchResult> {
  const { farm_id, prepared_date, strain_code, substrate_id, baglet_count, created_by } = input;

  // Convert prepared_date to DATE (default to today if not provided)
  const preparedDateObj = prepared_date ? new Date(prepared_date) : new Date();
  const preparedDateStr = preparedDateObj.toISOString().split('T')[0]; // YYYY-MM-DD

  // Format date as ddmmyyyy for batch_id
  const day = String(preparedDateObj.getDate()).padStart(2, '0');
  const month = String(preparedDateObj.getMonth() + 1).padStart(2, '0');
  const year = preparedDateObj.getFullYear();
  const dateFormatted = `${day}${month}${year}`;

  // BEGIN TRANSACTION
  await sql`BEGIN`;

  try {
    // 1. Validate strain_code exists in v_strain_full
    const strainCheck = await sql`
      SELECT strain_code, mushroom_name, strain_vendor_id, vendor_name
      FROM v_strain_full
      WHERE strain_code = ${strain_code}
      LIMIT 1
    `;

    if (strainCheck.length === 0) {
      throw new Error(`Invalid strain_code: ${strain_code}`);
    }

    const strainInfo: StrainInfo = strainCheck[0] as StrainInfo;

    // 2. Validate substrate_id and get substrate mix info from v_substrate_full
    // IMPORTANT: v_substrate_full returns mediums and supplements as JSON arrays
    const substrateCheck = await sql`
      SELECT
        substrate_id,
        substrate_name,
        mediums,
        supplements
      FROM v_substrate_full
      WHERE substrate_id = ${substrate_id}
    `;

    if (substrateCheck.length === 0) {
      throw new Error(`Invalid substrate_id: ${substrate_id}`);
    }

    // Extract substrate info (view already returns JSON arrays)
    const substrateInfo: SubstrateInfo = {
      substrate_id: substrateCheck[0].substrate_id,
      substrate_name: substrateCheck[0].substrate_name,
      mediums: substrateCheck[0].mediums || [],
      supplements: substrateCheck[0].supplements || [],
    };

    // 3. Calculate batch_sequence
    const seqResult = await sql`
      SELECT COALESCE(MAX(batch_sequence), 0) + 1 AS next_sequence
      FROM batch
      WHERE farm_id = ${farm_id} AND prepared_date = ${preparedDateStr}
    `;

    const batchSequence = seqResult[0].next_sequence;

    // 4. Construct batch_id: FPR-ddmmyyyy-Bxx
    const batchId = `${farm_id}-${dateFormatted}-B${String(batchSequence).padStart(2, '0')}`;

    // 5. Insert batch
    await sql`
      INSERT INTO batch (
        batch_id, farm_id, prepared_date, batch_sequence,
        substrate_id, strain_code, baglet_count,
        logged_by, logged_timestamp, is_deleted
      ) VALUES (
        ${batchId}, ${farm_id}, ${preparedDateStr}, ${batchSequence},
        ${substrate_id}, ${strain_code}, ${baglet_count},
        ${created_by}, NOW(), FALSE
      )
    `;

    // 6. Create baglets
    const createdBagletIds: string[] = [];

    for (let i = 1; i <= baglet_count; i++) {
      const bagletSequence = i;
      const seqPadded = String(bagletSequence).padStart(3, '0');

      // Baglet ID format: {batch_id}-{strain_code}-{strain_vendor_id}-{substrate_id}-{seq}
      const bagletId = `${batchId}-${strain_code}-${strainInfo.strain_vendor_id}-${substrate_id}-${seqPadded}`;

      createdBagletIds.push(bagletId);

      // Create baglet with status log (using reusable helper)
      await createBagletWithLog(sql, {
        bagletId,
        batchId,
        bagletSequence,
        notes: 'Initial baglet planning',
        createdBy: created_by,
      });
    }

    // 7. Calculate mix summary
    const mediums_per_baglet = substrateInfo.mediums;
    const supplements_per_baglet = substrateInfo.supplements;

    const mediums_for_batch = mediums_per_baglet.map((m: any) => ({
      ...m,
      qty_g: m.qty_g * baglet_count,
    }));

    const supplements_for_batch = supplements_per_baglet.map((s: any) => ({
      ...s,
      qty: s.qty * baglet_count,
    }));

    // COMMIT TRANSACTION
    await sql`COMMIT`;

    console.log(`✅ Planned batch ${batchId} with ${baglet_count} baglets`);

    // 8. Return result
    return {
      batch_id: batchId,
      batch_sequence: batchSequence,
      prepared_date: preparedDateStr,
      baglet_count,
      strain: strainInfo,
      substrate: {
        substrate_id: substrateInfo.substrate_id,
        substrate_name: substrateInfo.substrate_name,
        mediums_per_baglet,
        supplements_per_baglet,
        mediums_for_batch,
        supplements_for_batch,
      },
      created_baglet_ids: createdBagletIds,
    };
  } catch (innerError: any) {
    // ROLLBACK on error
    await sql`ROLLBACK`;
    throw innerError;
  }
}

// ============================================================
// BAGLET MANAGEMENT LOGIC
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
async function createBagletWithLog(
  sql: NeonQueryFunction<false, false>,
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
      contamination_flag, logged_by, logged_timestamp, is_deleted
    ) VALUES (
      ${bagletId}, ${batchId}, ${bagletSequence},
      ${initialStatus}, NOW(),
      NULL, NULL, NULL,
      FALSE, ${createdBy}, NOW(), FALSE
    )
  `;

  // Insert status log (ensures audit trail from creation)
  await sql`
    INSERT INTO baglet_status_log (
      baglet_id, batch_id, previous_status, status,
      notes, logged_by, logged_timestamp
    ) VALUES (
      ${bagletId}, ${batchId}, NULL, ${initialStatus},
      ${notes}, ${createdBy}, NOW()
    )
  `;
}

interface AddBagletResult {
  bagletId: string;
  sequence: number;
}

/**
 * Adds a single extra baglet to an existing batch.
 * Handles sequence calculation, ID generation, and audit logging.
 * MUST be called within a transaction.
 */
export async function addBagletToBatch(
  sql: NeonQueryFunction<false, false>,
  batchId: string,
  user: string
): Promise<AddBagletResult> {

  // 1. Fetch Batch Context (Strain, Substrate, Current Max Seq)
  // We need strict locking or atomic update, but for now we rely on the transaction context
  const batchInfoResult = await sql`
        SELECT 
          b.batch_id,
          b.strain_code,
          b.substrate_id,
          sv.strain_vendor_id,
          (SELECT COALESCE(MAX(baglet_sequence), 0) FROM baglet WHERE batch_id = b.batch_id) as max_seq
        FROM batch b
        JOIN strain s ON b.strain_code = s.strain_code
        JOIN strain_vendor sv ON s.strain_vendor_id = sv.strain_vendor_id
        WHERE b.batch_id = ${batchId}
        FOR UPDATE OF b  -- Lock the batch row to prevent race conditions on sequence
    `;

  if (batchInfoResult.length === 0) {
    throw new Error('Batch not found');
  }

  const batchInfo = batchInfoResult[0];
  const nextSeq = batchInfo.max_seq + 1;
  const seqPadded = String(nextSeq).padStart(3, '0');

  // 2. Generate Deterministic ID
  const newBagletId = `${batchInfo.batch_id}-${batchInfo.strain_code}-${batchInfo.strain_vendor_id}-${batchInfo.substrate_id}-${seqPadded}`;

  // 3. Increment Batch Count
  await sql`
        UPDATE batch 
        SET baglet_count = baglet_count + 1 
        WHERE batch_id = ${batchId}
    `;

  // 4. Create Baglet with Status Log (using reusable helper)
  await createBagletWithLog(sql, {
    bagletId: newBagletId,
    batchId,
    bagletSequence: nextSeq,
    notes: 'Added extra baglet (Material Surplus)',
    createdBy: user,
  });

  return {
    bagletId: newBagletId,
    sequence: nextSeq
  };
}

// ============================================================
// BATCH STATUS UPDATE LOGIC
// ============================================================

interface UpdateBatchStatusResult {
  updated_count: number;
  from_status: string;
  to_status: string;
}

/**
 * Bulk update baglet statuses for a batch.
 * Follows the same transaction pattern as planBatch.
 * 
 * @param sql - Neon SQL client
 * @param batchId - ID of the batch to update
 * @param input - Validated status update input
 * @returns Update result with count and status transition
 * @throws Error if no baglets found or transaction fails
 */
export async function updateBatchStatus(
  sql: NeonQueryFunction<false, false>,
  batchId: string,
  input: UpdateBatchStatusInput
): Promise<UpdateBatchStatusResult> {
  const { action, updated_by } = input;

  // Get transition config from centralized mapping
  const transition = BATCH_ACTIONS[action];

  if (!transition) {
    throw new Error(`Invalid action: ${action}`);
  }

  const fromStatus = transition.from;
  const toStatus = transition.to;

  // BEGIN TRANSACTION
  await sql`BEGIN`;

  try {
    // Get baglets to update
    const bagletsToUpdate = await sql`
      SELECT baglet_id
      FROM baglet
      WHERE batch_id = ${batchId}
        AND current_status = ${fromStatus}
        AND is_deleted = FALSE
    `;

    if (bagletsToUpdate.length === 0) {
      await sql`ROLLBACK`;
      throw new Error(`No baglets found in ${fromStatus} status`);
    }

    // Update all matching baglets and insert status logs
    for (const baglet of bagletsToUpdate) {
      await updateBagletStatus(sql, {
        bagletId: baglet.baglet_id,
        batchId,
        currentStatus: fromStatus as BagletStatus,
        newStatus: toStatus as BagletStatus,
        notes: 'Bulk status update via batch workflow',
        user: updated_by,
      });
    }

    // COMMIT TRANSACTION
    await sql`COMMIT`;

    console.log(`✅ Updated ${bagletsToUpdate.length} baglets from ${fromStatus} to ${toStatus}`);

    return {
      updated_count: bagletsToUpdate.length,
      from_status: fromStatus,
      to_status: toStatus,
    };
  } catch (innerError: any) {
    // ROLLBACK on error
    await sql`ROLLBACK`;
    throw innerError;
  }
}

// ============================================================
// BATCH EXPORT LOGIC
// ============================================================

interface BagletQRExportData {
  batch_id: string;
  baglet_id: string;
  weight_in_grams: string | number;
  inoculated_date: string;
  mushroom_name: string;
}

/**
 * Retrieves baglet data for QR label printing export.
 * Returns data formatted for CSV/Excel with baglet details.
 * 
 * @param sql - Neon SQL client
 * @param batchId - ID of the batch to export
 * @param status - Optional baglet status filter (defaults to 'INOCULATED')
 * @returns Array of baglet data ready for QR label export
 * @throws Error if no baglets found with specified status
 */
export async function exportBagletsForQRLabels(
  sql: NeonQueryFunction<false, false>,
  batchId: string,
  status: BagletStatus = 'INOCULATED' as BagletStatus
): Promise<BagletQRExportData[]> {
  // Use reusable baglet query function
  const { getBagletsByBatchAndStatus } = await import('./baglet-actions');
  const baglets = await getBagletsByBatchAndStatus(sql, batchId, status);

  if (baglets.length === 0) {
    throw new Error(`No baglets found with status '${status}' for this batch`);
  }

  // Format data for export with user-friendly column names
  return baglets.map(b => ({
    batch_id: b.batch_id,
    baglet_id: b.baglet_id,
    weight_in_grams: b.weight_in_grams || 'NA',
    inoculated_date: b.status_updated_at
      ? new Date(b.status_updated_at).toLocaleDateString('en-US')
      : 'NA',
    mushroom_name: b.mushroom_name,
  }));
}
