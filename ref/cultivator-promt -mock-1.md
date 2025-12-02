You are an expert Next.js + TypeScript + Tailwind CSS engineer. Generate a fresh project from scratch for a mushroom cultivation internal tool called **“Cultivator”**.

## Tech & deployment

* Framework: **Next.js (App Router)** with **TypeScript** and **Tailwind CSS**.
* Style: modern, clean, minimal, production-quality, NOT like a student project.
* Deployment target: **Vercel**. Project must be structured so it can be deployed to Vercel as a single monolithic app (frontend + backend / BFF in the same repo).
* Backend pattern: **BFF (Backend for Frontend)** using **Next.js Route Handlers** under `app/api/*`.
* Database: **PostgreSQL on Neon serverless**, but for now:

  * Use **dummy in-memory data or static mocks** for the UI.
  * Still create a `lib/db.ts` file with a **placeholder Neon connection string** (e.g. `process.env.DATABASE_URL`) and simple helper scaffold, but do not implement real queries yet.

## Theme & layout

* Theme inspiration:

  * Mushrooms grown in **controlled pods** with IoT sensors (light, CO₂, temperature, humidity).
  * Feels **tech + nature + sustainable**.
* Color direction:

  * Background: very dark **blue-green/charcoal**, not pure black (e.g. near `#020617` / `#020d11`).
  * Surfaces/cards: slightly lighter deep green/blue (`#04141f` ~ `#071a23`).
  * Accents: **vibrant green** for active elements (`#16a34a` or similar), with subtle teal/amber highlights.
  * Text: mostly light neutral (off-white) with good contrast.
* Overall style keywords:

  * Minimal, airy, **not** cluttered.
  * Clear hierarchy, big readable typography, nice spacing.
  * Consistent card layout, modern sidebar, subtle dividers, no heavy borders.

## Project structure

Create a clear, modular structure (this is important):

* `app/`

  * `layout.tsx` (root layout with sidebar + top bar and theme applied).
  * `page.tsx` (Dashboard page).
  * `batches/`

    * `page.tsx` (Batch list page).
  * `baglets/`

    * `page.tsx` (Baglet list page).
  * `metrics/`

    * `page.tsx` (placeholder Metrics page).
  * `harvest/`

    * `page.tsx` (placeholder Harvest page).
  * `status-logger/`

    * `page.tsx` (placeholder Status Logger / bulk status page).
  * `reports/`

    * `page.tsx` (placeholder Reports page).
  * `api/` (BFF scaffold, no real logic yet)

    * `batches/route.ts` (return mock batch data).
    * `baglets/route.ts` (return mock baglet data).
    * You can add more routes as simple mocks if helpful.

* `components/`

  * `layout/`

    * `Sidebar.tsx` (app navigation).
    * `Topbar.tsx` (simple top header with app title, space for future actions).
  * `dashboard/`

    * `DashboardStats.tsx` (summary cards).
    * `RecentBatches.tsx`.
    * `RecentBaglets.tsx`.
  * `batches/`

    * `BatchListTable.tsx` (table + filters).
    * `CreateBatchDrawerOrModal.tsx` (multi-step create batch form).
    * `BatchQrPanel.tsx` (preview QR codes for a batch with dummy data).
  * `baglets/`

    * `BagletListTable.tsx`.
  * `placeholders/`

    * Simple sections for Metrics, Harvest, Status Logger, Reports.
  * `ui/` (small reusable primitives)

    * `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Select.tsx`, `Table.tsx`, etc.
    * You may either build simple custom components or base them on shadcn-style patterns, but keep everything self-contained in this repo.

* `lib/`

  * `db.ts` — Neon db client scaffold with **placeholder** `DATABASE_URL`, but do not call it yet.
  * `types.ts` — central TypeScript types for core entities:

    * `Batch`, `Baglet`, `BagletStatus`, `Metric`, `HarvestEntry`.
    * Use reasonable fields and names based on typical mushroom cultivation and the following requirements.
  * `mock-data.ts` — arrays of dummy batches, baglets, metrics etc. Use realistic-looking IDs and timestamps.

* `public/`

  * `favicon.ico`, app icon, simple logo mark for “Cultivator” (can be just text + simple glyph for now).

## Navigation & pages (MVP layout only)

Use a **left sidebar** and main content area.

**Sidebar menu (top to bottom)**:

