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
- WhatsApp bot: lives inside `apps/api` (single-process invariant — the
  `orderEvents` EventEmitter fans out to the admin SSE stream; splitting the bot
  into a separate process would require Redis pub/sub). State machine:
  GREETING → BROWSE → PRODUCT_LIST → CART → ADDRESS → NAME → AGE_CONFIRM → DONE,
  plus TRACK / CANCEL_ORDER via button replies. COD only (`paymentType: 'Cash'`;
  `paymentStatus` flips to `Paid` only when admin marks `Delivered`).
- LLM: Gemini 2.0 Flash free tier behind an `LLMProvider` interface
  (`LLM_PROVIDER=mock|gemini`). The LLM does intent + entity extraction for
  free-text messages only; the deterministic state machine stays the source of
  truth for ordering (age-gate, stock, pincode, delivery hours stay enforceable).
  Falls back to the keyword router on LLM error/timeout.
- Admin handoff: `WhatsAppSession.handoffToAdminId` — when set, the bot skips
  processing inbound messages for that phone (admin replies via the broadcast
  endpoint). No auto-expiry; admin must explicitly toggle off.
- Invoice: formatted WhatsApp text message (no PDF dep) with items, totals,
  address, excise license, and responsible-drinking disclaimer.
- Cancellation: customers can cancel only while `status === 'Ordered'`; mirrors
  `allowedStatusTransitions`. Cancelling restocks items in a transaction and
  emits `orderEvents.announceUpdate`.

## Conventions

- No comments unless requested.
- Follow existing patterns; mimic code style.
- Never commit unless explicitly asked.
- Enforce compliance server-side (age_confirmed, pincode, delivery hours, stock).
