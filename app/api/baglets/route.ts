import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { searchBaglets } from '@/lib/baglet-actions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const forceRefresh = searchParams.get('refresh') === 'true';

  // Get SQL client (fresh or cached)
  const sql = getSql(forceRefresh);

  try {
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const bagletsData = await searchBaglets(sql, {
      startDate,
      endDate
    });

    const baglets = bagletsData.map((row) => ({
      id: row.baglet_id,
      baglet_id: row.baglet_id,
      batchId: row.batch_id,
      status: row.current_status,
      mushroomType: row.mushroom_name,
      weight: row.weight_in_grams !== null ? parseFloat(row.weight_in_grams.toString()) : null,
      lastStatusChange: row.status_updated_at,
      preparedDate: row.prepared_date,
      metrics: row.latest_temp_c !== null ? {
        temperature: row.latest_temp_c,
        humidity: row.latest_humidity_pct || 0,
        ph: (row.latest_ph !== null && row.latest_ph !== undefined) ? parseFloat(row.latest_ph.toString()) : undefined,
        recordedAt: row.status_updated_at,
      } : undefined,
    }));

    console.log(`✅ Refactored: Fetched ${baglets.length} baglets via searchBaglets action`);
    return NextResponse.json({ baglets });

  } catch (error: any) {
    console.error('❌ Database query failed:', error?.message);
    return NextResponse.json({ error: 'Failed to fetch baglets' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Not implemented yet' },
    { status: 501 }
  );
}
