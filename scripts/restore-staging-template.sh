#!/usr/bin/env bash
# MyProdusen staging restore template.
# Template only: restores to staging/test. Never use for production target.

set -euo pipefail

if [ "${CONFIRM_RESTORE_STAGING:-}" != "yes" ]; then
  echo "ERROR: set CONFIRM_RESTORE_STAGING=yes to restore staging/test." >&2
  exit 1
fi

: "${STAGING_DATABASE_URL:?STAGING_DATABASE_URL is required}"
: "${DB_DUMP_FILE:?DB_DUMP_FILE is required}"
: "${UPLOADS_ARCHIVE:?UPLOADS_ARCHIVE is required}"
: "${STAGING_UPLOAD_DIR:=/app/uploads}"

case "$STAGING_DATABASE_URL" in
  *prod*|*production*)
    echo "ERROR: STAGING_DATABASE_URL looks like production. Refusing restore." >&2
    exit 1
    ;;
esac

if [ ! -f "$DB_DUMP_FILE" ]; then
  echo "ERROR: DB_DUMP_FILE not found: $DB_DUMP_FILE" >&2
  exit 1
fi

if [ ! -f "$UPLOADS_ARCHIVE" ]; then
  echo "ERROR: UPLOADS_ARCHIVE not found: $UPLOADS_ARCHIVE" >&2
  exit 1
fi

echo "WARNING: staging/test database and uploads will be overwritten."
echo "Target DB: staging/test URL from STAGING_DATABASE_URL"
echo "Target uploads: $STAGING_UPLOAD_DIR"

echo "Restoring PostgreSQL dump to staging/test"
pg_restore \
  --dbname="$STAGING_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "$DB_DUMP_FILE"

echo "Restoring uploads archive to staging/test volume"
mkdir -p "$STAGING_UPLOAD_DIR"
CURRENT_BACKUP="${STAGING_UPLOAD_DIR}.before-restore.$(date +%Y%m%d-%H%M%S)"
if [ -d "$STAGING_UPLOAD_DIR" ] && [ "$(find "$STAGING_UPLOAD_DIR" -mindepth 1 -maxdepth 1 2>/dev/null | head -n 1)" ]; then
  mv "$STAGING_UPLOAD_DIR" "$CURRENT_BACKUP"
  mkdir -p "$STAGING_UPLOAD_DIR"
  echo "Previous staging uploads moved to $CURRENT_BACKUP"
fi

tar -xzf "$UPLOADS_ARCHIVE" -C "$(dirname "$STAGING_UPLOAD_DIR")"

if [ ! -d "$STAGING_UPLOAD_DIR" ]; then
  echo "ERROR: restored upload directory missing: $STAGING_UPLOAD_DIR" >&2
  exit 1
fi

echo "Restore complete. Next manual steps:"
echo "1. Run npm run db:deploy against staging code."
echo "2. Start staging app."
echo "3. Check /api/health."
echo "4. Verify login, attendance history, and protected selfie access."
