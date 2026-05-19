# Backup & Restore — MyProdusen

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


This runbook covers production backup, staging restore drills, and emergency restore decision rules for MyProdusen on VPS + Coolify + Docker + PostgreSQL. Keep it aligned with [`DEPLOYMENT.md`](./DEPLOYMENT.md), [`COOLIFY.md`](./COOLIFY.md), and [`PRODUCTION_SMOKE_TEST.md`](./PRODUCTION_SMOKE_TEST.md).

## Safety rules

- Never reset or overwrite production database without manual incident approval.
- Never restore directly to production as a test.
- Never commit database dumps, upload archives, `.env`, or secrets.
- Never expose `/app/uploads` through public static routing.
- Always back up PostgreSQL and uploads from the same time window.
- Always verify restore on staging/test before trusting a backup.

## Backup scope

Back up these assets together so attendance history, selfie files, payroll files, and audit records stay consistent:

1. PostgreSQL database: users, employees, attendance, leave, KPI, payroll, reports, audit logs, notifications, selfie paths, and GPS metadata.
2. Persistent upload volume: `/app/uploads`.
3. Attendance selfies: `/app/uploads/attendance-selfies`.
4. Document or payslip files if present under `/app/uploads`.
5. Coolify env var inventory: store in password manager only, never in git.

## A. PostgreSQL backup

### Command

Use the safe template script when possible:

```bash
DATABASE_URL="postgresql://..." \
UPLOAD_DIR=/app/uploads \
BACKUP_ROOT=/backups/myprodusen \
./scripts/backup-production-template.sh
```

Direct `pg_dump` command:

```bash
BACKUP_ROOT=/backups/myprodusen
DATE_DIR="$(date +%F)"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_ROOT/$DATE_DIR"

pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$BACKUP_ROOT/$DATE_DIR/myprodusen-db-$STAMP.dump"
```

### Schedule

- Frequency: daily.
- Preferred time: after business hours, before upload backup.
- Storage path: `/backups/myprodusen/YYYY-MM-DD/`.
- Naming format: `myprodusen-db-YYYYMMDD-HHMMSS.dump`.
- Off-host copy: required after local backup completes.

### Verify backup file

```bash
test -s /backups/myprodusen/YYYY-MM-DD/myprodusen-db-YYYYMMDD-HHMMSS.dump
pg_restore --list /backups/myprodusen/YYYY-MM-DD/myprodusen-db-YYYYMMDD-HHMMSS.dump >/tmp/myprodusen-restore-list.txt
sha256sum /backups/myprodusen/YYYY-MM-DD/myprodusen-db-YYYYMMDD-HHMMSS.dump
```

Expected result: file exists, non-empty, `pg_restore --list` exits `0`, checksum recorded in manifest.

## B. Uploads backup

### Command

Use the safe template script with the database backup, or run uploads archive directly:

```bash
BACKUP_ROOT=/backups/myprodusen
DATE_DIR="$(date +%F)"
STAMP="$(date +%Y%m%d-%H%M%S)"
UPLOAD_DIR=/app/uploads
mkdir -p "$BACKUP_ROOT/$DATE_DIR"

tar -czf "$BACKUP_ROOT/$DATE_DIR/myprodusen-uploads-$STAMP.tar.gz" \
  -C "$(dirname "$UPLOAD_DIR")" \
  "$(basename "$UPLOAD_DIR")"
```

### Included paths

- `/app/uploads/attendance-selfies`.
- `/app/uploads/documents` if present.
- `/app/uploads/payslips` if present.
- Any future private upload subfolder under `/app/uploads`.

### Schedule and retention

| Asset | Frequency | Retention |
| --- | --- | --- |
| PostgreSQL custom dump | Daily | 7 daily, 4 weekly, 12 monthly |
| `/app/uploads` archive | Daily after DB dump | Match database retention |
| Off-host encrypted copy | Daily | Match database retention |
| Env var inventory | Every config change | Latest + previous version |
| Restore drill | Quarterly and before major launch | Keep latest drill notes |

### Verify uploads archive

```bash
test -s /backups/myprodusen/YYYY-MM-DD/myprodusen-uploads-YYYYMMDD-HHMMSS.tar.gz
tar -tzf /backups/myprodusen/YYYY-MM-DD/myprodusen-uploads-YYYYMMDD-HHMMSS.tar.gz | head
sha256sum /backups/myprodusen/YYYY-MM-DD/myprodusen-uploads-YYYYMMDD-HHMMSS.tar.gz
```

