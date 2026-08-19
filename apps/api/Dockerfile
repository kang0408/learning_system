# ─── Stage 1: Base Image ───────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# ─── Stage 2: Builder ──────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy root monorepo config
COPY package.json package-lock.json tsconfig.base.json ./

# Copy packages and api source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all dependencies across workspace
RUN npm ci

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# ─── Stage 3: Production Runner ───────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy workspace package manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma Client for runner
WORKDIR /app/apps/api
RUN npx prisma generate

# Copy compiled JavaScript output and public assets from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/public ./public

# Secure non-root user
RUN chown -R node:node /app
USER node

EXPOSE 4000

# Start production server
CMD ["node", "dist/server.js"]
