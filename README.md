# Cultivator 🍄

**Cultivator** is a private, internal operational tool built for managing mushroom farm production cycles. It allows farm staff to track batches from sterilization to harvest, ensuring full traceability and replacing manual logbooks with a strictly defined digital workflow..

## 🛠️ Stack & Architecture
*(See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for deep-dive on decisions, costs, and limits)*

*   **Frontend**: Next.js 14 (App Router)
*   **Database**: PostgreSQL (Neon Serverless)
*   **Access**: Raw SQL (via `pg` + `dotenv`)
*   **Auth**: NextAuth.js (Google OAuth)
*   **Styling**: Tailwind CSS
*   **PWA**: `next-pwa` (Offline-first capable)

## 📂 Project Structure & Organization

We follow a "Feature-First" organization to keep related code together:

*   **`app/`**: **Routing & Pages**.
    *   *Why?* Next.js 13+ uses file-system routing. We keep page logic thin here.
    *   **`api/`**: **Backend Endpoints**. Handles all DB interactions securely.
*   **`components/`**: **UI Building Blocks**.
    *   *Why?* Separates "How it looks" from "How it works".
    *   **`AuthProvider.tsx`**: **Critical**. Wraps the app to handle user sessions (Real vs Mock).
*   **`lib/`**: **Business Logic (The "Brain")**.
    *   *Why?* We allow UI components (`components/`) to import logic, but logic never imports UI. This prevents circular dependencies and makes testing math/transformations easy.
    *   `batch-logic.ts`, `constants.ts`: Pure functions.

## 💻 Local Development

1.  **Setup Environment**:
    Create `.env` with:
    ```properties
    # Database (Required)
    DATABASE_URL=postgresql://...
    
    # Auth & Mocking
    NEXT_PUBLIC_MOCK_AUTH=true
    NEXTAUTH_SECRET=dev-secret-123
    ```

2.  **Run Server**:
    ```bash
    npm run dev
    ```

3.  **Open**: [http://localhost:3000](http://localhost:3000) (Auto-logged in).

## 📱 Mobile Testing (HTTPS via Cloudflare)

1.  **Start Tunnel**:
    Run this command (**No installation, account, or login required**):
    ```bash
    npx cloudflared tunnel --url http://localhost:3000
    ```
    *   *The first time you run this, press 'y' to install the temporary runner.*
    *   Copy the URL ending in `.trycloudflare.com`.

2.  **Update Config**:
    In your `.env`:
    ```properties
    NEXT_PUBLIC_MOCK_AUTH=true
    NEXTAUTH_SECRET=dev-secret-123
    NEXTAUTH_URL=https://<your-url>.trycloudflare.com  <-- PASTE HERE
    ```

3.  **Restart Server**:
    Kill `npm run dev` and start it again.

4.  **Test on Mobile**:
    *   Visit the `.trycloudflare.com` link on your phone.
    *   You will be auto-logged in.
    *   Camera/Scanner will work (HTTPS).


## 📚 Documentation

Key documentation for ongoing development and operations:

*   **[Deployment Guide](docs/DEPLOYMENT.md)**: Production deployment instructions.
*   **[Architecture Deep Dive](docs/ARCHITECTURE.md)**: Decisions, costs, and limits.
*   **[Substrate & Expansion Logic](docs/substrate-expansion-logic.md)**: Detailed explanation of Substrate recipes and Expansion Ratio calculations.
