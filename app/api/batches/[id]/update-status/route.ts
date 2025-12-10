import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { UpdateBatchStatusSchema } from '@/lib/validation-schemas';
import { updateBatchStatus } from '@/lib/batch-actions';

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
        const validationResult = UpdateBatchStatusSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        // Delegate to business logic
        const result = await updateBatchStatus(sql, batchId, validationResult.data);

        return NextResponse.json({
            success: true,
            ...result,
        });

    } catch (error: any) {
        console.error('❌ Status update failed:', error?.message);
        return NextResponse.json(
            { error: error?.message || 'Failed to update status' },
            { status: 500 }
        );
    }
}
