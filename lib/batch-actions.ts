
import { NeonQueryFunction } from '@neondatabase/serverless';

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

    // 4. Insert Baglet
    await sql`
        INSERT INTO baglet (
          baglet_id, batch_id, baglet_sequence,
          current_status, status_updated_at,
          contamination_flag, logged_by, logged_timestamp, is_deleted
        ) VALUES (
          ${newBagletId}, ${batchId}, ${nextSeq},
          'PLANNED', NOW(),
          FALSE, ${user}, NOW(), FALSE
        )
    `;

    // 5. Audit Log
    await sql`
        INSERT INTO baglet_status_log (
          baglet_id, batch_id, previous_status, status,
          notes, logged_by, logged_timestamp
        ) VALUES (
          ${newBagletId}, ${batchId}, NULL, 'PLANNED',
          'Added extra baglet (Material Surplus)', ${user}, NOW()
        )
    `;

    return {
        bagletId: newBagletId,
        sequence: nextSeq
    };
}
