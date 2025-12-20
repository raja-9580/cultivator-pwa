import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { getAllSubstrates } from '@/lib/lookup-actions';

export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/substrates
 * Returns all substrates from v_substrate_full view
 */
export async function GET() {
    try {
        const substratesData = await getAllSubstrates(getSql());
        return NextResponse.json({ substrates: substratesData });
    } catch (error: any) {
        console.error('❌ Failed to fetch substrates:', error?.message);
        return NextResponse.json(
            { error: 'Failed to fetch substrates' },
            { status: 500 }
        );
    }
}
