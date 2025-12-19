import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import {
    getBagletById,
    getBagletStatusHistory,
    getBagletHarvests,
    getBagletContaminationFindings
} from '@/lib/baglet-actions';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const sql = getSql(true); // Always fresh for details

    try {
        const [baglet, history, harvests, contamination] = await Promise.all([
            getBagletById(sql, id),
            getBagletStatusHistory(sql, id),
            getBagletHarvests(sql, id),
            getBagletContaminationFindings(sql, id)
        ]);

        if (!baglet) {
            return NextResponse.json({ error: 'Baglet not found' }, { status: 404 });
        }

        // Map baglet to consistent frontend format
        const formattedBaglet = {
            id: baglet.baglet_id,
            batchId: baglet.batch_id,
            status: baglet.current_status,
            mushroomType: baglet.mushroom_name,
            strainCode: baglet.strain_code,
            substrateId: baglet.substrate_id,
            preparedDate: baglet.prepared_date,
            weight: baglet.weight_in_grams !== null ? parseFloat(baglet.weight_in_grams.toString()) : null,
            lastStatusChange: baglet.status_updated_at,
            metrics: baglet.latest_temp_c !== null ? {
                temperature: baglet.latest_temp_c,
                humidity: baglet.latest_humidity_pct || 0,
                ph: (baglet.latest_ph !== null && baglet.latest_ph !== undefined) ? parseFloat(baglet.latest_ph.toString()) : undefined,
                recordedAt: baglet.status_updated_at,
            } : undefined,
        };

        return NextResponse.json({
            baglet: formattedBaglet,
            history,
            harvests,
            contamination
        });

    } catch (error: any) {
        console.error('❌ Detailed Baglet fetch failed:', error?.message);
        return NextResponse.json({ error: 'Failed to fetch baglet details' }, { status: 500 });
    }
}