1. **Dashboard** (default route `/`).
2. **Batches** (`/batches`).
3. **Baglets** (`/baglets`).
4. **Metrics** (placeholder page).
5. **Harvest** (placeholder page).
6. **Status Logger** (placeholder page for bulk status update).
7. **Reports** (placeholder page).

All pages should use a consistent layout and show dummy data so I can see how it will look.

### 1. Dashboard (`/`)

* Show:

  * KPI cards: total batches, active batches, total baglets, baglets waiting for sterilization, etc. Use mock numbers.
  * Two simple tables or lists:

    * Recent batches (5–10 rows).
    * Recent baglets or recent status updates.
* Use cards and minimal charts/indicators if you like, but keep it clean.
* This is for “at a glance” understanding of the farm.

### 2. Batch list page (`/batches`)

* **Top header**: title “Batches” + primary action button “Create batch”.
* Filters (at top of page or above table):

  * Dropdown for mushroom type (e.g. Golden Oyster, Elm Oyster).
  * Dropdown for batch status (Planned, Sterilized, Inoculated, Colonising, Ready to Harvest, Archived).
  * Date range picker for prepared date (can be simple from/to inputs).
* Main content: table with columns (show mock data):

  * Batch ID (e.g. `FPR-24092025-B01`).
  * Mushroom type.
  * Substrate code or short substrate description.
  * Baglet count (planned / actual).
  * Batch status.
  * Created/prepared date.
* Row actions:

  * “View details” (can be stubbed, e.g. navigate to `/batches/[id]` later or just a placeholder).
  * “Add baglets” (opens a drawer/modal showing a short form where we define extra baglets for this batch; for now only UI, no real save).
  * “Generate QR codes” (opens a panel / modal that shows QR codes for this batch using dummy data; allow a “Download all” button with no real implementation yet).

### 3. Baglet list page (`/baglets`)

* Layout:

  * Filters: by batch, status, date.
  * Table with columns:

    * Baglet ID (e.g. `BGL-FPR-24092025-B01-001`).
    * Batch ID (clickable to jump to that batch).
    * Current status (Planned, Sterilized, Inoculated, etc.).
    * Last status change time.
    * Last metric (e.g. “Temp 24°C, CO₂ 1100 ppm”) from dummy data.
* For now, only display + filtering with mock data.
* Provide a space / actions (buttons) that hint at future capabilities:

  * “Add metric (scan or enter ID)” — but only a disabled or placeholder button for now.

### 4. Placeholder pages (Metrics, Harvest, Status Logger, Reports)

* Each of these routes should:

  * Use the same layout and theme.
  * Show a page title and short description of what will eventually happen here.
  * Optionally include a small sample card or table with dummy data (e.g. in Metrics: example metric rows, in Harvest: example harvest entries).
* **Do NOT implement full logic**; these are just stubs so we can see navigation and layout.

## QR code behaviour (for now)

* For this iteration:

  * No scanning flows.
  * Just **QR generation preview**:

    * On batch page action “Generate QR codes”, show a grid of QR codes for dummy baglet IDs + batch ID.
    * Provide a “Download all as PNG/PDF” button UI; actual download can be a TODO / placeholder.
* Design the QR preview panel with the same theme (dark, clean, minimal).

## Responsiveness & PWA

* The entire app must be **responsive**, with special attention to:

  * Mobile (small screens) and desktop web as highest priority.
  * Tablet should look acceptable.
* Sidebar behaviour:

  * On desktop: pinned on the left.
  * On mobile: collapsible / overlay.
* Include initial PWA scaffolding:

  * Basic `manifest.json` and icons.
  * Next.js app configured so it can be installed as a web app.
  * No need for complex offline caching yet; keep it simple.

## What NOT to do yet

* Do **NOT** implement real DB queries or mutations.
* Do **NOT** implement authentication/OAuth yet.
* Do **NOT** implement full metric/harvest/status-logger workflows; placeholders only.
* Focus on:

  * Project structure ready for Vercel + BFF.
  * Layout, navigation, theme, and reusable components.
  * Dummy data flowing through UI so I can see realistic screens.

## Output expectations

* Generate the full Next.js project code with:

  * Clear file/folder structure as described.
  * All main pages and components wired up with dummy data.
  * Tailwind configured and used consistently.
  * Comments where real DB / Neon logic will go later, with TODO notes.
* Ensure the code can run with `npm install` and `npm run dev` and render all pages with mock data only.


