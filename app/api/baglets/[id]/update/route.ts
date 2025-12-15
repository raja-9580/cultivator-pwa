import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { updateBagletMetrics } from '@/lib/baglet-actions';
import { UpdateBagletMetricsSchema } from '@/lib/validation-schemas';

// POST /api/baglets/[id]/update
// Updates metrics for an existing baglet (Correction / Edit Mode)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    if (!sql) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    try {
        const body = await request.json();

        // 1. Zod Validation
        const validation = UpdateBagletMetricsSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid data', details: validation.error.format() },
                { status: 400 }
            );
        }

        const { weight, temperature, humidity, ph } = validation.data;

        // 2. Execute Action (Atomic Single Update)
        // No transaction needed for single table update
        await updateBagletMetrics(sql, {
            bagletId: id,
            weight,
            temperature,
            humidity,
            ph
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating baglet metrics:', error);
        return NextResponse.json(
            { error: 'Failed to update baglet metrics' },
            { status: 500 }
        );
    }
}
