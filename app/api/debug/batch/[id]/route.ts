import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) return NextResponse.json({ error: 'No DB URL' });

    const sql = neon(DATABASE_URL);
    const batchId = params.id;

    try {
        const baglets = await sql`
      SELECT baglet_id, current_status, latest_weight_g, latest_temp_c, latest_humidity_pct
      FROM baglet 
      WHERE batch_id = ${batchId}
    `;

        const logs = await sql`
            SELECT * FROM baglet_status_log 
            WHERE batch_id = ${batchId} 
            ORDER BY logged_timestamp DESC 
            LIMIT 10
        `;

        return NextResponse.json({
            batchId,
            count: baglets.length,
            baglets: baglets.map(b => ({
                id: b.baglet_id,
                status: b.current_status,
                weight: b.latest_weight_g,
                temp: b.latest_temp_c,
                humidity: b.latest_humidity_pct
            })),
            logs
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
