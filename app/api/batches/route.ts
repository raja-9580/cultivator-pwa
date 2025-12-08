import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { PlanBatchSchema } from '@/lib/validation-schemas';
import { planBatch, getAllBatches } from '@/lib/batch-actions';


/**
 * GET /api/batches
 * Returns all batches with baglet counts and status distribution
 */
export async function GET() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);

  try {
    // Delegate to business logic
    const batches = await getAllBatches(sql);

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
