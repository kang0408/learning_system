# ─── Stage 1: Builder ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo configuration
COPY package.json package-lock.json tsconfig.base.json ./

# Copy packages and web source code
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies across workspace
RUN npm ci

# Build React + Vite SPA
WORKDIR /app/apps/web
RUN npm run build

# ─── Stage 2: Nginx Runner (Production) ────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA artifacts
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
