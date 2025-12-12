import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { validateBagletForHarvest } from '@/lib/harvest-actions';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/harvest/validate?baglet_id=XXX
 */
export async function GET(req: NextRequest) {
    try {
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

        return NextResponse.json({ baglet: result.baglet });
    } catch (error: any) {
        console.error('Error validating baglet for harvest:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
