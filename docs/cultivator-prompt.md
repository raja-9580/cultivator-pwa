

# ⭐ **FULL ANTI-GRAVITY PROMPT — Cultivator App (Next.js + Neon + TS + Auth + QR + PWA)**

*(This is the full version you asked for — no trimming.)*

---

Build a **full-stack Cultivator App** using the following stack:

* **Next.js (App Router)**
* **TypeScript everywhere (strict mode, no JavaScript files)**
* **TailwindCSS + ShadCN UI**
* **Neon Serverless Postgres (primary DB)**
* **Drizzle ORM or Prisma**
* **NextAuth (Auth.js) with Google Provider**
* **Vercel serverless API routes ONLY (NO Express, NO /backend folder, NO Node server)**
* **PWA support (installable, offline shell caching)**

The app must be **modular, reusable, maintainable, responsive (mobile → tablet → web), and production-ready**.

---

# ⭐ **ABSOLUTE RULES**

* **Use the existing Postgres schema from `ddl.sql` EXACTLY.**
* Do **NOT** modify, invent, rename, or remove any table or column.
* Follow all FOREIGN KEY, PRIMARY KEY, and relationship constraints exactly as in `ddl.sql`.
* Implement all logic (CRUD, business rules) using **Next.js API routes** under `/app/api/**`.
* Do **NOT** generate Express servers or a separate backend directory.
* All backend logic must run as **Vercel serverless functions**.

---

# ⭐ **AUTHENTICATION REQUIREMENTS**

Use **NextAuth (Auth.js)** with Google Sign-In.

Allow login ONLY for:

1. **Google Workspace domain:** `@akaththi.in`
2. **Specific external Gmail:** `rajaselvaraj369@gmail.com` (super admin)

Enforce this inside `callbacks.signIn`:

* If email ends with `@akaththi.in` → allow.
* Else if email equals `"rajaselvaraj369@gmail.com"` → allow.
* Else → deny access.

Redirect to `/dashboard` after successful login.

**Local redirect URI:**
`http://localhost:3000/api/auth/callback/google`

Production redirect → auto-detected by Vercel.

---

# ⭐ **THEME — Tech × Nature Hybrid (Controlled Pod + Sustainability)**

The theme MUST visually combine:

### **1. IoT / climate-controlled mushroom pods**

* Slate / charcoal base
* Neon-teal / cyan highlights
* Subtle glow for sensor/tech feel
* Clean, minimal layout
* Glassy cards + gradients (light touches)

### **2. Nature / Green / Sustainable farming**

* Organic green accents
* Soft whites
* Warm neutral spacing
* Rounded corners
* Eco-friendly feel

Icons = minimal line icons.
Typography = clean modern sans-serif.
Design must look **excellent on mobile and web**.

---

# ⭐ **NAVIGATION (GLOBAL)**

Use a sidebar layout for desktop/tablet and bottom navigation for mobile.

Include the following sections, even if some are placeholders:

* **Dashboard**
* **Batches**
* **Baglets**
* **Harvest** (placeholder)
* **Metrics** (placeholder)
* **Reports** (placeholder)
* **Settings**

  * Master Data
  * Users

---

# ⭐ **FEATURES (FULL SCOPE)**

## 🔹 1. **Dashboard**

Two dashboards:

### **Batch Dashboard**

* List all batches
* Search
* Sorting
* Filters (date range, mushroom type, substrate, is_calcium_added, is_deleted, etc.)
* Pagination
* Status chips
* Cards for counts / summaries

### **Baglet Dashboard**

* List of baglets
* Filter by batch, strain, substrate, baglet status
* Search
* Sort
* Pagination

Include:

* Loading skeletons
* Error boundaries
* Data refresh

---

## 🔹 2. **Batch Creation Wizard (Multi-Step)**

**Multi-step wizard must include:**

### Step 1 — Select Mushroom Type

Fetched from master data.

### Step 2 — Select Substrate

* Show substrate list
* Auto-look up substrate code
* Show composition

### Step 3 — Enter Batch Info

Inputs as per ddl schema.

### Step 4 — Enter Baglet Count

User enters number of baglets to generate.

### Step 5 — Auto-generate Baglets

Rules:

* `baglet_seq` MUST start at **0** for every new batch
* Generate correct `baglet_id`
* Fill all required fields

### Step 6 — Preview

Show table preview of the batch + baglets.

### Step 7 — Save

Insert batch record → then insert baglets.

### Step 8 — QR Code Generation

* Generate QR codes (PNG or SVG) for each baglet
* QR contains **baglet_id only**
* Allow **bulk download** (ZIP or PDF)

---

## 🔹 3. **Baglets Module**

### Baglet List

* Filters
* Sorting
* Search
* Status chips
* Pagination

### Baglet Detail Page

* Baglet info
* Batch reference
* Status log (status_logger table)

### Bulk Baglet Status Update

* Select batch
* Update all baglet statuses in batch
* Insert into `status_logger` per baglet

---

## 🔹 4. **QR Module**

* **QR generator API** (`/app/api/qr`)
* Generate PNG/SVG
* Should work offline in PWA cache

### QR Scanner Page

* Fullscreen camera view (mobile-optimized)
* Auto-scan with vibration
* On detection → lookup `baglet_id` via API
* Redirect to baglet detail

---

## 🔹 5. **Settings Module**

### Master Data

* CRUD for mushroom types
* CRUD for substrates
* CRUD for any static tables in ddl.sql
* Cache slow-changing data on client + server

### Users

* Show allowed list
* UI to manage custom Gmail allow-list (update DB/env)

---

## 🔹 6. **Future Modules (Placeholders Now)**

Create placeholder pages for:

* **Harvest**
* **Metrics**
* **Reports** (weekly/monthly/avg/max/min harvest)

Pages can contain simple “Coming Soon” placeholders but routed correctly.

---

# ⭐ **BACKEND (Vercel Serverless ONLY)**

Backend logic MUST live in:

```
/app/api/batch
/app/api/batch/[id]
/app/api/baglet
/app/api/baglet/[id]
/app/api/bulk-status
/app/api/masterdata
/app/api/harvest (placeholder)
/app/api/qr
/app/api/users
```

Rules:

* Use **Drizzle or Prisma**
* Use **Neon pooled connection**
* Validate all inputs using **Zod**
* Return typed JSON responses
* Handle DB errors gracefully

---

# ⭐ **PWA REQUIREMENTS**

* `manifest.json`
* Icons
* Service worker
* Offline shell caching
* App should install on Android
* Responsive mobile-first layout

---

# ⭐ **ENVIRONMENT VARIABLES**

Do **NOT** hardcode secrets.

Create `.env.example` with placeholders:

```
DATABASE_URL=""
NEON_DATABASE_URL=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
NEXTAUTH_SECRET=""
NEXTAUTH_URL=""
```

All DB + OAuth credentials must come from environment variables.

---

# ⭐ **DELIVERABLES**

* Fully working Next.js (TS) codebase
* All pages + API routes
* Prisma/Drizzle schema from ddl.sql
* Auth (Google + domain + allowed email)
* Batch wizard
* Baglet module
* QR scanner + generator
* PWA
* Reusable UI components
* Loading skeletons
* Error handling
* README with setup instructions
* `.env.example`
* Routing map + component map

---

# ⭐ **IMPORTANT INSTRUCTIONS TO ANTI-GRAVITY**

* Ignore all previous context (flight booking, JavaScript, Express).
* Only use **Next.js App Router + TypeScript**.
* Backend must be **serverless functions only**.
* Implement everything in a **single Next.js monorepo**.
* App must run locally using:
  `npm install` → `npm run dev`.

