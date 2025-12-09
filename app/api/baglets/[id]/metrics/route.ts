import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

const MetricsSchema = z.object({
    weight: z.number().optional(),
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    ph: z.number().optional(),
});

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        return NextResponse.json(
            { error: 'Database configuration missing' },
            { status: 500 }
        );
    }

    const sql = neon(DATABASE_URL);
    const bagletId = params.id;

    try {
        const body = await request.json();

        // Validate input
        const validationResult = MetricsSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { weight, temperature, humidity, ph } = validationResult.data;

        // Check if baglet exists
        const bagletCheck = await sql`
            SELECT baglet_id FROM baglet WHERE baglet_id = ${bagletId}
        `;

        if (bagletCheck.length === 0) {
            return NextResponse.json(
                { error: 'Baglet not found' },
                { status: 404 }
            );
        }

        // Update baglet metrics
        // We use COALESCE to only update provided fields, keeping existing values if new ones are undefined
        // Note: If user explicitly sends null, Zod optional() treats it as undefined if missing, 
        // but if we want to allow clearing values, we'd need nullable(). 
        // For now, assuming we only overwrite with new values.

        await sql`
            UPDATE baglet
            SET 
                latest_weight_g = COALESCE(${weight}::numeric, latest_weight_g),
                latest_temp_c = COALESCE(${temperature}::numeric, latest_temp_c),
                latest_humidity_pct = COALESCE(${humidity}::numeric, latest_humidity_pct),
                latest_ph = COALESCE(${ph}::numeric, latest_ph),
                -- We might want to update logged_timestamp or a specific metrics_updated_at if we had one
                -- For now, we don't touch status_updated_at as that tracks STATUS changes (e.g. PLANNED -> STERILIZED)
                logged_timestamp = NOW() 
            WHERE baglet_id = ${bagletId}
        `;

        console.log(`✅ Updated metrics for baglet ${bagletId}`);

        return NextResponse.json({
            success: true,
            bagletId,
            updated: {
                weight,
                temperature,
                humidity,
                ph
            }
        });

    } catch (error: any) {
        console.error('❌ Metrics update failed:', error?.message);
        return NextResponse.json(
            { error: error?.message || 'Failed to update metrics' },
            { status: 500 }
        );
    }
}
