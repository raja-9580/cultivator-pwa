import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { BagletStatus } from '@/lib/types';
import { validateTransition } from '@/lib/baglet-workflow';
import { updateBagletStatus } from '@/lib/baglet-actions';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const sql = neon(DATABASE_URL);
    const bagletId = params.id;

    try {
        const body = await request.json();
        const { newStatus } = body;

        if (!newStatus) {
            return NextResponse.json({ error: 'New status is required' }, { status: 400 });
        }

        // 1. Fetch current status and batch_id (needed for logging)
        const currentData = await sql`
      SELECT current_status, batch_id 
      FROM baglet 
      WHERE baglet_id = ${bagletId}
    `;

        if (currentData.length === 0) {
            return NextResponse.json({ error: 'Baglet not found' }, { status: 404 });
        }

        const currentStatus = currentData[0].current_status as BagletStatus;
        const batchId = currentData[0].batch_id;

        // 2. Validate Transition
        const isValid = validateTransition(currentStatus, newStatus as BagletStatus);

        if (!isValid) {
            return NextResponse.json({
                error: `Invalid transition from ${currentStatus} to ${newStatus}`,
                currentStatus,
                requestedStatus: newStatus
            }, { status: 400 });
        }

        // 3. Update Status in Database & Log (Using Transaction)
        await sql`BEGIN`;
        try {
            await updateBagletStatus(sql, {
                bagletId,
                batchId,
                currentStatus,
                newStatus: newStatus as BagletStatus,
                notes: body.notes,
                user: 'user' // TODO: Replace with actual user
            });
            await sql`COMMIT`;
        } catch (txError) {
            await sql`ROLLBACK`;
            throw txError;
        }

        console.log(`✅ Updated baglet ${bagletId} status: ${currentStatus} -> ${newStatus}`);

        return NextResponse.json({
            success: true,
            bagletId,
            oldStatus: currentStatus,
            newStatus
        });

    } catch (error: any) {
        console.error('❌ Failed to update baglet status:', error?.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
