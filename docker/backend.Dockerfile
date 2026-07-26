FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
RUN npm install -g pnpm && pnpm install --filter @linkdrop/server...

COPY . .
RUN pnpm --filter @linkdrop/server build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app

EXPOSE 8080
CMD ["node", "apps/server/dist/index.js"]
