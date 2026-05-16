# syntax=docker/dockerfile:1.7
# ============================================================
# MyProdusen — Production Dockerfile for Coolify / VPS
# ============================================================

# ---------- Stage 1: Dependency cache ------------------------
FROM node:22-alpine AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV npm_config_audit=false
ENV npm_config_fund=false

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --prefer-offline --no-audit --fund=false

# ---------- Stage 2: Build standalone Next.js ----------------
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV NODE_OPTIONS=--max-old-space-size=1536
ENV BUILD_HEARTBEAT_MS=15000

# Dummy DATABASE_URL keeps build-time imports safe.
# The real value is injected at runtime via Coolify env vars.
ENV DATABASE_URL="postgresql://build@localhost:5432/build"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js only. Drizzle schema sync runs at runtime, not during image build.
RUN npm run build:next

# ---------- Stage 3: Production runtime ----------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0

# Create unprivileged user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy only runtime packages needed by startup scripts outside Next.js standalone tracing.
# Avoids a second `npm ci` in the runner image and makes Coolify builds much faster.
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres
COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy drizzle migrations and startup scripts for runtime schema setup
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

# Entrypoint script: run SQL migrations then start server
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Persistent upload volume
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

ENTRYPOINT ["./docker-entrypoint.sh"]
