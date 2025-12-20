import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { getAllStrains } from '@/lib/lookup-actions';

export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/strains
 * Returns all strains from v_strain_full view for dropdown usage
 */
export async function GET() {
    try {
        const strainsData = await getAllStrains(getSql());
        return NextResponse.json({ strains: strainsData });
    } catch (error: any) {
        console.error('❌ Failed to fetch strains:', error?.message);
        return NextResponse.json(
            { error: 'Failed to fetch strains' },
            { status: 500 }
        );
    }
}
