

import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET() {
    // Use cached SQL client for static list
    const sql = getSql();

    try {
        const catalog = await sql`
        SELECT contamination_code, contamination_type, contaminant, symptoms, notes
        FROM contamination_catalog
        ORDER BY contamination_type, contaminant
    `;
        return NextResponse.json({ catalog });

    } catch (error: any) {
        console.error('CRC Catalog Error:', error);
        return NextResponse.json({ error: 'Failed to load catalog' }, { status: 500 });
    }
}
