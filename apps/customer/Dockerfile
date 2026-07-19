# syntax=docker/dockerfile:1

FROM node:22.13.0-bookworm-slim

ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    NODE_ENV=production

RUN corepack enable

WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml* ./
COPY turbo.json ./
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/customer ./apps/customer

RUN pnpm install --frozen-lockfile

RUN pnpm build --filter @royal-spirits/customer

EXPOSE 3000

CMD pnpm --filter @royal-spirits/customer start
