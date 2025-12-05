import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { addBagletToBatch } from '@/lib/batch-actions';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const batchId = params.id;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return NextResponse.json({ error: 'Database config missing' }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);

  try {
    const body = await request.json();
    const createdBy = body.user || 'system';

    // Transaction Wrapper
    // The service function expects to run inside a context, or we pass the sql client 
    // and letting it run commands. 
    // Ideally we wrap the *entire* db operation here in a transaction block.
    // The neon driver 'transaction' method is a bit different, it takes a callback or array.
    // To keep it simple with the 'neon' http driver:

    // We initiate a transaction block manually using SQL commands
    await sql`BEGIN`;

    try {
      const result = await addBagletToBatch(sql, batchId, createdBy);

      await sql`COMMIT`;

      return NextResponse.json({
        success: true,
        baglet_id: result.bagletId,
        sequence: result.sequence,
        message: `Successfully added Baglet #${result.sequence}`
      });

    } catch (innerError: any) {
      await sql`ROLLBACK`;
      throw innerError;
    }

  } catch (error: any) {
    console.error('Add Baglet Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to add baglet' },
      { status: 500 }
    );
  }
}
