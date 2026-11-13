# Satvik Swaad — Multi-Stage Production Dockerfile
# Authority: Decision D1, Ticket T-020
# Target: Cloud Run (min 1 instance) or Render Paid (Always-On)
# Runtime: Node.js 22 LTS (Alpine Linux)

# ── Stage 1: Builder ──
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm ci

# Copy shared models and backend source
WORKDIR /app
COPY shared/ ./shared/
COPY backend/ ./backend/

WORKDIR /app/backend
RUN npm run build

# ── Stage 2: Runtime ──
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache dumb-init

# Copy package manifests and install only production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled backend distribution and shared files
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/src/shared ./src/shared

# Run as non-privileged node user
USER node

EXPOSE 5000

# Health check against backend health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
