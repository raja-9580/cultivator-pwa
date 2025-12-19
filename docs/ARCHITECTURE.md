# 🧠 Architecture & Stack Decisions — Thought Process

This document captures **why each technology was chosen**, including **cost limits, usage patterns, risks, and rejected alternatives**, ensuring the reasoning is not lost over time.

---

## 1️⃣ Frontend + Backend Framework — **Next.js**

| Factor | Consideration |
| :--- | :--- |
| **Cost** | Free on Vercel Hobby plan for internal apps |
| **Usage pattern** | Few users, bursty usage, mostly CRUD |
| **Why not separate frontend/backend** | Adds deployment + infra overhead with no benefit |
| **Why Next.js** | UI + backend (BFF) in one repo, zero extra services |
| **Why not plain React + API** | Would require separate hosting + routing + auth handling |
| **Risk accepted** | Tied to Vercel ecosystem |
| **Reasonable because** | App is internal, not a public SaaS |

➡️ **Decision**: Next.js reduces moving parts and deployment complexity to near zero.

---

## 2️⃣ Hosting Platform — **[Vercel](https://vercel.com/) (Hobby Plan)**

| Factor | Consideration |
| :--- | :--- |
| **Monthly cost** | ₹0 |
| **Limits considered** | 100 GB bandwidth, function execution limits |
| **CPU hours concern** | App is low traffic; functions run only on user actions |
| **URL stability** | Project URL remains stable across deployments |
| **Over-usage risk** | Low (few users, no background jobs) |
| **Why not VPS** | Always-on cost + maintenance |
| **Why not Cloudflare Workers** | More complex DB + Next.js integration |
| **Why Vercel** | Best support for Next.js, zero setup, fast iteration |

➡️ **Decision**: Vercel Hobby is sufficient **because the app is not always-on and not public**.

---

## 3️⃣ Database — **[Neon](https://neon.tech/) Serverless PostgreSQL**

| Factor | Consideration |
| :--- | :--- |
| **Monthly cost** | ₹0 on Hobby |
| **Free limits** | ~100 compute hours/month |
| **Why this fits** | App usage is **human-driven**, not automated |
| **Actual DB usage** | Only during CRUD actions (batch, baglet, status, harvest) |
| **Why not Azure SQL** | CPU/memory billed 24×7 even if unused |
| **Why not RDS / Cloud SQL** | Always-on instance cost |
| **Why not VPS Postgres** | Ops, backups, security, patching |
| **Over-usage risk** | Very low unless automated jobs added |
| **Risk accepted** | Cold starts + caching behaviour |

➡️ **Decision**: Neon gives **real PostgreSQL with near-zero cost**, matching our low, bursty usage.

---

## 4️⃣ Database Access — **Raw SQL (no ORM)**

| Factor | Consideration |
| :--- | :--- |
| **Cost** | Zero |
| **Complexity** | Explicit, but predictable |
| **Schema design** | Heavy use of joins, views, logs |
| **Why not ORM** | Hides SQL, hard to reason about performance |
| **Why raw SQL** | Full control, easier debugging |
| **Risk accepted** | Slightly more code |
| **Mitigation** | Centralized queries + views |

➡️ **Decision**: Raw SQL aligns better with **DB-first design** and operational clarity.

---

## 5️⃣ Views (`v_strain_full`, `v_substrate_full`)

| Factor | Consideration |
| :--- | :--- |
| **Why views exist** | Reduce repeated joins in APIs |
| **Cost impact** | None |
| **Performance** | Acceptable for small datasets |
| **Why not compute in code** | Logic duplication + error-prone |
| **Risk accepted** | Schema coupling |
| **Benefit** | Clean dropdown APIs and simpler UI logic |

➡️ **Decision**: Views simplify APIs and make UI code dumb and safe.

---

## 6️⃣ Caching Strategy — **Manual Version System**

| Factor | Consideration |
| :--- | :--- |
| **Why caching needed** | Vercel + Neon may return cached reads |
| **Why not rely on platform invalidation** | Not guaranteed on Hobby |
| **Chosen approach** | Manual version token (e.g. `?v=timestamp`) |
| **Cost** | Zero |
| **Multi-user safety** | Version bumps on write |
| **Risk accepted** | Slight extra logic |
| **Benefit** | Deterministic behaviour |

