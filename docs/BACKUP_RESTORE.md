# Backup & Restore — MyProdusen

This document is the standalone backup and restore runbook for the VPS +
Coolify production deployment. Keep it aligned with [`DEPLOYMENT.md`](./DEPLOYMENT.md)
and [`COOLIFY.md`](./COOLIFY.md).

## Backup scope

Back up these assets together so attendance history, selfie files, and audit
records stay consistent:

1. PostgreSQL database: users, employees, attendance, KPI, leave, audit logs,
   notifications, selfie paths, and GPS metadata.
2. Persistent upload volume: `/app/uploads`, especially
   `/app/uploads/attendance-selfies`.
3. Coolify environment variables: store exported values in a password manager,
   never in git.

## Schedule

| Asset | Frequency | Retention |
| --- | --- | --- |
| PostgreSQL custom dump | Daily | 7 daily, 4 weekly, 12 monthly |
| `/app/uploads` snapshot or sync | Daily after DB dump | Match database retention |
| Environment variable export | On every config change | Latest + previous version |
| Restore drill | Quarterly on staging | Keep latest drill notes |

Use off-host storage for at least one copy. Local VPS backups alone are not
sufficient.

## PostgreSQL backup

Run from the database host or a Coolify scheduled task with access to the
PostgreSQL container/network:

```bash
BACKUP_DIR=/backups UPLOAD_DIR=/app/uploads ./scripts/backup.sh
```

Or run the database dump directly:

```bash
mkdir -p /backups/postgres
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="/backups/postgres/myprodusen-$(date +%Y%m%d-%H%M).dump"
```

If using `docker exec` against a database container:

```bash
docker exec myprodusen-db pg_dump \
  -U postgres \
  -d myprodusen_production \
  -Fc \
  -f "/backups/postgres/myprodusen-$(date +%Y%m%d-%H%M).dump"
```

## Upload volume backup

Run after the database dump finishes:

```bash
mkdir -p /backups/uploads
rsync -a --delete /app/uploads/ "/backups/uploads/myprodusen-uploads-$(date +%Y%m%d-%H%M)/"
```

For S3-compatible backup storage:

```bash
aws s3 sync /app/uploads/ s3://myprodusen-backups/uploads/ --delete
```

## Restore to staging

Never test restores directly on production.

1. Create a fresh staging PostgreSQL database with the same major PostgreSQL
   version as production.
2. Stop the staging app or put it in maintenance mode.
3. Restore the database dump:

```bash
pg_restore \
  --dbname="$STAGING_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "/backups/postgres/myprodusen-YYYYMMDD-HHMM.dump"
```

4. Restore matching uploads snapshot:

```bash
rsync -a --delete \
  /backups/uploads/myprodusen-uploads-YYYYMMDD-HHMM/ \
  /app/uploads/
```

5. Run migrations in case staging code is newer than backup:

```bash
npm run db:deploy
```

6. Restart staging app.

## Restore verification

After restore, verify these checks before declaring the backup usable:

```bash
curl -fsS https://staging.myprodusen.online/api/health
npm run release:migrations
```

Manual smoke test:

1. Login as Superadmin.
2. Open `/dashboard` and confirm employee/attendance totals load.
3. Open `/dashboard/attendance` for a historical row with selfies.
4. Confirm protected selfie endpoints return images for authorized users.
5. Confirm a cross-employee selfie request still returns `403`.
6. Export an attendance CSV and confirm an audit row is created.

## Production restore decision

Only restore production after these conditions are true:

- Incident owner approves restore window.
- Latest usable database dump and matching upload snapshot are identified.
- Staging restore drill passes.
- Current production data is backed up before overwrite.
- Users are informed about maintenance window and expected data rollback point.

## Production restore outline

1. Put production app in maintenance mode or stop the web container.
2. Take an emergency backup of current production DB and `/app/uploads`.
3. Restore PostgreSQL using `pg_restore --clean --if-exists`.
4. Restore matching `/app/uploads` snapshot.
5. Run `npm run db:deploy`.
6. Start app and check `/api/health`.
7. Run the smoke test from [`FINAL_CHECKLIST.md`](./FINAL_CHECKLIST.md).
8. Remove bootstrap-only `SUPERADMIN_*` variables if they were temporarily set.

## Security rules

- Do not commit dumps, upload snapshots, or `.env` files.
- Encrypt off-host backups.
- Limit backup access to Superadmin/DevOps only.
- Store `JWT_SECRET`, database passwords, and Resend keys in Coolify secrets or
  a password manager.
- Rotate credentials if backup storage access is exposed.
