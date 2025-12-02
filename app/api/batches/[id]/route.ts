import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';



export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const sql = neon(DATABASE_URL);
    const batchId = params.id;

    try {
        // 1. Fetch batch details
        const batchResult = await sql`
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
        m.mushroom_name
      FROM batch b
      LEFT JOIN farm f ON b.farm_id = f.farm_id
      LEFT JOIN substrate s ON b.substrate_id = s.substrate_id
      LEFT JOIN strain st ON b.strain_code = st.strain_code
      LEFT JOIN mushroom m ON st.mushroom_id = m.mushroom_id
      WHERE b.batch_id = ${batchId} AND b.is_deleted = FALSE
    `;

        if (batchResult.length === 0) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }

        const batch = batchResult[0];

        // 2. Fetch baglet status distribution to calculate batch status
        // We calculate this dynamically because the batch table does not have a status column
        const statusDistribution = await sql`
            SELECT 
                current_status, 
                COUNT(*)::int as count 
            FROM baglet 
            WHERE batch_id = ${batchId} AND is_deleted = FALSE 
            GROUP BY current_status
        `;

        let batchStatus = 'Planned';
        let actualBagletCount = 0;
        let statusBreakdown: { status: string; count: number }[] = [];

        if (statusDistribution.length > 0) {
            statusBreakdown = statusDistribution.map(row => ({
                status: row.current_status || 'Unknown',
                count: Number(row.count)
            }));

            actualBagletCount = statusBreakdown.reduce((sum, item) => sum + item.count, 0);

            if (actualBagletCount > 0) {
                if (statusBreakdown.length === 1) {
                    // All baglets have the same status
                    batchStatus = statusBreakdown[0].status;
                } else {
                    // Mixed statuses
                    batchStatus = 'In Progress';
                }
            }
        }

        // 3. Fetch substrate recipe (mediums and supplements)
        // We use the view v_substrate_full which returns aggregated JSON arrays
        const substrateResult = await sql`
      SELECT 
        substrate_id,
        substrate_name,
        mediums,
        supplements
      FROM v_substrate_full
      WHERE substrate_id = ${batch.substrate_id}
    `;

        let recipe = null;
        if (substrateResult.length > 0) {
            recipe = {
                mediums: substrateResult[0].mediums || [],
                supplements: substrateResult[0].supplements || []
            };
        }

        // 4. Construct response
        const responseData = {
            id: batch.batch_id,
            mushroomType: batch.mushroom_name,
            substrateCode: batch.substrate_id,
            substrateDescription: batch.substrate_name,
            plannedBagletCount: batch.baglet_count,
            actualBagletCount: actualBagletCount,
            status: batchStatus,
            statusBreakdown: statusBreakdown,
            createdDate: batch.logged_timestamp,
            preparedDate: batch.prepared_date,
            recipe: recipe
        };

        return NextResponse.json({ batch: responseData });

    } catch (error: any) {
        console.error('❌ Failed to fetch batch details:', error?.message);
        return NextResponse.json({ error: 'Failed to fetch batch details' }, { status: 500 });
    }
}
