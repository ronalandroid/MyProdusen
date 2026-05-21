#!/bin/bash
# MyProdusen Restore Script
# Restores database and uploads from backup

set -e

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

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"

# Parse arguments
DB_BACKUP_FILE=""
UPLOADS_BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --db)
            DB_BACKUP_FILE="$2"
            shift 2
            ;;
        --uploads)
            UPLOADS_BACKUP_FILE="$2"
            shift 2
            ;;
        --list)
            log_info "Available database backups:"
            ls -lh "$BACKUP_DIR/database" 2>/dev/null || log_warn "No database backups found"
            echo ""
            log_info "Available uploads backups:"
            ls -lh "$BACKUP_DIR/uploads" 2>/dev/null || log_warn "No uploads backups found"
            exit 0
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --db FILE         Restore database from FILE"
            echo "  --uploads FILE    Restore uploads from FILE"
            echo "  --list            List available backups"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --list"
            echo "  $0 --db /backups/database/myprodusen_db_20260515.dump"
            echo "  $0 --db backup.dump --uploads uploads.tar.gz"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if at least one backup file is specified
if [ -z "$DB_BACKUP_FILE" ] && [ -z "$UPLOADS_BACKUP_FILE" ]; then
    log_error "No backup file specified. Use --db or --uploads option."
    echo "Use --help for usage information"
    exit 1
fi

# Confirm restore operation
log_warn "WARNING: This will overwrite existing data!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Restore database
if [ -n "$DB_BACKUP_FILE" ]; then
    if [ ! -f "$DB_BACKUP_FILE" ]; then
        log_error "Database backup file not found: $DB_BACKUP_FILE"
        exit 1
    fi
    
    log_info "Restoring database from: $DB_BACKUP_FILE"
    
    # Backups created by scripts/backup.sh use pg_dump --format=custom.
    if [[ "$DB_BACKUP_FILE" == *.dump ]]; then
        if pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL" "$DB_BACKUP_FILE"; then
            log_info "Database restored successfully"
        else
            log_error "Database restore failed"
            exit 1
        fi
    elif [[ "$DB_BACKUP_FILE" == *.gz ]]; then
        if gunzip < "$DB_BACKUP_FILE" | psql "$DATABASE_URL"; then
            log_info "Database restored successfully"
        else
            log_error "Database restore failed"
            exit 1
        fi
    else
        if psql "$DATABASE_URL" < "$DB_BACKUP_FILE"; then
            log_info "Database restored successfully"
        else
            log_error "Database restore failed"
            exit 1
        fi
    fi
fi

# Restore uploads
if [ -n "$UPLOADS_BACKUP_FILE" ]; then
    if [ ! -f "$UPLOADS_BACKUP_FILE" ]; then
        log_error "Uploads backup file not found: $UPLOADS_BACKUP_FILE"
        exit 1
    fi
    
    log_info "Restoring uploads from: $UPLOADS_BACKUP_FILE"
    UPLOADS_DIR="${UPLOAD_DIR:-/app/uploads}"
    
    # Backup current uploads before restore
    if [ -d "$UPLOADS_DIR" ]; then
        BACKUP_CURRENT="$UPLOADS_DIR.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "Backing up current uploads to: $BACKUP_CURRENT"
        mv "$UPLOADS_DIR" "$BACKUP_CURRENT"
    fi
    
    # Extract uploads
    PARENT_DIR=$(dirname "$UPLOADS_DIR")
    if tar -xzf "$UPLOADS_BACKUP_FILE" -C "$PARENT_DIR"; then
        log_info "Uploads restored successfully"
    else
        log_error "Uploads restore failed"
        # Restore backup if extraction failed
        if [ -d "$BACKUP_CURRENT" ]; then
            log_info "Restoring previous uploads..."
            mv "$BACKUP_CURRENT" "$UPLOADS_DIR"
        fi
        exit 1
    fi
fi

log_info "Restore process completed successfully"
