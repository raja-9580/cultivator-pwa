import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);

  try {
    // Get params
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const bagletId = searchParams.get('baglet_id');

    let bagletsData;

    if (bagletId) {
      // Filter by baglet_id
      bagletsData = await sql`
        SELECT
          bg.baglet_id,
          bg.batch_id,
          bg.current_status,
          bg.status_updated_at,
          bg.latest_weight_g,
          bg.latest_temp_c,
          bg.latest_humidity_pct
        FROM baglet bg
        WHERE bg.baglet_id = ${bagletId}
      `;
    } else if (batchId) {
      // Filter by batch_id
      bagletsData = await sql`
        SELECT
          bg.baglet_id,
          bg.batch_id,
          bg.current_status,
          bg.status_updated_at,
          bg.latest_weight_g,
          bg.latest_temp_c,
          bg.latest_humidity_pct
        FROM baglet bg
        WHERE bg.batch_id = ${batchId} AND bg.is_deleted = FALSE
        ORDER BY bg.baglet_sequence ASC
      `;
    } else {
      // Get all baglets
      bagletsData = await sql`
        SELECT
          bg.baglet_id,
          bg.batch_id,
          bg.current_status,
          bg.status_updated_at,
          bg.latest_weight_g,
          bg.latest_temp_c,
          bg.latest_humidity_pct
        FROM baglet bg
        WHERE bg.is_deleted = FALSE
      `;
    }

    const baglets = bagletsData.map((row) => ({
      id: row.baglet_id,
      baglet_id: row.baglet_id,
      batchId: row.batch_id,
      status: row.current_status,
      lastStatusChange: row.status_updated_at,
      metrics: row.latest_temp_c ? {
        temperature: parseFloat(row.latest_temp_c),
        humidity: parseFloat(row.latest_humidity_pct) || 0,
        co2Level: 0,
        lightLevel: 0,
        recordedAt: row.status_updated_at,
      } : undefined,
    }));

    console.log(`✅ Fetched ${baglets.length} baglets from database`);
    return NextResponse.json({ baglets });

  } catch (error: any) {
    console.error('❌ Database query failed:', error?.message);
    return NextResponse.json({ error: 'Failed to fetch baglets' }, { status: 500 });
  }
}

export async function POST(_request: Request) {
  // TODO: Implement baglet creation
  // INSERT INTO baglets (...) VALUES (...);
  return NextResponse.json(
    { error: 'Not implemented yet' },
    { status: 501 }
  );
}
