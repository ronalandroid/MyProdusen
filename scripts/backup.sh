#!/bin/bash
# MyProdusen Backup Script
# Creates backups of database and uploads directory

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/uploads"

log_info "Starting backup process..."

# Backup database
log_info "Backing up database..."
DB_BACKUP_FILE="$BACKUP_DIR/database/myprodusen_db_$DATE.sql.gz"

if pg_dump "$DATABASE_URL" | gzip > "$DB_BACKUP_FILE"; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    log_info "Database backup completed: $DB_BACKUP_FILE ($DB_SIZE)"
else
    log_error "Database backup failed"
    exit 1
fi

# Backup uploads directory
log_info "Backing up uploads directory..."
UPLOADS_DIR="${UPLOAD_DIR:-./public/uploads}"
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads/myprodusen_uploads_$DATE.tar.gz"

if [ -d "$UPLOADS_DIR" ]; then
    if tar -czf "$UPLOADS_BACKUP_FILE" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"; then
        UPLOADS_SIZE=$(du -h "$UPLOADS_BACKUP_FILE" | cut -f1)
        log_info "Uploads backup completed: $UPLOADS_BACKUP_FILE ($UPLOADS_SIZE)"
    else
        log_warn "Uploads backup failed (non-critical)"
    fi
else
    log_warn "Uploads directory not found: $UPLOADS_DIR"
fi

# Clean old backups
log_info "Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR/database" -name "myprodusen_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR/uploads" -name "myprodusen_uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

log_info "Backup process completed successfully"

# List recent backups
log_info "Recent backups:"
ls -lh "$BACKUP_DIR/database" | tail -5
ls -lh "$BACKUP_DIR/uploads" | tail -5
