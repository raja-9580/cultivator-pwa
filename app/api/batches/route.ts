import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { PlanBatchSchema } from '@/lib/validation-schemas';
import { planBatch, getAllBatches } from '@/lib/batch-actions';


// Force dynamic since we use query params and DB
export const dynamic = 'force-dynamic';

/**
 * GET /api/batches
 * Returns all batches with optional filtering
 */
export async function GET(request: NextRequest) {
  const sql = getSql(true);
  const searchParams = request.nextUrl.searchParams;

  const filters = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    activeOnly: searchParams.get('activeOnly') === 'true',
    mushroomType: searchParams.get('mushroomType') || undefined,
  };

  try {
    // Delegate to business logic with filters
    const batches = await getAllBatches(sql, filters);

    console.log(`✅ Fetched ${batches.length} batches with filters:`, filters);

    return NextResponse.json({ batches });

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
  const sql = getSql(true);

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
