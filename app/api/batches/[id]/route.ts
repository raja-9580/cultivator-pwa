import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
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
  const sql = getSql(true);
  const { id: batchId } = await (params as any); // Next.js 15 params are async

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
