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
  // Fetch all raw rows with joins
  // Note: This produces a cartesian product of mediums x supplements per substrate
  // We handle deduplication in the reducer
  const rows = await sql`
    SELECT 
      s.substrate_id,
      s.substrate_name,
      sm.medium_id,
      m.medium_name,
      sm.qty_g,
      ss.supplement_id,
      sp.supplement_name,
      ss.qty,
      sp.measure_type
    FROM substrate s
    LEFT JOIN substrate_medium sm ON s.substrate_id = sm.substrate_id
    LEFT JOIN medium m ON sm.medium_id = m.medium_id
    LEFT JOIN substrate_supplement ss ON s.substrate_id = ss.substrate_id
    LEFT JOIN supplement sp ON ss.supplement_id = sp.supplement_id
    ORDER BY s.substrate_name
  `;

  // Group by substrate_id
  const substratesMap = new Map<string, any>();

  for (const row of rows) {
    if (!substratesMap.has(row.substrate_id)) {
      substratesMap.set(row.substrate_id, {
        substrate_id: row.substrate_id,
        substrate_name: row.substrate_name,
        mediums: [],     // Will dedupe via Map/Set or checks
        supplements: []  // Will dedupe via Map/Set or checks
      });
    }

    const substrate = substratesMap.get(row.substrate_id);

    // Add medium if present and unique
    if (row.medium_id) {
      const exists = substrate.mediums.some((m: any) => m.medium_id === row.medium_id);
      if (!exists) {
        substrate.mediums.push({
          medium_id: row.medium_id,
          medium_name: row.medium_name,
          qty_g: row.qty_g // DB driver returns string or number depending on config, typically string for numeric
        });
      }
    }

    // Add supplement if present and unique
    if (row.supplement_id) {
      const exists = substrate.supplements.some((s: any) => s.supplement_id === row.supplement_id);
      if (!exists) {
        substrate.supplements.push({
          supplement_id: row.supplement_id,
          supplement_name: row.supplement_name,
          qty: row.qty,
          measure_type: row.measure_type
        });
      }
    }
  }

  return Array.from(substratesMap.values());
}
