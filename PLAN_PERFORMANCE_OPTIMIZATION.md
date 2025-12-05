# Performance Optimization Plan

**Goal:** Improve application speed, loading times, and resource efficiency.

## 1. Asset Optimization (Images)
*   **Target:** `Logo.tsx` and any other image usages.
*   **Action:**
    *   Replace standard `<img>` tags with Next.js `<Image />` component.
    *   Configure `next.config.js` if remote images are ever used (unlikely for now, but good practice).
    *   Convert static assets (PNG/JPG) to WebP where possible or let Next.js handle it.
*   **Outcome:** Faster LCP (Largest Contentful Paint) and lower bandwidth usage for mobile users.

## 2. Code Splitting & Bundle Analysis
*   **Target:** Large pages or heavy components.
*   **Action:**
    *   Analyze build output (`npm run build`) to see if any chunks are surprisingly large.
    *   Implement Dynamic Imports (`next/dynamic`) for heavy, non-critical components (e.g., The Scanner component, or the Charts if we add them).
    *   Lazy load "Modal" content so it doesn't hydrate on initial page load.
*   **Outcome:** Smaller initial JS bundle, faster TTI (Time to Interactive).

## 3. Database Query Performance
*   **Target:** SQL queries in `lib/` and API routes.
*   **Action:**
    *   Review SQL queries for "N+1" problems (fetching baglets one by one in a loop).
    *   Verify indexes on frequently searched columns:
        *   `baglet.baglet_id` (PK, indexed by default)
        *   `baglet.batch_id` (FK, needs index)
        *   `baglet.current_status` (Often filtered by this)
*   **Outcome:** Faster search results and listing pages as data grows.

## 4. Caching Strategies
*   **Target:** Dashboard and Batches list.
*   **Action:**
    *   Evaluate if `fetch` calls can be cached for short periods (e.g., 60 seconds) or if they must be real-time.
    *   Implement `revalidatePath` or `revalidateTag` intelligently instead of fetching everything on every render.
*   **Outcome:** Snappier navigation and reduced load on the Neon database.
