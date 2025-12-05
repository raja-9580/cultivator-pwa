You are an expert Next.js + TypeScript + Neon Postgres engineer. Extend the existing Cultivator app to implement the Batch Creation Flow end-to-end with correct ID formats, correct substrate-mix logic, correct view usage, and PDF QR label generation.

CONTEXT

* Next.js App Router, TypeScript, Tailwind.
* Neon Postgres, working connection in lib/db.ts.
* One monolithic repo deployed to Vercel (frontend + backend/BFF).
* Existing DB: mushroom, strain_vendor, strain, substrate, medium, supplement, substrate_medium, substrate_supplement, batch, baglet, baglet_status_log.
* Existing views: v_strain_full and v_substrate_full (must be used for all human-readable data).
* Farm code: FPR. - dropdown from table
* ID formats are final and must never change.

BATCH ID FORMAT
FPR-ddmmyyyy-Bxx
Example: FPR-24092025-B01

BAGLET ID FORMAT
FPR-ddmmyyyy-Bxx-GN1-NVD-SUB001-001
Segments: farm_code, date, batch_sequence, strain_code, strain_vendor_id, substrate_id, 3-digit baglet sequence.

BUSINESS RULES

* Batch sequence restarts every date per farm.
* Baglet sequence always starts at 1 for each batch.
* Initial baglet status = Planned.
* All view-based dropdowns must come from v_strain_full and v_substrate_full only.
* No duplicate joins anywhere else.

===========================

1. API ENDPOINTS FOR DROPDOWNS
   ===========================

GET /api/strains

* Query: SELECT * FROM v_strain_full ORDER BY mushroom_name, strain_code
* Return: strain_code, mushroom_id, mushroom_name, strain_vendor_id, vendor_name.
* Label suggestion: “Golden Oyster – GN1 (Nuvedo Labs)”.

GET /api/substrates

* Query: SELECT * FROM v_substrate_full ORDER BY substrate_name
* Return: substrate_id, substrate_name, mediums (JSON), supplements (JSON).
* Use the view exactly as-is.

Implement both endpoints with Next.js Route Handlers using Neon client.

===========================
2. POST /api/batches (FULL TRANSACTION)
=======================================

Input JSON:
farm_id (optional, default “FPR”),
prepared_date (optional ISO date; if missing = today UTC),
strain_code,
substrate_id,
baglet_count (>0),
created_by (string email).

Validation:

* baglet_count <= 0 → return 400.
* Validate strain_code by checking v_strain_full.
* Validate substrate_id by checking v_substrate_full.
* Convert prepared_date to DATE.

Batch sequence calculation:
SELECT COALESCE(MAX(batch_sequence),0)+1 FROM batch WHERE farm_id = $1 AND prepared_date = $2

Construct batch_id = FPR-ddmmyyyy-Bxx.

Insert into batch:
batch_id, farm_id, prepared_date, batch_sequence, substrate_id, strain_code, baglet_count, logged_by, logged_timestamp=now(), is_deleted=false.

Retrieve strain info (strain_code, strain_vendor_id, mushroom_name, vendor_name) through v_strain_full.
Retrieve substrate info (mediums, supplements) through v_substrate_full.

Baglet creation:
For i = 1..baglet_count
baglet_sequence = i
seq = 3-digit padded (“001”)
baglet_id = {batch_id}-{strain_code}-{strain_vendor_id}-{substrate_id}-{seq}

Insert into baglet:
baglet_id, batch_id, baglet_sequence, current_status='Planned', status_updated_at=now(), latest_weight_g NULL, latest_temp_c NULL, latest_humidity_pct NULL, contamination_flag=false, logged_by, logged_timestamp=now(), is_deleted=false.

Insert into baglet_status_log:
baglet_id, status='Planned', previous_status=NULL, status_timestamp=now(), logged_by, logged_timestamp=now(), is_deleted=false.

Everything must be inside a single transaction—commit only on full success.

===========================
3. SUBSTRATE MIX CALCULATION
============================

Use only the data returned by v_substrate_full.

mediums = array of { medium_id, medium_name, qty_g }
supplements = array of { supplement_id, supplement_name, qty, unit }

Per-baglet mix = direct data from view.

Batch total mix = multiply each qty by baglet_count.

Return in API response:

mix_summary.per_baglet.mediums
mix_summary.per_baglet.supplements
mix_summary.for_batch.mediums
mix_summary.for_batch.supplements

===========================
4. API RESPONSE (STRICT)
========================

Return 201 with JSON:

{
batch_id,
batch_sequence,
prepared_date,
baglet_count,
strain: { strain_code, mushroom_name, strain_vendor_id, vendor_name },
substrate: {
substrate_id,
substrate_name,
mediums_per_baglet,
supplements_per_baglet,
mediums_for_batch,
supplements_for_batch
},
created_baglet_ids: [...]
}

===========================
5. FRONTEND — CREATE BATCH UI
=============================

On /batches page, implement a modal/drawer:

Fields:

* Mushroom strain (dropdown from GET /api/strains)
* Substrate (dropdown from GET /api/substrates)
* Prepared date (default today, allow past)
* Baglet count (integer > 0)

Submit flow:

* Disable button during request
* POST /api/batches
* On success: toast “Batch X created”, close modal, refresh list

===========================
6. BATCH DETAIL PAGE
====================

Show:

* strain, vendor, mushroom name
* substrate name
* baglet count
* full mix summary (per baglet + batch total)

===========================
7. QR CODES + PDF DOWNLOAD  (MANDATORY)
=======================================

On the batch detail page:

* Generate QR code for each baglet_id
* Show QR grid (QR image + baglet_id text)
* Provide button “Download QR Labels (PDF)”

PDF must be generated client-side using html2canvas + jspdf.
PDF must include all QR codes and baglet IDs.
No server PDF is needed.

===========================
END OF PROMPT
=============

