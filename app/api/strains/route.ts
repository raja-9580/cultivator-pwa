import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

/**
 * GET /api/strains
 * Returns all strains from v_strain_full view for dropdown usage
 */
export async function GET() {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const sql = neon(DATABASE_URL);

    try {
        const strainsData = await sql`
      SELECT 
        strain_code,
        mushroom_id,
        mushroom_name,
        strain_vendor_id,
        vendor_name
      FROM v_strain_full
      ORDER BY mushroom_name, strain_code
    `;

        console.log(`✅ Fetched ${strainsData.length} strains from v_strain_full`);

        return NextResponse.json({ strains: strainsData });

    } catch (error: any) {
        console.error('❌ Failed to fetch strains:', error?.message);
        return NextResponse.json({ error: 'Failed to fetch strains' }, { status: 500 });
    }
}
