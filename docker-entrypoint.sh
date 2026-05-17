#!/bin/sh
set -e

log() {
  printf '%s\n' "$1"
}

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"
DB_WAIT_TIMEOUT_SECONDS="${DB_WAIT_TIMEOUT_SECONDS:-60}"
DB_WAIT_INTERVAL_SECONDS="${DB_WAIT_INTERVAL_SECONDS:-2}"

export NODE_ENV="${NODE_ENV:-production}"
export PORT
export HOST
export HOSTNAME
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"
export UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"

log "MyProdusen startup: production container initializing"

log "Validating production environment"
node scripts/check-production-env.mjs

required_secret_env="NEXTAUTH_SECRET"
for name in $required_secret_env; do
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    log "ERROR: $name is required at runtime"
    exit 1
  fi
done

if ! mkdir -p "$UPLOAD_DIR" 2>/dev/null; then
  log "ERROR: UPLOAD_DIR cannot be created"
  exit 1
fi

if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs "$UPLOAD_DIR" 2>/dev/null || log "WARNING: UPLOAD_DIR ownership could not be changed; checking runtime write access"
fi

if ! su-exec nextjs:nodejs sh -c 'test -w "$UPLOAD_DIR"'; then
  log "ERROR: UPLOAD_DIR is not writable by runtime user"
  exit 1
fi

if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
  log "ERROR: NEXTAUTH_SECRET must be at least 32 characters"
  exit 1
fi

log "Waiting for PostgreSQL connection"
su-exec nextjs:nodejs node <<'NODE'
const postgres = require('postgres');

const timeoutSeconds = Number(process.env.DB_WAIT_TIMEOUT_SECONDS || 60);
const intervalSeconds = Number(process.env.DB_WAIT_INTERVAL_SECONDS || 2);
const deadline = Date.now() + timeoutSeconds * 1000;

function normalizeDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  url.searchParams.delete('schema');
  return url.toString();
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe() {
  while (Date.now() < deadline) {
    const sql = postgres(normalizeDatabaseUrl(process.env.DATABASE_URL), {
      max: 1,
      connect_timeout: Math.max(1, Math.ceil(intervalSeconds)),
      idle_timeout: 1,
    });

    try {
      await sql`select 1`;
      await sql.end({ timeout: 1 });
      console.log('PostgreSQL connection ready');
      return;
    } catch (_error) {
      await sql.end({ timeout: 1 }).catch(() => undefined);
      await sleep(intervalSeconds * 1000);
    }
  }

  console.error(`ERROR: PostgreSQL connection failed within ${timeoutSeconds}s`);
  process.exit(1);
}

probe().catch((error) => {
  console.error('ERROR: PostgreSQL readiness check failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
NODE

log "Running database migrations"
su-exec nextjs:nodejs node scripts/run-migrations.mjs
log "Database migrations complete"

if [ -n "${SUPERADMIN_EMAIL:-}" ] && [ -n "${SUPERADMIN_PASSWORD:-}" ]; then
  log "Bootstrapping superadmin from provided environment"
  su-exec nextjs:nodejs node scripts/bootstrap-superadmin.mjs
  log "Superadmin bootstrap complete"
else
  log "Skipping superadmin bootstrap; SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set"
fi

SERVER_FILE="server.js"
if ! [ -f "$SERVER_FILE" ] && [ -f ".next/standalone/server.js" ]; then
  SERVER_FILE=".next/standalone/server.js"
fi

if ! [ -f "$SERVER_FILE" ]; then
  log "ERROR: Next.js standalone server file not found"
  exit 1
fi

log "Starting Next.js on ${HOST}:${PORT}"
exec su-exec nextjs:nodejs node "$SERVER_FILE"