Expected result: archive exists, lists `uploads/`, and includes `uploads/attendance-selfies` when production has attendance selfies.

## C. Restore drill

Restore drills must target staging/test only.

### Restore PostgreSQL to staging/test

```bash
CONFIRM_RESTORE_STAGING=yes \
STAGING_DATABASE_URL="postgresql://staging:..." \
DB_DUMP_FILE=/backups/myprodusen/YYYY-MM-DD/myprodusen-db-YYYYMMDD-HHMMSS.dump \
UPLOADS_ARCHIVE=/backups/myprodusen/YYYY-MM-DD/myprodusen-uploads-YYYYMMDD-HHMMSS.tar.gz \
STAGING_UPLOAD_DIR=/app/uploads \
./scripts/restore-staging-template.sh
```

Direct database restore command if needed:

```bash
pg_restore \
  --dbname="$STAGING_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  /backups/myprodusen/YYYY-MM-DD/myprodusen-db-YYYYMMDD-HHMMSS.dump
```

### Restore uploads to staging/test volume

```bash
STAGING_UPLOAD_DIR=/app/uploads
UPLOADS_ARCHIVE=/backups/myprodusen/YYYY-MM-DD/myprodusen-uploads-YYYYMMDD-HHMMSS.tar.gz
mkdir -p "$STAGING_UPLOAD_DIR"
tar -xzf "$UPLOADS_ARCHIVE" -C "$(dirname "$STAGING_UPLOAD_DIR")"
```

### Restore verification

1. Run `npm run db:deploy` against staging code.
2. Start staging app.
3. Open staging `/api/health` and confirm healthy.
4. Login as Superadmin.
5. Confirm dashboard totals load.
6. Open historical attendance with selfie.
7. Confirm app can read restored selfie files.
8. Confirm employee login works.
9. Confirm attendance history works.
10. Confirm protected selfie endpoint works for authorized role.
11. Confirm employee cannot view another employee selfie.
12. Run report CSV export and confirm audit log.
13. Record drill date, backup ID, tester, result, and issues.

## D. Coolify notes

- PostgreSQL service: Coolify project service named `myprodusen-db` or configured alias.
- Production database: `myprodusen_production`.
- App container upload mount: `/app/uploads`.
- Attendance selfie path: `/app/uploads/attendance-selfies`.
- Backups path: `/backups/myprodusen/YYYY-MM-DD/` or equivalent mounted backup volume.
- Required env vars: `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `APP_URL`, `NEXT_PUBLIC_APP_URL`, `UPLOAD_DIR`, `ATTENDANCE_SELFIE_DIR`, `MAX_UPLOAD_SIZE`, `MAX_SELFIE_SIZE_MB`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- Never restore directly to production without manual approval from incident owner.
- Before production restore, take emergency backup of current production DB and uploads.

## Production restore decision

Only restore production after all conditions are true:

- Incident owner approves restore window.
- Latest usable database dump and matching upload archive are identified.
- Staging restore drill passes using that backup pair.
- Current production data is backed up before overwrite.
- Users are informed about maintenance window and rollback point.
- Roll-forward or rollback decision is documented.

## Production restore outline

1. Put production app in maintenance mode or stop web container.
2. Take emergency backup of current production database and `/app/uploads`.
3. Restore PostgreSQL using `pg_restore --clean --if-exists`.
4. Restore matching `/app/uploads` archive.
5. Run `npm run db:deploy`.
6. Start app and check `/api/health`.
7. Run [`PRODUCTION_SMOKE_TEST.md`](./PRODUCTION_SMOKE_TEST.md).
8. Remove or rotate bootstrap-only `SUPERADMIN_*` variables if used.

## Security rules

- Encrypt off-host backups.
- Restrict backup access to Superadmin/DevOps only.
- Store `JWT_SECRET`, `NEXTAUTH_SECRET`, database passwords, and Resend keys in Coolify secrets or password manager.
- Rotate credentials if backup storage access is exposed.
- Keep `/app/uploads` private; serve selfies only via protected API.
- Do not include selfie binaries, database dumps, or payroll exports in tickets unless encrypted and approved.
