# Caching Strategy & Data Freshness

> **Last Updated:** December 10, 2025

**Purpose:** Understanding the caching layers in Next.js 14 + Neon and strategies to ensure data freshness while maintaining performance.

---

## The Problem 🐛

**Symptom:** After completing the "prepare batch" workflow, the batch list showed fresh data but the batch details page showed stale data.

**Root Cause:** Multiple caching layers were serving outdated responses:

1. **Next.js Route Caching** - API route responses cached
2. **Next.js Page Caching** - Rendered pages cached (if Server Components)
3. **Neon HTTP Client Caching** - `fetch()` responses cached by Neon driver
4. **Browser Caching** - HTTP response caching

**User Journey:**
```
1. User prepares batch → Database updated ✓
2. Batch list refreshes → Shows "Mark Sterilized" ✓
3. User clicks "View Details" → Shows "Prepare Batch" ✗ (stale!)
```

---

## Current Solution ⚡

**File:** `app/api/batches/[id]/route.ts`

```typescript
const sql = neon(DATABASE_URL, {
  fetchOptions: {
    cache: 'no-store',
  },
});
```

**What it does:**
- Disables Neon's HTTP fetch cache
- Every request hits the database
- Guarantees fresh data

**Trade-offs:**
- ✅ Always fresh
- ✅ Simple implementation
- ⚠️ Higher database load
- ⚠️ Slower responses
- ⚠️ More expensive (more DB queries)

---

## Smart Caching Alternatives 🧠

### Option 1: Time-Based Revalidation ⏱️
**Best for:** Most use cases

```typescript
const sql = neon(DATABASE_URL, {
  fetchOptions: {
    next: { revalidate: 10 } // Fresh every 10 seconds
  }
});
```

**How it works:**
- First request → Fetch from DB, cache for 10s
- Next requests (within 10s) → Serve from cache
- After 10s → Next request fetches fresh, re-cache

**When to use:**
- Users can tolerate a few seconds of staleness
- You want better performance than `no-store`

### Option 2: On-Demand Revalidation 🔄
**Best for:** Long cache + instant updates after mutations

```typescript
// API Route
export async function GET(request, { params }) {
  const batchDetails = await getBatchDetails(sql, params.id);
  return NextResponse.json(batchDetails); // Cached for 1 hour
}

// After mutation (prepare batch, etc.)
import { revalidatePath } from 'next/cache';

await prepareBatch(batchId);
revalidatePath(`/batches/${batchId}`); // Clear cache immediately
```

**How it works:**
- Data cached for long duration (1 hour)
- After any mutation → Explicitly invalidate cache
- Next request gets fresh data

**When to use:**
- You control all mutation points
- You want maximum performance with fresh data

### Option 3: Client-Side Cache (SWR) 📱
**Best for:** Complex apps with many mutations

```typescript
import useSWR from 'swr';

const { data, mutate } = useSWR(`/api/batches/${id}`, fetcher, {
  refreshInterval: 10000, // Auto-refresh every 10s
});

// After mutation
await prepareBatch();
mutate(); // Revalidate immediately
```

**When to use:**
- You want optimistic updates (instant UI)
- You have a complex frontend

### Option 4: Conditional Caching 🎯
**Best for:** Specific flows that need fresh data

```typescript
// API Route
const forceFresh = request.nextUrl.searchParams.get('fresh');

const sql = neon(DATABASE_URL, {
  fetchOptions: {
    cache: forceFresh ? 'no-store' : 'default',
    next: forceFresh ? undefined : { revalidate: 30 }
  }
});

// After mutation
router.push(`/batches/${batchId}?fresh=true`); // Force fresh
```

**When to use:**
- You want to optimize specific user journeys
- You know which requests need fresh data

---

## Recommended Settings by Route 📋

```typescript
// Critical real-time data
/api/batches/[id]        → revalidate: 5
/api/baglets/[id]        → revalidate: 5

// Frequently updated lists
/api/batches             → revalidate: 10
/api/baglets             → revalidate: 10

// Reports & analytics
/api/reports/*           → revalidate: 60

// Static reference data
/api/strains             → revalidate: 3600
/api/substrates          → revalidate: 3600
/api/farms               → revalidate: 3600
```

---

## Migration Path 🛤️

Moving from `no-store` to smart caching:

**Step 1:** Start conservative
```typescript
next: { revalidate: 5 } // Very fresh, low risk
```

**Step 2:** Monitor user feedback
- Too stale? → Reduce revalidation time
- High DB load? → Increase revalidation time

**Step 3:** Add on-demand revalidation
```typescript
// After critical mutations
revalidatePath(`/batches/${batchId}`);
```

**Step 4:** Increase cache duration
```typescript
next: { revalidate: 30 } // Once revalidation is in place
```

---

## Testing Caching 🧪

```bash
# Test initial fetch
curl http://localhost:3000/api/batches/BATCH-ID

# Update batch in database

# Test if cache is fresh (should return new data after revalidation period)
curl http://localhost:3000/api/batches/BATCH-ID
```

---

## References 📚

- [Next.js 14 Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Revalidation Strategies](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
