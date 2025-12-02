import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

// Validation schema
const CreateBatchSchema = z.object({
  farm_id: z.string().optional().default('FPR'),
  prepared_date: z.string().optional(),
  strain_code: z.string().min(1, 'Strain code is required'),
  substrate_id: z.string().min(1, 'Substrate ID is required'),
  baglet_count: z.number().int().positive('Baglet count must be greater than 0'),
  created_by: z.string().email('Valid email is required'),
});

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
        -- Aggregate baglet statuses to derive batch status
        COUNT(DISTINCT bg.current_status) as status_count,
        STRING_AGG(DISTINCT bg.current_status, ',') as all_statuses,
        COUNT(bg.baglet_id) as actual_baglet_count
      FROM batch b
      LEFT JOIN farm f ON b.farm_id = f.farm_id
      LEFT JOIN substrate s ON b.substrate_id = s.substrate_id
      LEFT JOIN strain st ON b.strain_code = st.strain_code
      LEFT JOIN mushroom m ON st.mushroom_id = m.mushroom_id
      LEFT JOIN baglet bg ON b.batch_id = bg.batch_id AND bg.is_deleted = FALSE
      WHERE b.is_deleted = FALSE
      GROUP BY b.batch_id, b.farm_id, b.prepared_date, b.batch_sequence, 
               b.substrate_id, b.strain_code, b.baglet_count, b.logged_timestamp,
               f.farm_name, s.substrate_name, st.strain_code, m.mushroom_name
      ORDER BY b.prepared_date DESC, b.batch_sequence DESC
    `;

    const batches = batchesData.map((row) => {
      // Calculate batch status from baglet statuses
      let batchStatus = 'Planned'; // Default

      if (row.actual_baglet_count > 0 && row.all_statuses) {
        const statuses = row.all_statuses.split(',');

        if (statuses.length === 1) {
          // All baglets have the same status
          batchStatus = statuses[0];
        } else {
          // Mixed statuses - batch is in progress
          batchStatus = 'In Progress';
        }
      }

      return {
        id: row.batch_id,
        mushroomType: row.mushroom_name,
        substrateCode: row.substrate_id,
        substrateDescription: row.substrate_name,
        plannedBagletCount: row.baglet_count,
        actualBagletCount: row.actual_baglet_count || 0,
        status: batchStatus,
        createdDate: row.logged_timestamp,
        preparedDate: row.prepared_date,
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
 * Creates a new batch with baglets in a single transaction
 */
export async function POST(request: Request) {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);

  try {
    const body = await request.json();

    // Validate input
    const validationResult = CreateBatchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { farm_id, prepared_date, strain_code, substrate_id, baglet_count, created_by } = validationResult.data;

    // Convert prepared_date to DATE (default to today if not provided)
    const preparedDateObj = prepared_date ? new Date(prepared_date) : new Date();
    const preparedDateStr = preparedDateObj.toISOString().split('T')[0]; // YYYY-MM-DD

    // Format date as ddmmyyyy for batch_id
    const day = String(preparedDateObj.getDate()).padStart(2, '0');
    const month = String(preparedDateObj.getMonth() + 1).padStart(2, '0');
    const year = preparedDateObj.getFullYear();
    const dateFormatted = `${day}${month}${year}`;

    // BEGIN TRANSACTION
    await sql`BEGIN`;

    try {
      // 1. Validate strain_code exists in v_strain_full
      const strainCheck = await sql`
        SELECT strain_code, mushroom_name, strain_vendor_id, vendor_name
        FROM v_strain_full
        WHERE strain_code = ${strain_code}
        LIMIT 1
      `;

      if (strainCheck.length === 0) {
        throw new Error(`Invalid strain_code: ${strain_code}`);
      }

      const strainInfo = strainCheck[0];

      // 2. Validate substrate_id and get substrate mix info from v_substrate_full
      // IMPORTANT: v_substrate_full returns mediums and supplements as JSON arrays
      const substrateCheck = await sql`
        SELECT
          substrate_id,
          substrate_name,
          mediums,
          supplements
        FROM v_substrate_full
        WHERE substrate_id = ${substrate_id}
      `;

      if (substrateCheck.length === 0) {
        throw new Error(`Invalid substrate_id: ${substrate_id}`);
      }

      // Extract substrate info (view already returns JSON arrays)
      const substrateInfo = {
        substrate_id: substrateCheck[0].substrate_id,
        substrate_name: substrateCheck[0].substrate_name,
        mediums: substrateCheck[0].mediums || [],
        supplements: substrateCheck[0].supplements || [],
      };

      // 3. Calculate batch_sequence
      const seqResult = await sql`
        SELECT COALESCE(MAX(batch_sequence), 0) + 1 AS next_sequence
        FROM batch
        WHERE farm_id = ${farm_id} AND prepared_date = ${preparedDateStr}
      `;

      const batchSequence = seqResult[0].next_sequence;

      // 4. Construct batch_id: FPR-ddmmyyyy-Bxx
      const batchId = `${farm_id}-${dateFormatted}-B${String(batchSequence).padStart(2, '0')}`;

      // 5. Insert batch
      await sql`
        INSERT INTO batch (
          batch_id, farm_id, prepared_date, batch_sequence,
          substrate_id, strain_code, baglet_count,
          logged_by, logged_timestamp, is_deleted
        ) VALUES (
          ${batchId}, ${farm_id}, ${preparedDateStr}, ${batchSequence},
          ${substrate_id}, ${strain_code}, ${baglet_count},
          ${created_by}, NOW(), FALSE
        )
      `;

      // 6. Create baglets
      const createdBagletIds: string[] = [];

      for (let i = 1; i <= baglet_count; i++) {
        const bagletSequence = i;
        const seqPadded = String(bagletSequence).padStart(3, '0');

        // Baglet ID format: {batch_id}-{strain_code}-{strain_vendor_id}-{substrate_id}-{seq}
        const bagletId = `${batchId}-${strain_code}-${strainInfo.strain_vendor_id}-${substrate_id}-${seqPadded}`;

        createdBagletIds.push(bagletId);

        // Insert baglet
        await sql`
          INSERT INTO baglet (
            baglet_id, batch_id, baglet_sequence,
            current_status, status_updated_at,
            latest_weight_g, latest_temp_c, latest_humidity_pct,
            contamination_flag, logged_by, logged_timestamp, is_deleted
          ) VALUES (
            ${bagletId}, ${batchId}, ${bagletSequence},
            'Planned', NOW(),
            NULL, NULL, NULL,
            FALSE, ${created_by}, NOW(), FALSE
          )
        `;

        // Insert baglet_status_log
        await sql`
          INSERT INTO baglet_status_log (
            baglet_id, batch_id, previous_status, status,
            notes, logged_by, logged_timestamp
          ) VALUES (
            ${bagletId}, ${batchId}, NULL, 'Planned',
           'Initial baglet creation', ${created_by}, NOW()
          )
        `;
      }

      // 7. Calculate mix summary
      const mediums_per_baglet = substrateInfo.mediums;
      const supplements_per_baglet = substrateInfo.supplements;

      const mediums_for_batch = mediums_per_baglet.map((m: any) => ({
        ...m,
        qty_g: m.qty_g * baglet_count,
      }));

      const supplements_for_batch = supplements_per_baglet.map((s: any) => ({
        ...s,
        qty: s.qty * baglet_count,
      }));

      // COMMIT TRANSACTION
      await sql`COMMIT`;

      console.log(`✅ Created batch ${batchId} with ${baglet_count} baglets`);

      // 8. Return response
      return NextResponse.json(
        {
          batch_id: batchId,
          batch_sequence: batchSequence,
          prepared_date: preparedDateStr,
          baglet_count,
          strain: {
            strain_code: strainInfo.strain_code,
            mushroom_name: strainInfo.mushroom_name,
            strain_vendor_id: strainInfo.strain_vendor_id,
            vendor_name: strainInfo.vendor_name,
          },
          substrate: {
            substrate_id: substrateInfo.substrate_id,
            substrate_name: substrateInfo.substrate_name,
            mediums_per_baglet,
            supplements_per_baglet,
            mediums_for_batch,
            supplements_for_batch,
          },
          created_baglet_ids: createdBagletIds,
        },
        { status: 201 }
      );

    } catch (innerError: any) {
      // ROLLBACK on error
      await sql`ROLLBACK`;
      throw innerError;
    }

  } catch (error: any) {
    console.error('❌ Batch creation failed:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to create batch' },
      { status: 500 }
    );
  }
}
