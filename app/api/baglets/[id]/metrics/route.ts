import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { UpdateBagletMetricsSchema } from '@/lib/validation-schemas';
import { updateBagletMetrics, getBagletById } from '@/lib/baglet-actions';

// MetricsSchema removed as we now use the shared schema

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const bagletId = id;

    try {
        const body = await request.json();

        // Validate input
        const validationResult = UpdateBagletMetricsSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const metrics = validationResult.data;

        // Check if baglet exists
        const bagletCheck = await getBagletById(sql, bagletId);

        if (!bagletCheck) {
            return NextResponse.json(
                { error: 'Baglet not found' },
                { status: 404 }
            );
        }

        // Update using centralized action
        await updateBagletMetrics(sql, {
            bagletId,
            ...metrics
        });

        console.log(`✅ Updated metrics for baglet ${bagletId}`);

        return NextResponse.json({
            success: true,
            bagletId,
            updated: metrics
        });

    } catch (error: any) {
        console.error('❌ Metrics update failed:', error?.message);
        return NextResponse.json(
            { error: error?.message || 'Failed to update metrics' },
            { status: 500 }
        );
    }
}
