import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

/**
 * GET /api/batches/[id]
 * Returns detailed information about a specific batch
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database configuration missing' },
      { status: 500 }
    );
  }

  const sql = neon(DATABASE_URL);
  const batchId = params.id;

  try {
    // Fetch batch details with all related information
    const batchData = await sql`
      SELECT 
        b.batch_id,
        b.farm_id,
        b.prepared_date,
        b.batch_sequence,
        b.substrate_id,
        b.strain_code,
        b.baglet_count,
        b.logged_by,
        b.logged_timestamp,
        f.farm_name,
        s.substrate_name,
        st.strain_code,
        st.mushroom_id,
        m.mushroom_name,
        st.strain_vendor_id,
        sv.vendor_name,
        -- Actual baglet count
        (SELECT COUNT(*) FROM baglet WHERE batch_id = b.batch_id AND is_deleted = FALSE) as actual_baglet_count,
        -- Status distribution
        (
          SELECT json_object_agg(current_status, count)
          FROM (
            SELECT current_status, COUNT(*) as count
            FROM baglet
            WHERE batch_id = b.batch_id AND is_deleted = FALSE
            GROUP BY current_status
          ) t
        ) as baglet_status_counts
      FROM batch b
      LEFT JOIN farm f ON b.farm_id = f.farm_id
      LEFT JOIN substrate s ON b.substrate_id = s.substrate_id
      LEFT JOIN strain st ON b.strain_code = st.strain_code
      LEFT JOIN mushroom m ON st.mushroom_id = m.mushroom_id
      LEFT JOIN strain_vendor sv ON st.strain_vendor_id = sv.strain_vendor_id
      WHERE b.batch_id = ${batchId} AND b.is_deleted = FALSE
      LIMIT 1
    `;

    if (batchData.length === 0) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    const batch = batchData[0];

    // Fetch substrate mix details - mediums
    const mediumsData = await sql`
      SELECT
        sm.medium_id,
        m.medium_name,
        sm.qty_g
      FROM substrate_medium sm
      JOIN medium m ON sm.medium_id = m.medium_id
      WHERE sm.substrate_id = ${batch.substrate_id}
      ORDER BY sm.medium_id
    `;

    const mediumsArray = mediumsData.map((m) => ({
      medium_id: m.medium_id,
      medium_name: m.medium_name,
      qty_g: parseFloat(m.qty_g || 0),
    }));

    // Fetch substrate mix details - supplements
    const supplementsData = await sql`
      SELECT
        ss.supplement_id,
        s.supplement_name,
        ss.qty,
        s.measure_type as unit
      FROM substrate_supplement ss
      JOIN supplement s ON ss.supplement_id = s.supplement_id
      WHERE ss.substrate_id = ${batch.substrate_id}
      ORDER BY ss.supplement_id
    `;

    const supplementsArray = supplementsData.map((s) => ({
      supplement_id: s.supplement_id,
      supplement_name: s.supplement_name,
      qty: parseFloat(s.qty || 0),
      unit: s.unit,
    }));

    // Calculate total mix for the batch
    const bagletCount = batch.baglet_count;
    const mediumsForBatch = mediumsArray.map((m) => ({
      ...m,
      qty_g: m.qty_g * bagletCount,
    }));

    const supplementsForBatch = supplementsArray.map((s) => ({
      ...s,
      qty: s.qty * bagletCount,
    }));

    // Fetch baglet list for this batch
    const bagletsData = await sql`
      SELECT 
        baglet_id,
        batch_id,
        baglet_sequence,
        current_status,
        status_updated_at,
        latest_weight_g,
        latest_temp_c,
        latest_humidity_pct,
        contamination_flag,
        logged_timestamp
      FROM baglet
      WHERE batch_id = ${batchId} AND is_deleted = FALSE
      ORDER BY baglet_sequence ASC
    `;

    const baglets = bagletsData.map((b) => ({
      id: b.baglet_id,
      batchId: b.batch_id,
      sequence: b.baglet_sequence,
      status: b.current_status,
      statusUpdatedAt: b.status_updated_at,
      weight: b.latest_weight_g ? parseFloat(b.latest_weight_g) : null,
      temperature: b.latest_temp_c ? parseFloat(b.latest_temp_c) : null,
      humidity: b.latest_humidity_pct ? parseFloat(b.latest_humidity_pct) : null,
      contaminated: b.contamination_flag,
      createdAt: b.logged_timestamp,
    }));

    // Build response
    const response = {
      batch: {
        id: batch.batch_id,
        farmId: batch.farm_id,
        farmName: batch.farm_name,
        preparedDate: batch.prepared_date,
        sequence: batch.batch_sequence,
        mushroomType: batch.mushroom_name,
        mushroomId: batch.mushroom_id,
        strain: {
          code: batch.strain_code,
          vendorId: batch.strain_vendor_id,
          vendorName: batch.vendor_name,
        },
        substrate: {
          id: batch.substrate_id,
          name: batch.substrate_name,
          mediums: mediumsArray,
          supplements: supplementsArray,
          mediumsForBatch,
          supplementsForBatch,
        },
        plannedBagletCount: batch.baglet_count,
        actualBagletCount: parseInt(batch.actual_baglet_count || '0'),
        bagletStatusCounts: batch.baglet_status_counts || {},
        createdBy: batch.logged_by,
        createdAt: batch.logged_timestamp,
      },
      baglets,
    };

    console.log(`✅ Fetched details for batch ${batchId}`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Database query failed:', error?.message);
    return NextResponse.json(
      { error: 'Failed to fetch batch details' },
      { status: 500 }
    );
  }
}
