import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getBatchDetails } from '@/lib/batch-actions';

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
    // Delegate to business logic
    const batchDetails = await getBatchDetails(sql, batchId);

    console.log(`✅ Fetched details for batch ${batchId}`);
    return NextResponse.json(batchDetails);

  } catch (error: any) {
    // Handle "Batch not found" error specifically
    if (error.message === 'Batch not found') {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    console.error('❌ Database query failed:', error?.message);
    return NextResponse.json(
      { error: 'Failed to fetch batch details' },
      { status: 500 }
    );
  }
}
