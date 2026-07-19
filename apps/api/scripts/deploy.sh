#!/usr/bin/env sh
set -e

# Royal Spirits — Render deploy entrypoint for the API.
#
# The repo's schema.prisma is set to `sqlite` for local Windows dev. On Render
# we target Postgres, so we swap the provider to `postgresql` here, apply the
# schema with `prisma db push` (the committed migrations use SQLite dialect and
# don't apply to Postgres), seed, then start the server.
#
# This file runs in the repo root context (apps/api is the Render rootDir), so
# the prisma schema lives at ./prisma/schema.prisma.

SCHEMA=./prisma/schema.prisma

echo "==> Switching Prisma provider to postgresql"
sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA"

echo "==> Regenerating Prisma client for Postgres"
pnpm --filter @royal-spirits/api exec prisma generate

echo "==> Pushing schema to Postgres (db push)"
pnpm --filter @royal-spirits/api exec prisma db push --accept-data-loss --skip-generate

echo "==> Seeding database"
pnpm --filter @royal-spirits/api exec prisma db seed

echo "==> Starting API server"
exec pnpm --filter @royal-spirits/api start
