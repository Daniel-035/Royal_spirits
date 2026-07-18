# Royal Spirits — Agent Guide

Monorepo for the Royal Spirits online liquor ordering site + admin panel. See
`Liquor-Shop-Simple-PRD.md`, `Liquor-Shop-SRS.md`, `Liquor-Shop-DB-API-Spec.md`,
and `reserve_barrel color .md` for the source specs + design system.

## Layout

- `apps/customer` — Next.js (App Router) customer storefront
- `apps/admin` — Vite + React admin SPA
- `apps/api` — Express + Prisma backend
- `packages/shared` — zod schemas, TS types, constants (single source of truth)
- `packages/ui` — Reserve & Barrel design tokens + primitive components

## Commands (run from repo root)

- `pnpm dev` — start all apps in parallel (turbo)
- `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test`
- `pnpm db:migrate` — create/apply Prisma migrations
- `pnpm db:generate` — regenerate Prisma client
- `pnpm db:seed` — seed admin + sample products + zones
- `pnpm db:studio` — Prisma Studio

Always run `pnpm lint && pnpm typecheck && pnpm build` before finishing a part.

## Environment quirks (IMPORTANT)

- This Windows machine has **no Docker and no local PostgreSQL**, and PowerShell
  **script execution is disabled** (so `pnpm.ps1`/`npm.ps1` shims fail). Use the
  `.cmd` shims: `C:\Program Files\nodejs\npm.cmd` and
  `C:\Users\rishi\AppData\Roaming\npm\pnpm.cmd`. pnpm is at v11.14.0.
- Because of the above, **dev uses SQLite** (`apps/api/dev.db`). The Prisma schema
  is written to stay portable; enums are stored as TEXT on SQLite and as native
  enums on Postgres. `docker-compose.yml` is provided for Postgres when Docker is
  available. To switch: change `provider` in `schema.prisma` to `postgresql`, set
  `DATABASE_URL`, and re-run `pnpm db:migrate`.

## Decisions (from the build plan)

- Stack: pnpm + turborepo monorepo; Next.js customer, Vite admin, Express API.
- DB: PostgreSQL (prod target) / SQLite (local dev).
- ORM: Prisma. Validation: zod (in `packages/shared`, reused by API + apps).
- Auth: JWT in httpOnly cookies. Customer cookie `rs_cust`, admin cookie `rs_admin`.
- Cart: guest cart in localStorage; OTP login required only at checkout.
- Dev external services: mock OTP (logs code to console), local-disk image
  uploads behind provider interfaces. Prod flips via env (`OTP_PROVIDER`,
  `IMAGE_PROVIDER`).
- Tests: Vitest. E2E (Playwright) added in Part 5.
- Design tokens: Reserve & Barrel (charcoal/amber/off-white), Libre Caslon Text +
  Hanken Grotesk. See `packages/ui/src/tokens.css`.

## Conventions

- No comments unless requested.
- Follow existing patterns; mimic code style.
- Never commit unless explicitly asked.
- Enforce compliance server-side (age_confirmed, pincode, delivery hours, stock).
