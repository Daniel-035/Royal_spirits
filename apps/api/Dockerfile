# syntax=docker/dockerfile:1

FROM node:22.13.0-bookworm-slim

ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    NODE_ENV=production \
    CI=1

RUN corepack enable

WORKDIR /app

# Copy the full workspace so --frozen-lockfile can validate every package
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/admin ./apps/admin
COPY apps/api ./apps/api
COPY apps/customer ./apps/customer

RUN pnpm install --frozen-lockfile

# Build only the API (and its workspace deps via turbo)
RUN pnpm build --filter @royal-spirits/api

EXPOSE 4000

CMD pnpm --filter @royal-spirits/api run db:deploy && pnpm --filter @royal-spirits/api start