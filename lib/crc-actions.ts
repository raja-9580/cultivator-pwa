import { BagletStatus } from './types';
import { getBagletById, updateBagletStatus, getBagletsByStatus } from './baglet-actions';
import { getActiveBatchIds } from './batch-actions';
import { SubmitCRCAnalysisInput } from './validation-schemas';
import { CRC_ELIGIBLE_STATUSES } from './baglet-workflow';

// ==========================================
// CRC DASHBOARD & STATS
// ==========================================

export interface CRCStats {
    readyCount: number;
    analyzedTodayCount: number;
    contaminationRate: number;
}

export interface ReadyBaglet {
    id: string;
    batchId: string;
    mushroomType: string;
    currentStatus: string;
    statusUpdatedAt: Date;
    timeLabel?: string;
}

export interface CRCDashboardData {
    stats: CRCStats;
    readyBaglets: ReadyBaglet[];
}

/**
 * Main dashboard action for the CRC module.
 * Orchestrates multiple data fetches in parallel for maximum performance.
 */
export async function getCRCDashboard(sql: any): Promise<CRCDashboardData> {
    // 1. Fetch independent data points in parallel
    const [readyBaglets, todayStatsResult, batchIds] = await Promise.all([
        getBagletsByStatus(sql, BagletStatus.CONTAMINATED),
        sql`
            SELECT COUNT(*)::int as count 
            FROM baglet_status_log 
            WHERE status = ${BagletStatus.CRC_ANALYZED} 
            AND logged_timestamp >= CURRENT_DATE
        `,
        getActiveBatchIds(sql)
    ]);

    // 2. Calculate Contamination Rate if active batches exist
    const contaminationRate = await calculateContaminationRate(sql, batchIds);

    return {
        stats: {
            readyCount: readyBaglets.length,
            analyzedTodayCount: todayStatsResult[0].count,
            contaminationRate: contaminationRate
        },
        readyBaglets: readyBaglets.map((b) => ({
            id: b.baglet_id,
            batchId: b.batch_id,
            currentStatus: b.current_status,
            mushroomType: b.mushroom_name,
            statusUpdatedAt: b.status_updated_at!,
            timeLabel: b.status_updated_at ? new Date(b.status_updated_at).toLocaleDateString() : 'N/A',
            fullData: b
        }))
    };
}

/**
 * Calculates a true incidence-based contamination rate for active batches.
 * 
 * LOGIC:
 * 1. Denominator (Total): The sum of 'planned_baglet_count' from the 'batch' table.
 *    This represents the total potential yield we started with.
 * 2. Numerator (Losses): The count of DISTINCT 'baglet_id' from 'baglet_status_log' 
 *    that reached the 'CONTAMINATED' status.
 * 
 * WHY THIS LOGIC:
 * Using current baglet status fails if a baglet is later deleted or disposed (it vanishes).
 * Using the status log ensures that if a baglet was EVER contaminated, it stays in 
 * the 'Loss' count for as long as its parent batch is considered 'Active'.
 */
async function calculateContaminationRate(sql: any, batchIds: string[]): Promise<number> {
    if (!batchIds || batchIds.length === 0) return 0;

    const stats = await sql`
        SELECT 
            (SELECT SUM(baglet_count)::float FROM batch WHERE batch_id = ANY(${batchIds})) as total_planned,
            (SELECT COUNT(DISTINCT baglet_id)::float 
             FROM baglet_status_log 
             WHERE batch_id = ANY(${batchIds}) 
             AND status = ${BagletStatus.CONTAMINATED}) as total_contaminated
    `;

    const total = stats[0].total_planned || 0;
    const contaminated = stats[0].total_contaminated || 0;

    return total > 0 ? (contaminated / total) * 100 : 0;
}

// ==========================================
// CRC VALIDATION & DETAILS
// ==========================================

export interface ContaminationFinding {
    contamination_code: string;
    contamination_type: string;
    contaminant: string;
    notes?: string;
}

export interface CRCValidationResult {
    baglet: {
        id: string;
        batchId: string;
        mushroomType: string;
        currentStatus: string;
        findings: ContaminationFinding[];
    } | null;
    error?: string;
}

/**
 * Validates if a baglet is eligible for CRC analysis and returns its details.
 */
export async function validateBagletForCRC(sql: any, bagletId: string): Promise<CRCValidationResult> {
    // We reuse getBagletById from baglet-actions only for basic lookup?
    // Actually, we can just do a custom join here to get exactly what we need efficiently.

    // Check Baglet Existence & Basic Info using shared helper
    const baglet = await getBagletById(sql, bagletId);

    if (!baglet) {
        return { baglet: null, error: 'Baglet not found' };
    }

    // Check Eligibility using centralized workflow configuration
    const isEligible = (CRC_ELIGIBLE_STATUSES as readonly string[]).includes(baglet.current_status);

    if (!isEligible) {
        return {
            baglet: null,
            error: `Baglet is in '${baglet.current_status}' state. Only Contaminated or Analysed bags can be processed here.`
        };
    }

    // Retrieve Findings
    const findings = await sql`
        SELECT c.contamination_code, c.contamination_type, c.contaminant, bc.notes
        FROM baglet_contamination bc
        JOIN contamination_catalog c ON bc.contamination_code = c.contamination_code
        WHERE bc.baglet_id = ${bagletId}
    `;

    return {
        baglet: {
            id: baglet.baglet_id,
            batchId: baglet.batch_id,
            mushroomType: baglet.mushroom_name,
            currentStatus: baglet.current_status,
            findings: findings
        }
    };
}

/**
 * Submits the results of a CRC analysis.
 * - Records specific contamination findings.
 * - Updates baglet status to CRC_ANALYZED.
 */
export async function submitCRCAnalysis(sql: any, data: SubmitCRCAnalysisInput) {
    const { bagletId, findings, notes, user } = data;

    await sql`BEGIN`;

    try {
        // 1. Fetch current status for the transition log
        const current = await sql`
            SELECT current_status, batch_id FROM baglet 
            WHERE baglet_id = ${bagletId} AND is_deleted = FALSE
        `;

        if (current.length === 0) throw new Error('Baglet not found');
        const { current_status, batch_id } = current[0];

        // 2. Insert Findings (Cumulative Model: Add new types or update existing notes)
        // Note: No deletions allowed to maintain historical integrity of discovered factors.
        for (const finding of findings) {
            await sql`
                INSERT INTO baglet_contamination (
                    baglet_id, contamination_code, notes, logged_by, logged_timestamp
                ) VALUES (
                    ${bagletId}, ${finding.contaminationCode}, ${finding.notes || null}, ${user || 'system'}, now_ist()
                )
                ON CONFLICT (baglet_id, contamination_code) 
                DO UPDATE SET 
                    notes = EXCLUDED.notes,
                    logged_timestamp = now_ist()
            `;
        }

        // 3. Update Status (Reuse core action)
        await updateBagletStatus(sql, {
            bagletId,
            batchId: batch_id,
            currentStatus: current_status,
            newStatus: BagletStatus.CRC_ANALYZED,
            notes: notes || 'CRC Analysis Submitted',
            user: user
        });

        await sql`COMMIT`;
    } catch (e) {
        await sql`ROLLBACK`;
        throw e;
    }
}

