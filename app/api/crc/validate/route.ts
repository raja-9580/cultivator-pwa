import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { validateBagletForCRC } from '@/lib/crc-actions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bagletId = searchParams.get('baglet_id');

    if (!bagletId) {
        return NextResponse.json({ error: 'Baglet ID required' }, { status: 400 });
    }

    // Always use fresh data for validation to avoid stale status checks
    const sql = getSql(true);

    try {
        const result = await validateBagletForCRC(sql, bagletId);

        if (result.error) {
            // Map "Baglet not found" to 404, others to 400
            const status = result.error === 'Baglet not found' ? 404 : 400;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json({ baglet: result.baglet });

    } catch (error: any) {
        console.error('CRC Validation Error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
