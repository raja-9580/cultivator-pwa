import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { exportBagletsForQRLabels } from '@/lib/batch-actions';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

/**
 * GET /api/batches/[id]/export-labels
 * 
 * Exports baglets as CSV for QR label printing.
 * This is a thin wrapper - business logic is in lib/batch-actions.ts
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    const batchId = params.id;

    try {
        // Delegate to business logic layer (defaults to INOCULATED status)
        const excelData = await exportBagletsForQRLabels(sql, batchId);

        // Format as CSV
        const headers = ['batch_id', 'baglet_id', 'weight_in_grams', 'inoculated_date', 'mushroom_name'];
        const csvRows = [
            headers.join(','),
            ...excelData.map(row =>
                headers.map(header => {
                    const value = row[header as keyof typeof row];
                    // Escape values that contain commas or quotes
                    return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                        ? `"${value.replace(/"/g, '""')}"`
                        : value;
                }).join(',')
            )
        ];

        const csvContent = csvRows.join('\n');

        // Return CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${batchId}_inoculated_baglets.csv"`,
            },
        });

    } catch (error: any) {
        console.error('Error generating Excel export:', error);

        // Handle not found case
        if (error.message.includes('No inoculated baglets found')) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        // Generic error
        return NextResponse.json(
            { error: 'Failed to generate Excel export', details: error.message },
            { status: 500 }
        );
    }
}
