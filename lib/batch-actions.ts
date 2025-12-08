
import { NeonQueryFunction } from '@neondatabase/serverless';
import { PlanBatchInput } from './validation-schemas';

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
        initialStatus: 'PLANNED',
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
  initialStatus?: 'PLANNED' | 'STERILIZED' | 'INOCULATED';
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
    initialStatus = 'PLANNED',
    notes = 'Initial baglet planning',
    createdBy
  } = params;

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
    initialStatus: 'PLANNED',
    notes: 'Added extra baglet (Material Surplus)',
    createdBy: user,
  });

  return {
    bagletId: newBagletId,
    sequence: nextSeq
  };
}
