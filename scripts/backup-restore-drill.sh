#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL required for source backup}"
: "${STAGING_RESTORE_DATABASE_URL:?STAGING_RESTORE_DATABASE_URL required for staging restore target}"

DUMP_FILE="${DUMP_FILE:-/tmp/myprodusen-backup-drill-$(date +%Y%m%d-%H%M%S).dump}"

if [[ "${STAGING_RESTORE_DATABASE_URL}" == *"myprodusen.online"* || "${STAGING_RESTORE_DATABASE_URL}" == *"prod"* ]]; then
  echo "Refusing restore: STAGING_RESTORE_DATABASE_URL looks like production." >&2
  exit 1
fi

if [[ "${DRILL_CONFIRM:-}" != "RESTORE_TO_STAGING" ]]; then
  echo "Dry run only. Export DRILL_CONFIRM=RESTORE_TO_STAGING to run staging restore." >&2
  echo "Will create dump: ${DUMP_FILE}" >&2
  pg_dump "${DATABASE_URL}" --format=custom --file="${DUMP_FILE}"
  echo "Dump created. Restore not executed." >&2
  exit 0
fi

echo "Creating backup dump: ${DUMP_FILE}" >&2
pg_dump "${DATABASE_URL}" --format=custom --file="${DUMP_FILE}"

echo "Restoring into staging target only..." >&2
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="${STAGING_RESTORE_DATABASE_URL}" "${DUMP_FILE}"

echo "Backup/restore drill complete. Now run: npm run db:deploy && npm run verify:live-routes against staging." >&2
