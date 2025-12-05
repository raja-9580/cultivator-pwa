# UI Polish & Experience Plan

**Goal:** Refine the visual interface, accessibility, and user feedback loops.

## 1. Accessibility (a11y) Improvements
*   **Target:** Navigation, Sidebar, Form Controls.
*   **Action:**
    *   **Labels:** Add `aria-label` to all icon-only buttons (FABs, mobile nav, sidebar toggles).
    *   **Focus Management:** Ensure keyboard users can tab through the "Create Batch" modal correctly and focus is trapped while open.
    *   **Contrast:** Audit text colors (especially gray-on-dark) to ensure readability in sunlight (critical for field usage).
*   **Outcome:** A more inclusive app that works better in varied environments (like bright grow rooms).

## 2. Visual Consistency
*   **Target:** Typography, Spacing, and Colors.
*   **Action:**
    *   **Tokens:** Review `tailwind.config.ts`. Ensure we are using the semantic names (`accent-leaf`, `dark-surface`) strictly and not hardcoding hex values (`#1A1F2E`).
    *   **Spacing:** Enforce consistent padding (e.g., `p-4` or `p-6`) across all cards.
*   **Outcome:** A professional, "tight" feeling application.

## 3. Loading States & Feedback
*   **Target:** Dashboard loading, Search results.
*   **Action:**
    *   Create `Skeleton` loaders for the Dashboard Cards and Tables instead of just showing a spinner or blank space.
    *   Improve "Empty States" (e.g., "No Batches Found" should have a nice illustration or a clear "Create One" button).
*   **Outcome:** Perceived performance improves; app feels faster and friendlier.

## 4. Mobile Responsiveness Fine-tuning
*   **Target:** Touch targets and Safa Areas.
*   **Action:**
    *   Verify all touch targets are at least 44x44px (fingertip size).
    *   Ensure "Safe Area" (notch/home bar) padding is perfect on iOS devices in PWA mode.
*   **Outcome:** Frustration-free usage on mobile devices.
