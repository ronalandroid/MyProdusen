# ============================================================
# MyProdusen — Production Dockerfile for Coolify / VPS
# ============================================================

# ---------- Stage 1: Install all deps + build -----------------
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Dummy DATABASE_URL so drizzle-kit generate succeeds at build time
# The real value is injected at runtime via Coolify env vars.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Drizzle client & build Next.js
RUN npm run db:generate
RUN npm run build:next

# ---------- Stage 2: Production image -------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create unprivileged user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy drizzle schema + migrations so db:push works at runtime
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json

# Install only drizzle-kit + postgres driver for runtime migrations
RUN npm install --no-save drizzle-kit drizzle-orm postgres

# Entrypoint script: run schema push then start server
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Persistent upload volume
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

ENTRYPOINT ["./docker-entrypoint.sh"]
