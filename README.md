# Cultivator

Mushroom cultivation internal tool built with Next.js, TypeScript, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/` - Utilities, types, and mock data
- `public/` - Static assets

## Environment Variables

Create a `.env.local` file:

```
DATABASE_URL=postgresql://...  # Neon serverless PostgreSQL (TODO)
```

## Features

- Dashboard with KPI cards and recent activity
- Batch management with filtering
- Baglet list view and tracking
- Placeholder pages for Metrics, Harvest, Status Logger, Reports
- QR code generation for batches (placeholder)
- Dark theme optimized for farm environments
- Mobile-responsive design
- PWA-ready scaffolding
