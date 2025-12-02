import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        if (!sql) {
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 500 }
            );
        }

        // Query v_substrate_full view
        console.log('🧪 Querying v_substrate_full without schema qualification');
        const substrateData = await sql`SELECT * FROM v_substrate_full LIMIT 10`;
        
        console.log(`✅ Found ${substrateData.length} substrate records`);
        if (substrateData.length > 0) {
            console.log('📦 First substrate:', substrateData[0]);
        }

        return NextResponse.json({
            success: true,
            message: 'Successfully connected to database with search_path set',
            count: substrateData.length,
            data: substrateData
        });

    } catch (error: any) {
        console.error('❌ Database query failed:', error);
        return NextResponse.json(
            {
                error: 'Database query failed',
                details: error?.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
