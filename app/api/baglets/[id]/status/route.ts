import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { BagletStatus } from '@/lib/types';
import { validateTransition } from '@/lib/baglet-workflow';

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

        // 1. Fetch current status
        const currentData = await sql`
      SELECT current_status 
      FROM baglet 
      WHERE baglet_id = ${bagletId}
    `;

        if (currentData.length === 0) {
            return NextResponse.json({ error: 'Baglet not found' }, { status: 404 });
        }

        const currentStatus = currentData[0].current_status as BagletStatus;

        // 2. Validate Transition
        const isValid = validateTransition(currentStatus, newStatus as BagletStatus);

        if (!isValid) {
            return NextResponse.json({
                error: `Invalid transition from ${currentStatus} to ${newStatus}`,
                currentStatus,
                requestedStatus: newStatus
            }, { status: 400 });
        }

        // 3. Update Status in Database
        // We update the baglet table AND insert a log entry (if you have a history table, otherwise just update)
        // Assuming a simple update for now, but ideally we should log this.

        await sql`
      UPDATE baglet
      SET 
        current_status = ${newStatus},
        status_updated_at = NOW()
      WHERE baglet_id = ${bagletId}
    `;

        // TODO: Insert into status_log table if it exists
        // await sql`INSERT INTO status_log ...`

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
