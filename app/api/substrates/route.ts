import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

/**
 * GET /api/substrates
 * Returns all substrates from v_substrate_full view
 * The view already returns mediums and supplements as JSON arrays
 */
export async function GET() {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const sql = neon(DATABASE_URL);

    try {
        const substratesData = await sql`
      SELECT 
        substrate_id,
        substrate_name,
        mediums,
        supplements
      FROM v_substrate_full
      ORDER BY substrate_name
    `;

        console.log(`✅ Fetched ${substratesData.length} substrates from v_substrate_full`);

        return NextResponse.json({ substrates: substratesData });

    } catch (error: any) {
        console.error('❌ Failed to fetch substrates:', error?.message);
        return NextResponse.json({ error: 'Failed to fetch substrates' }, { status: 500 });
    }
}
