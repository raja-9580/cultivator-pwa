require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function main() {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing in .env.local');
        process.exit(1);
    }

    const sql = neon(DATABASE_URL);

    console.log('🔍 Fetching batches and baglet statuses...\n');

    try {
        // Fetch all batches
        const batches = await sql`
      SELECT 
        b.batch_id, 
        m.mushroom_name, 
        b.baglet_count as planned_count
      FROM batch b
      LEFT JOIN strain s ON b.strain_code = s.strain_code
      LEFT JOIN mushroom m ON s.mushroom_id = m.mushroom_id
      WHERE b.is_deleted = FALSE
      ORDER BY b.logged_timestamp DESC
    `;

        for (const batch of batches) {
            console.log(`🍄 Batch: ${batch.batch_id} (${batch.mushroom_name})`);
            console.log(`   Planned Count: ${batch.planned_count}`);

            // Fetch baglet status counts
            const statusCounts = await sql`
        SELECT current_status, COUNT(*) as count
        FROM baglet
        WHERE batch_id = ${batch.batch_id} AND is_deleted = FALSE
        GROUP BY current_status
      `;

            if (statusCounts.length === 0) {
                console.log('   ⚠️  No baglets found!');
            } else {
                console.log('   📊 Statuses:');
                statusCounts.forEach(row => {
                    console.log(`      - "${row.current_status}": ${row.count}`);
                });
            }
            console.log('-----------------------------------');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();
