import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { validateBagletForHarvest } from '@/lib/harvest-actions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/harvest/validate?baglet_id=XXX
 */
export async function GET(req: NextRequest) {
    try {
        const sql = getSql(true); // Force refresh for latest data

        const { searchParams } = new URL(req.url);
        const bagletId = searchParams.get('baglet_id');

        if (!bagletId) {
            return NextResponse.json(
                { error: 'baglet_id is required' },
                { status: 400 }
            );
        }

        const result = await validateBagletForHarvest(sql, bagletId);

        if (!result.valid) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { baglet: result.baglet },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            }
        );
    } catch (error: any) {
        console.error('Error validating baglet for harvest:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
