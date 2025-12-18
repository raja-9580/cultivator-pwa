
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { SubmitCRCAnalysisSchema } from '@/lib/validation-schemas';
import { submitCRCAnalysis } from '@/lib/crc-actions';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Zod Validation
        const validation = SubmitCRCAnalysisSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.message }, { status: 400 });
        }

        // Always use fresh data for mutations
        const sql = getSql(true);

        // 2. Execute Action
        await submitCRCAnalysis(sql, validation.data);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('CRC Analysis Submit Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to submit analysis' }, { status: 500 });
    }
}
