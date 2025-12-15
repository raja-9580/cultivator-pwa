
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { prepareBaglet, getBagletById } from '@/lib/baglet-actions';
import { PrepareBagletSchema } from '@/lib/validation-schemas';
import { BagletStatus } from '@/lib/types';
import { PREPARATION_TRANSITION } from '@/lib/baglet-workflow';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {


    const { id } = await context.params;
    const bagletId = id;

    try {
        const body = await request.json();

        // 1. Validate Input
        const validationResult = PrepareBagletSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { weight, temperature, humidity, ph, updated_by } = validationResult.data;

        // 2. Fetch current status
        const currentBaglet = await getBagletById(sql, bagletId);

        if (!currentBaglet) {
            return NextResponse.json({ error: 'Baglet not found' }, { status: 404 });
        }
        const currentStatus = currentBaglet.current_status as BagletStatus;

        // 3. Validate Business Rule: Must be 'PLANNED' to be 'PREPARED'
        if (currentStatus !== PREPARATION_TRANSITION.from) {
            return NextResponse.json({
                error: `Invalid transition. Baglet must be in '${PREPARATION_TRANSITION.from}' status to be prepared. Current: '${currentStatus}'`
            }, { status: 400 });
        }

        // 4. Perform Atomic Action
        await prepareBaglet(sql, {
            bagletId,
            batchId: currentBaglet.batch_id,
            currentStatus,
            user: updated_by,
            metrics: {
                weight,
                temperature,
                humidity,
                ph
            }
        });

        console.log(`✅ Atomic Preparation Complete for ${bagletId}`);

        return NextResponse.json({
            success: true,
            bagletId,
            newStatus: 'PREPARED'
        });

    } catch (error: any) {
        console.error('❌ Failed to prepare baglet:', error?.message);
        return NextResponse.json(
            { error: error?.message || 'Failed to prepare baglet' },
            { status: 500 }
        );
    }
}
