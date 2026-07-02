FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

# ─── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/agent/package.json ./apps/agent/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile

# ─── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/agent/node_modules ./apps/agent/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/agent ./apps/agent
COPY packages/shared ./packages/shared

RUN pnpm --filter @wigit/shared build 2>/dev/null || true
RUN pnpm --filter @wigit/agent build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built output and production dependencies
COPY --from=builder /app/apps/agent/dist ./dist
COPY --from=builder /app/apps/agent/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/agent/node_modules ./apps/agent/node_modules
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 3001

CMD ["node", "dist/index.js"]
