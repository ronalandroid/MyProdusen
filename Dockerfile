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

# Next.js native SWC/image packages run faster and more reliably on Alpine with
# glibc compatibility available. Without this, low-resource VPS builders can
# fall back to slower paths and hit Coolify's deployment command timeout.
RUN apk add --no-cache libc6-compat

COPY package*.json ./
# Install full dependency graph for the builder stage. Next/Tailwind/TypeScript
# build tooling lives in devDependencies, while the final runner still copies
# only the standalone output plus explicit runtime packages.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --fund=false

# ---------- Stage 2: Build standalone Next.js ----------------
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
# Sentry source-map generation pushes the build past the old 1024 MB heap.
# Give it more room and drop to a single build worker so peak memory stays
# bounded on the low-resource builder.
ENV NODE_OPTIONS=--max-old-space-size=1536
ENV BUILD_HEARTBEAT_MS=5000
ENV NEXT_PRIVATE_BUILD_WORKER=1
ENV NEXT_BUILD_CPUS=1

RUN apk add --no-cache libc6-compat

# Dummy build-time env keeps imports safe.
# Real values are injected at runtime via Coolify env vars.
ENV DATABASE_URL "postgresql://build@localhost:5432/build"
ENV JWT_SECRET "build-only-jwt-secret-0000000000000000000000000000000000000000"
ENV NEXTAUTH_SECRET "build-only-nextauth-secret-0000000000000000000000000000000000"
ENV APP_URL "http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL "http://localhost:3000"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js only. Drizzle schema sync runs at runtime, not during image build.
# Cache Next build artifacts so Coolify rebuilds are faster and less likely to hit resource limits.
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build:next

# ---------- Stage 3: Production runtime ----------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0

# Create unprivileged user
RUN apk add --no-cache curl su-exec && \
    addgroup --system --gid 1001 nodejs && \
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

# Persistent upload volume.
# Do not recursively chown /app here: Coolify's low-resource builders can fail
# after the Next.js standalone tree is copied. Runtime files copied above already
# use the right owner where needed, and the entrypoint validates upload writes.
RUN install -d -o nextjs -g nodejs /app/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health >/dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
