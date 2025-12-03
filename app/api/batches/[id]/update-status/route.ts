import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
    action: z.enum(['sterilize', 'inoculate']),
    updated_by: z.string().email(),
});

/**
 * POST /api/batches/[id]/update-status
 * Bulk update baglet statuses for a batch
 */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        return NextResponse.json(
            { error: 'Database configuration missing' },
            { status: 500 }
        );
    }

    const sql = neon(DATABASE_URL);
    const batchId = params.id;

    try {
        const body = await request.json();

        // Validate input
        const validationResult = UpdateStatusSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { action, updated_by } = validationResult.data;

        // Determine the from/to status based on action
        let fromStatus: string;
        let toStatus: string;

        if (action === 'sterilize') {
            fromStatus = 'PLANNED';
            toStatus = 'STERILIZED';
        } else if (action === 'inoculate') {
            fromStatus = 'STERILIZED';
            toStatus = 'INOCULATED';
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Begin transaction
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
                return NextResponse.json(
                    { error: `No baglets found in ${fromStatus} status` },
                    { status: 400 }
                );
            }

            // Update all matching baglets
            await sql`
        UPDATE baglet
        SET 
          current_status = ${toStatus},
          status_updated_at = NOW()
        WHERE batch_id = ${batchId}
          AND current_status = ${fromStatus}
          AND is_deleted = FALSE
      `;

            // Insert status logs for each baglet
            for (const baglet of bagletsToUpdate) {
                await sql`
          INSERT INTO baglet_status_log (
            baglet_id,
            batch_id,
            previous_status,
            status,
            notes,
            logged_by,
            logged_timestamp
          ) VALUES (
            ${baglet.baglet_id},
            ${batchId},
            ${fromStatus},
            ${toStatus},
            ${'Bulk status update via batch details'},
            ${updated_by},
            NOW()
          )
        `;
            }

            await sql`COMMIT`;

            console.log(`✅ Updated ${bagletsToUpdate.length} baglets from ${fromStatus} to ${toStatus}`);

            return NextResponse.json({
                success: true,
                updated_count: bagletsToUpdate.length,
                from_status: fromStatus,
                to_status: toStatus,
            });

        } catch (innerError: any) {
            await sql`ROLLBACK`;
            throw innerError;
        }

    } catch (error: any) {
        console.error('❌ Status update failed:', error?.message);
        return NextResponse.json(
            { error: error?.message || 'Failed to update status' },
            { status: 500 }
        );
    }
}
