# Deployment Guide — Royal Spirits

## Prerequisites

- Node.js 20+
- pnpm 11+
- A PostgreSQL instance (Railway, Render, or Supabase)
- Cloudinary account (for product images)
- Twilio or MSG91 account (for OTP SMS)
- Vercel account (for frontend hosting)

## 1. Database (PostgreSQL)

Provision a PostgreSQL instance on Railway/Render/Supabase. Note the connection string.

```bash
# Set DATABASE_URL in apps/api/.env.production
# Then run migrations:
DATABASE_URL="postgresql://..." pnpm --filter @royal-spirits/api exec prisma migrate deploy
# Seed initial admin + zones:
pnpm db:seed
```

## 2. API (Railway / Render)

Deploy `apps/api` as a Node.js service.

**Build command:** `pnpm install --frozen-lockfile && pnpm --filter @royal-spirits/api run build`
**Start command:** `node apps/api/dist/index.js`
**Root directory:** repo root

Set environment variables from `apps/api/.env.production.example`.

When switching from SQLite to PostgreSQL, change `provider` in
`apps/api/prisma/schema.prisma` from `"sqlite"` to `"postgresql"` before deploying.

## 3. Customer Storefront (Vercel)

Deploy `apps/customer` as a Next.js app on Vercel.

**Root directory:** `apps/customer`
**Build command:** `pnpm install --frozen-lockfile && pnpm --filter @royal-spirits/customer run build`
**Output:** `.next`

Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API URL.
Set `NEXT_PUBLIC_EXCISE_LICENSE_NUMBER`.

The `next.config.mjs` rewrites (`/api/*` → API) are for dev only. In production,
set `NEXT_PUBLIC_API_BASE_URL` so the client fetches the API directly.

## 4. Admin Panel (Vercel)

Deploy `apps/admin` as a Vite SPA on Vercel.

**Root directory:** `apps/admin`
**Build command:** `pnpm install --frozen-lockfile && pnpm --filter @royal-spirits/admin run build`
**Output:** `dist`

Set `VITE_API_BASE_URL` to the deployed API URL.
Set `VITE_EXCISE_LICENSE_NUMBER`.

In production, the admin SPA's API calls need absolute URLs. The `lib/api.ts`
uses `/api/v1` (relative). Update it to use `VITE_API_BASE_URL` for prod,
or configure a reverse proxy.

## 5. Post-Deploy Verification

1. Visit the customer site → age gate appears → confirm → browse products
2. Admin panel → login with seeded admin credentials → add/edit products
3. Customer → add to cart → checkout → OTP login → place order (within delivery hours)
4. Admin → see new order → confirm → mark delivered
5. Customer → My Orders → see updated status

## Switching SQLite → PostgreSQL

The dev environment uses SQLite. For production:

1. Change `provider` in `apps/api/prisma/schema.prisma` to `"postgresql"`.
2. Set `DATABASE_URL` to the Postgres connection string.
3. Run `prisma migrate dev --name init` (creates migration for Postgres).
4. Run `prisma db seed` to populate admin + zones + sample products.

The schema is portable — enums are stored as TEXT on SQLite and as native
enums on Postgres (Prisma handles this automatically).
