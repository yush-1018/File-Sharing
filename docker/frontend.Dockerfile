FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/desktop/package.json ./apps/desktop/
RUN npm install -g pnpm && pnpm install --filter @linkdrop/desktop...

COPY . .
RUN pnpm --filter @linkdrop/desktop build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/desktop/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
