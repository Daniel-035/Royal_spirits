#!/usr/bin/env sh
set -e

# Royal Spirits — Render deploy entrypoint for the API.
#
# The repo's schema.prisma is set to `sqlite` for local Windows dev. On Render
# we target Postgres, so we swap the provider to `postgresql` here, apply the
# schema with `prisma db push` (the committed migrations use SQLite dialect and
# don't apply to Postgres), seed, then start the server.
#
# This script runs from the repo root (Render startCommand context), so the
# Prisma schema lives at apps/api/prisma/schema.prisma.

API_DIR=apps/api
SCHEMA=$API_DIR/prisma/schema.prisma

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
