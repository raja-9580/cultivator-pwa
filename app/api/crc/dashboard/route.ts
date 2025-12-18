import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { getCRCDashboard } from '@/lib/crc-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    // Always use fresh data for dashboard to ensure real-time accuracy
    const sql = getSql(true);

    try {
        const data = await getCRCDashboard(sql);
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('CRC Dashboard Error:', error);
        return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
    }
}