➡️ **Decision**: Manual versioning gives **predictable freshness without paid plans**.

---

## 7️⃣ Runtime Choice — **Node + selective Edge**

| Factor | Consideration |
| :--- | :--- |
| **DB access** | Better in Node |
| **Latency-sensitive reads** | Edge where helpful |
| **Cost** | Same on Hobby |
| **Why not Edge everywhere** | DB drivers + transactions clearer in Node |

➡️ **Decision**: Choose runtime per route, not ideology.

---

## Summary — Why This Stack Works *For Us*

*   **Internal tool**: No SEO or public traffic requirements.
*   **Low concurrency**: Used by a specific team, not the internet.
*   **No background jobs**: All actions are triggered by clicks.
*   **Heavy relational data**: Complex relationships fit SQL perfectly.
*   **Cost goal**: Must stay near zero.

This stack is **not generic** — it is tuned to **how this app is used**, not how tech blogs recommend.

---

## 🏗️ Architecture Diagram

```mermaid
graph TD
    User((User / PWA))
    
    subgraph "Hosting (Vercel)"
        CDN[Edge Network / CDN]
        NextUI[Next.js Frontend]
        API[API Routes / Server Actions]
    end
    
    subgraph "Data (Neon Serverless)"
        DB[(PostgreSQL Database)]
        Views[SQL Views]
    end

    User -->|HTTPS| CDN
    CDN -->|Static Assets| NextUI
    CDN -->|Dynamic Req| API
    
    API -->|Raw SQL| DB
    DB -->|Data| Views
    Views -->|Read Optimized| API
    
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style DB fill:#bbf,stroke:#333,stroke-width:2px
    style {Views} fill:#dfd,stroke:#333,stroke-width:2px
```

---

## 8️⃣ 🚨 CRITICAL: Baglet Date Authority (Batch Prepare Date)

> [!IMPORTANT]
> **SOURCE OF TRUTH**: We strictly use `batch.prepared_date` as the single authoritative date for all Baglet age, history, and cohort calculations.

| Factor | Consideration |
| :--- | :--- |
| **Primary Pivot** | Switched from `logged_timestamp` to `batch.prepared_date` |
| **Why pivot** | Prevent "rebirthing" (heartbeats were overwriting system timestamps) |
| **Impact on stats** | Range filters (1M, 3M, 6M) now correctly reflect production cohorts |
| **Logic decision** | Age is calculated ONLY from the day the batch was started |

➡️ **Final Decision**: The **Batch Preparation Date** is the absolute source of truth. Do not use system-level timestamps for business metrics.
---

## 9️⃣ Timezone Management — **IST (India Standard Time)**

| Factor | Consideration |
| :--- | :--- |
| **Why IST** | The farm operation is physically located in India; logs must match lab clocks |
| **DB standard** | Database stores all timestamps in UTC, but computed via `now_ist()` |
| **Logic decision** | Never use raw `now()` in SQL to avoid server-region drift (UTC/US-East) |
| **Implementation** | Custom SQL function `now_ist()` returns `(now() at time zone 'utc' at time zone 'ist')` |

➡️ **Decision**: All business logs and status changes use **IST**. We use the custom `now_ist()` function for all timestamp insertions and updates to ensure lab-clock parity.

---

## 🔟 UI Philosophy — **Ultra-Dense (Reference: Baglet Monitoring Dashboard)**

| Principle | Implementation |
| :--- | :--- |
| **Why Ultra-Dense** | Optimized for pro-lab environments where data speed > whitespace |
| **Mobile Grid** | Stats (Total/Active/Health) grouped in single 3-column rows |
| **Card Layout** | `rounded-2xl` with `bg-white/5` border for clear unit separation |
| **High Contrast** | Metrics (Temp/Weight/ph) must use high-contrast white text |
| **Explicit Labels** | All metrics use small bold uppercase labels (e.g. `WEIGHT`) |
| **Visual Sync** | Range toggles must dim UI during "Syncing" state to show freshness |

➡️ **Standard**: All future monitoring screens must follow the **Baglet Monitoring Dashboard** design language for consistency.
