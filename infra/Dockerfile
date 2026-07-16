FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json apps/server/
COPY packages/ packages/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @linkdrop/server...

# Copy server source
COPY apps/server/ apps/server/

# Build
RUN pnpm --filter @linkdrop/server build

# ── Production stage ────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/server/package.json apps/server/
COPY --from=builder /app/packages/ packages/

RUN pnpm install --frozen-lockfile --prod --filter @linkdrop/server...

COPY --from=builder /app/apps/server/dist apps/server/dist/

# Create upload directory
RUN mkdir -p apps/server/uploads

EXPOSE 8080

WORKDIR /app/apps/server
CMD ["node", "dist/index.js"]
