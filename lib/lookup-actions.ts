import { NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Retrieves all strains from v_strain_full view.
 * Used for dropdown selections in forms like PlanBatchModal.
 */
export async function getAllStrains(sql: NeonQueryFunction<false, false>) {
    return await sql`
    SELECT 
      strain_code,
      mushroom_id,
      mushroom_name,
      strain_vendor_id,
      vendor_name
    FROM v_strain_full
    ORDER BY mushroom_name, strain_code
  `;
}

/**
 * Retrieves all substrates from v_substrate_full view.
 * The view already returns mediums and supplements as JSON arrays.
 */
export async function getAllSubstrates(sql: NeonQueryFunction<false, false>) {
    return await sql`
    SELECT 
      substrate_id,
      substrate_name,
      mediums,
      supplements
    FROM v_substrate_full
    ORDER BY substrate_name
  `;
}
