import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getServerSession } from 'next-auth';
import { RecordHarvestSchema } from '@/lib/validation-schemas';
import { recordHarvest } from '@/lib/harvest-actions';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

/**
 * POST /api/harvest/record
 */
export async function POST(req: NextRequest) {
    try {
        // Get authenticated user
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();

        // Add user to request data
        const dataWithUser = {
            ...body,
            harvestedBy: session.user.email,
        };

        // Validate
        const validationResult = RecordHarvestSchema.safeParse(dataWithUser);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid input',
                    details: validationResult.error.issues
                },
                { status: 400 }
            );
        }

        const result = await recordHarvest(sql, validationResult.data);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error recording harvest:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
