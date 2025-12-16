
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getHarvestHistory, HarvestHistoryParams } from '@/lib/harvest-actions';

// Force dynamic since we use query params and DB
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const params: HarvestHistoryParams = {
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            mushroomId: searchParams.get('mushroomId') || undefined,
            activeOnly: searchParams.get('activeOnly') === 'true',
        };

        const result = await getHarvestHistory(sql, params);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error fetching harvest history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch harvest history' },
            { status: 500 }
        );
    }
}
