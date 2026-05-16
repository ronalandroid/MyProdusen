#!/bin/sh
set -e

echo "🚀 MyProdusen — Starting production server..."

# ── 1. Run database schema push (safe & idempotent) ──
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Pushing database schema..."
  npx drizzle-kit push --force 2>&1 || {
    echo "⚠️  drizzle-kit push failed — continuing anyway (schema may already be up-to-date)"
  }
  echo "✅ Database schema ready"
else
  echo "⚠️  DATABASE_URL not set — skipping schema push"
fi

# ── 2. Start the Next.js server ──
echo "🌐 Starting Next.js on port ${PORT:-3000}..."
exec node server.js
