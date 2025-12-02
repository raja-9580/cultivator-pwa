import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

// Validation schema
const UpdateStatusSchema = z.object({
    action: z.enum(['sterilize', 'inoculate']),
    updated_by: z.string().email('Valid email is required'),
});

/**
 * POST /api/batches/[id]/update-status
 * Updates baglet statuses for a batch
 */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
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

        // Determine the from and to statuses based on action
        let fromStatus: string;
        let toStatus: string;

        if (action === 'sterilize') {
            fromStatus = 'Planned';
            toStatus = 'Sterilized';
        } else if (action === 'inoculate') {
            fromStatus = 'Sterilized';
            toStatus = 'Inoculated';
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // BEGIN TRANSACTION
        await sql`BEGIN`;

        try {
            // 1. Check if batch exists
            const batchCheck = await sql`
        SELECT batch_id, baglet_count
        FROM batch
        WHERE batch_id = ${batchId} AND is_deleted = FALSE
      `;

            if (batchCheck.length === 0) {
                throw new Error(`Batch not found: ${batchId}`);
            }

            // 2. Get all baglets in the required status
            const bagletsToUpdate = await sql`
        SELECT baglet_id, current_status
        FROM baglet
        WHERE batch_id = ${batchId} 
          AND current_status = ${fromStatus}
          AND is_deleted = FALSE
      `;

            if (bagletsToUpdate.length === 0) {
                throw new Error(`No baglets found in ${fromStatus} status`);
            }

            // 3. Update each baglet
            for (const baglet of bagletsToUpdate) {
                // Update baglet current_status
                await sql`
          UPDATE baglet
          SET current_status = ${toStatus},
              status_updated_at = NOW()
          WHERE baglet_id = ${baglet.baglet_id}
        `;

                // Insert status log
                await sql`
          INSERT INTO baglet_status_log (
            baglet_id, batch_id, previous_status, status,
            notes, logged_by, logged_timestamp
          ) VALUES (
            ${baglet.baglet_id}, ${batchId}, ${fromStatus}, ${toStatus},
            ${`Status updated via ${action} action`}, ${updated_by}, NOW()
          )
        `;
            }

            // COMMIT TRANSACTION
            await sql`COMMIT`;

            console.log(`✅ Updated ${bagletsToUpdate.length} baglets from ${fromStatus} to ${toStatus}`);

            // Revalidate the batch details page and the list page
            revalidatePath(`/batches/${batchId}`);
            revalidatePath('/batches');

            return NextResponse.json({
                success: true,
                updated_count: bagletsToUpdate.length,
                from_status: fromStatus,
                to_status: toStatus,
            });

        } catch (innerError: any) {
            // ROLLBACK on error
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
