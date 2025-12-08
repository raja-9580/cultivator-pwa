import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { PlanBatchSchema } from '@/lib/validation-schemas';
import { planBatch } from '@/lib/batch-actions';


/**
 * GET /api/batches
 * Returns all batches
 */
export async function GET() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);

  try {
    const batchesData = await sql`
      SELECT 
        b.batch_id,
        b.farm_id,
        b.prepared_date,
        b.batch_sequence,
        b.substrate_id,
        b.strain_code,
        b.baglet_count,
        b.logged_timestamp,
        f.farm_name,
        s.substrate_name,
        st.strain_code,
        m.mushroom_name,
        -- Subquery for actual baglet count
        (SELECT COUNT(*) FROM baglet WHERE batch_id = b.batch_id AND is_deleted = FALSE) as actual_baglet_count,
        -- Subquery for status distribution
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
      WHERE b.is_deleted = FALSE
      ORDER BY b.prepared_date DESC, b.batch_sequence DESC
    `;

    const batches = batchesData.map((row) => {
      const statusCounts = row.baglet_status_counts || {};
      const totalBaglets = parseInt(row.actual_baglet_count || '0');

      return {
        id: row.batch_id,
        mushroomType: row.mushroom_name,
        substrateCode: row.substrate_id,
        substrateDescription: row.substrate_name,
        plannedBagletCount: row.baglet_count,
        actualBagletCount: totalBaglets,
        createdDate: row.logged_timestamp,
        preparedDate: row.prepared_date,
        bagletStatusCounts: statusCounts,
      };
    });

    console.log(`✅ Fetched ${batches.length} batches from database`);
    return NextResponse.json({ batches }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error: any) {
    console.error('❌ Database query failed:', error?.message);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

/**
 * POST /api/batches
 * Plans a new batch with baglets in a single transaction
 */
export async function POST(request: Request) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);

  try {
    const body = await request.json();

    // Validate input using centralized schema
    const validationResult = PlanBatchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Delegate to business logic
    const result = await planBatch(sql, validationResult.data);

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('❌ Batch planning failed:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to plan batch' },
      { status: 500 }
    );
  }
}
