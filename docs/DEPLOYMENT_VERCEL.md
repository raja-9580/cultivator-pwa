# End-to-End Vercel Deployment Guide for Cultivator

This guide outlines the step-by-step process to deploy the Cultivator PWA to Vercel.

## 1. Prerequisites

Before starting, ensure you have:
*   A [GitHub](https://github.com/) account with this project pushed to a repository.
*   A [Vercel](https://vercel.com/) account.
*   A [Google Cloud Console](https://console.cloud.google.com/) project (for Authentication).
*   A Database provider (Recommended: [Neon](https://neon.tech/) for PostgreSQL).

---

## 2. Database Setup (Neon PostgreSQL)

Since this app uses PostgreSQL, you need a hosted database.

1.  Go to [Neon Console](https://console.neon.tech/).
2.  Create a new project.
3.  Copy the **Connection String** (Pooled connection is recommended for serverless envs like Vercel).
    *   Format: `postgresql://user:pass@ep-xyz.region.neon.tech/dbname?sslmode=require`
4.  Run your database migrations/schema setup locally or connect your local instance to this remote DB to push the schema if needed.

---

## 3. Deployment Steps on Vercel

1.  **Log in to Vercel** and click **"Add New..."** -> **"Project"**.
2.  **Import Git Repository**: Select your `cultivator-pwa` repository.
3.  **Configure Project**:
    *   **Framework Preset**: Next.js (Should be auto-detected).
    *   **Root Directory**: `./` (Default).
4.  **Environment Variables**:
    You MUST add the following variables in the "Environment Variables" section. expanding the section to add them one by one.

    | Variable Name | Description | Example Value |
    | :--- | :--- | :--- |
    | `DATABASE_URL` | Your production database connection string | `postgres://...` |
    | `NEXTAUTH_SECRET` | A random string to encrypt sessions | Generate with `openssl rand -base64 32` |
    | `NEXTAUTH_URL` | The URL of your deployed app | `https://your-project.vercel.app` (See Note below) |
    | `GOOGLE_CLIENT_ID` | From Google Cloud Console | `123...apps.googleusercontent.com` |
    | `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-...` |

    > **Note on NEXTAUTH_URL**: Vercel automatically sets a `VERCEL_URL` env var, but NextAuth prefers `NEXTAUTH_URL`. For the initial deploy, you might not know the exact domain. You can skip this initially or set it to the expected default domain `https://cultivator-pwa.vercel.app` (replace with your project name). **CRITICAL**: Once deployed, you must update this effectively.

5.  Click **Deploy**.

---

## 4. Google OAuth Configuration (Important)

Google login will **FAIL** until you authorize the new Vercel domain.

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **APIs & Services** > **Credentials**.
3.  Edit your **OAuth 2.0 web client**.
4.  **Authorized JavaScript origins**:
    *   Add your Vercel domain: `https://your-project-name.vercel.app`
5.  **Authorized redirect URIs**:
    *   Add the callback URL: `https://your-project-name.vercel.app/api/auth/callback/google`
6.  Save changes.

---

## 5. Post-Deployment Verification

1.  **Check Build Logs**: Ensure the build passed without errors.
2.  **Verify Database Connection**: Open the deployed app. If the dashboard loads empty data (and not a 500 error), the DB connection is likely working.
3.  **Test Login**: Try to log in with Google. If you get an `error=400_invalid_redirect_uri`, check step 4 again.
4.  **Test PWA**: Open the site on mobile.
    *   Check if the "Install App" prompt appears (or use "Add to Home Screen").
    *   Verify the splash screen matches your manifest setup.

## 6. Updating the App

Whenever you push code to your GitHub `main` branch, Vercel will automatically trigger a new deployment.
