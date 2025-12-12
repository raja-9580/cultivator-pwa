import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getHarvestStats, getReadyBaglets } from '@/lib/harvest-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/harvest/dashboard
 * Returns both stats and ready baglets in one call
 */
export async function GET() {
    try {
        // Get both stats and ready baglets
        const [stats, baglets] = await Promise.all([
            getHarvestStats(sql),
            getReadyBaglets(sql)
        ]);

        return NextResponse.json({
            stats,
            readyBaglets: baglets
        });
    } catch (error: any) {
        console.error('Error fetching harvest dashboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
