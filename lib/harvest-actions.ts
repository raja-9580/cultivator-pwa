import { NeonQueryFunction } from '@neondatabase/serverless';
import { RecordHarvestInput } from './validation-schemas';
import { BagletStatus } from './types';
import { getBagletById } from './baglet-actions';
import { getAvailableTransitions } from './baglet-workflow';

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

    // Check if baglet is in a harvest-ready status
    const readyStatuses = [
        BagletStatus.PINNED,
        BagletStatus.REPINNED_1,
        BagletStatus.REPINNED_2,
        BagletStatus.REPINNED_3,
        BagletStatus.REPINNED_4,
    ];

    if (!readyStatuses.includes(baglet.current_status as BagletStatus)) {
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
// RECORD HARVEST
// ============================================================

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
        NOW(),
        ${notes || null},
        ${harvestedBy},
        NOW()
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
        status_updated_at = NOW()
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
        NOW()
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
        throw error;
    }
}
