import { z } from 'zod';

/**
 * Validation schemas for API requests
 * These can be reused on both frontend and backend
 */

export const PlanBatchSchema = z.object({
    farm_id: z.string().optional().default('FPR'),
    prepared_date: z.string().optional(),
    strain_code: z.string().min(1, 'Strain code is required'),
    substrate_id: z.string().min(1, 'Substrate ID is required'),
    baglet_count: z.number().int().positive('Baglet count must be greater than 0'),
    created_by: z.string().email('Valid email is required'),
});

export type PlanBatchInput = z.infer<typeof PlanBatchSchema>;

export const UpdateBatchStatusSchema = z.object({
    action: z.enum(['sterilize', 'inoculate']),
    updated_by: z.string().email(),
});

export type UpdateBatchStatusInput = z.infer<typeof UpdateBatchStatusSchema>;

export const RecordHarvestSchema = z.object({
    bagletId: z.string().min(1, 'Baglet ID is required'),
    weight: z.number().positive('Weight must be greater than 0'),
    notes: z.string().optional(),
    harvestedBy: z.string().min(1, 'User is required'),
});

export type RecordHarvestInput = z.infer<typeof RecordHarvestSchema>;
