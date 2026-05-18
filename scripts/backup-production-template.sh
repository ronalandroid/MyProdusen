#!/usr/bin/env bash
# MyProdusen production backup template.
# Template only: set env vars in Coolify or shell. Do not commit real credentials.

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${UPLOAD_DIR:=/app/uploads}"
: "${BACKUP_ROOT:=/backups/myprodusen}"
: "${ATTENDANCE_SELFIE_DIR:=attendance-selfies}"

DATE_DIR="$(date +%F)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${BACKUP_ROOT}/${DATE_DIR}"
DB_FILE="${OUT_DIR}/myprodusen-db-${STAMP}.dump"
UPLOADS_FILE="${OUT_DIR}/myprodusen-uploads-${STAMP}.tar.gz"
MANIFEST_FILE="${OUT_DIR}/manifest-${STAMP}.txt"

mkdir -p "$OUT_DIR"
umask 077

echo "Starting MyProdusen backup template"
echo "Output directory: $OUT_DIR"

echo "Backing up PostgreSQL with pg_dump"
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$DB_FILE"

echo "Backing up uploads volume"
if [ ! -d "$UPLOAD_DIR" ]; then
  echo "ERROR: UPLOAD_DIR not found: $UPLOAD_DIR" >&2
  exit 1
fi

tar -czf "$UPLOADS_FILE" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"

{
  echo "backup_timestamp=$STAMP"
  echo "database_dump=$DB_FILE"
  echo "uploads_archive=$UPLOADS_FILE"
  echo "upload_dir=$UPLOAD_DIR"
  echo "attendance_selfie_dir=${UPLOAD_DIR%/}/$ATTENDANCE_SELFIE_DIR"
  echo "database_dump_sha256=$(sha256sum "$DB_FILE" | awk '{print $1}')"
  echo "uploads_archive_sha256=$(sha256sum "$UPLOADS_FILE" | awk '{print $1}')"
  echo "database_dump_size=$(du -h "$DB_FILE" | awk '{print $1}')"
  echo "uploads_archive_size=$(du -h "$UPLOADS_FILE" | awk '{print $1}')"
} > "$MANIFEST_FILE"

echo "Verifying backup files"
test -s "$DB_FILE"
test -s "$UPLOADS_FILE"
test -s "$MANIFEST_FILE"

echo "Backup complete"
echo "DB: $DB_FILE"
echo "Uploads: $UPLOADS_FILE"
echo "Manifest: $MANIFEST_FILE"
echo "Copy backups off-host and run restore drill on staging."
