import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) return NextResponse.json({ error: 'No DB URL' });

    const sql = neon(DATABASE_URL);
    const batchId = params.id;

    try {
        const baglets = await sql`
      SELECT baglet_id, current_status 
      FROM baglet 
      WHERE batch_id = ${batchId}
    `;

        return NextResponse.json({
            batchId,
            count: baglets.length,
            statuses: baglets.map(b => b.current_status)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
