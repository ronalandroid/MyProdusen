# Deployment Guide — VPS + Coolify

> Production hosting target: a Linux VPS (Ubuntu 22.04 LTS or newer) running
> Docker + Coolify. PostgreSQL and (optionally) Redis run as Coolify-managed
> services on the same network.

## 1. Required environment variables

Configure these in the Coolify app environment. Anything tagged "secret"
must never be committed.

| Key | Notes |
| --- | ----- |
| `NODE_ENV=production` | Required. Triggers strict `JWT_SECRET` validation in `lib/auth.ts`. |
| `DATABASE_URL` | secret — `postgresql://user:pass@host:5432/db`. Coolify alias `myprodusen-db`. |
| `JWT_SECRET` | secret, ≥ 32 chars. Production startup throws if missing. |
| `NEXT_PUBLIC_APP_URL` / `APP_URL` | The public domain. |
| `STORAGE_DRIVER=local` | Future S3 driver shares the same key layout. |
| `UPLOAD_DIR=/app/uploads` | Mount point of the persistent volume. |
| `ATTENDANCE_SELFIE_DIR=attendance-selfies` | Subdirectory under `UPLOAD_DIR`. Runtime defaults to this value if omitted. |
| `MAX_SELFIE_SIZE_MB=1` | Backend hard cap. Runtime defaults to this value if omitted. |
| `NEXT_PUBLIC_SELFIE_MAX_WIDTH=720` / `MAX_HEIGHT=720` / `IMAGE_QUALITY=0.75` / `TARGET_SIZE_KB=300` | Client-side compression knobs. Runtime defaults exist, but set them in Coolify for explicit config. |
| `GPS_MAX_ACCURACY_METERS=100` | Reject any fix above this. Runtime defaults to this value if omitted. |
| `DEFAULT_GEOFENCE_RADIUS_METERS=100` | Fallback radius. Runtime defaults to this value if omitted. |
| `REJECT_OUTSIDE_GEOFENCE=true` | Set to `false` to send outside-radius attempts to the pending-review queue. Runtime defaults to `true`. |
| `GPS_TIMESTAMP_MAX_AGE_SECONDS=120` | Set to `0` to disable freshness check. Runtime defaults to `120`. |
| `ATTENDANCE_EXPORT_MAX_ROWS=5000` | Cap on CSV/XLSX export rows. Runtime defaults to this value if omitted. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | secret — email delivery. |
| `REDIS_URL` / `REDIS_PASSWORD` | secret, optional. App degrades gracefully if Redis is unavailable. |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD` | secret — first-deploy bootstrap only. Rotate or remove after first login. |

## 2. Docker

The project's `Dockerfile` builds the Next.js standalone output. The
`docker-entrypoint.sh` script:

1. Runs the production environment validator and fails fast on missing or unsafe
   required env vars.
2. Validates `NEXTAUTH_SECRET` for runtime session compatibility.
3. Waits up to 60 seconds for PostgreSQL.
4. Runs `npm run db:deploy` (idempotent migration runner).
5. Optionally bootstraps the superadmin if `SUPERADMIN_*` env vars exist.
6. Boots Next.js on `0.0.0.0:3000`.

`.dockerignore` excludes secrets, dependencies, build output, and uploads.

## 3. Coolify setup

1. Create a new Coolify app from the GitHub repo.
2. Attach a managed PostgreSQL service. Use a dedicated database name
   (e.g. `myprodusen_production`) — never share a DB with other Coolify apps.
3. Configure the env vars from section 1.
4. Mount a persistent volume at `/app/uploads`. Selfies live under
   `/app/uploads/attendance-selfies/<year>/<month>/<employeeId>/<attendanceId>-{checkin|checkout}.<ext>`.
5. Healthcheck path: `/api/health`.
6. Build command: `npm run build`. Start command: `npm run start`.

## 4. Storage layout

```
/app/uploads/
└── attendance-selfies/
    └── 2026/
        └── 05/
            └── <employeeId>/
                ├── <attendanceId>-checkin.webp
                └── <attendanceId>-checkout.webp
```

Selfies are compressed in the browser (≤ 720×720, quality 0.75, target ≤ 300
KB) before they ever reach the server. PostgreSQL stores only the URL path,
size, and MIME metadata. Migrating to S3-compatible storage later requires
swapping the driver in `lib/upload.ts` and keeping the same key layout.

## 5. Database safety

- Never run destructive Drizzle commands in production.
- Commit `drizzle/migrations/**` before deploy.
- `npm run db:deploy` is idempotent; it tracks every applied SQL file in the
  `_myprodusen_migrations` table with a SHA-256 checksum.
- For a brand-new database, the script also baselines existing-object
  migrations so `0004_attendance_exceptions.sql` does not double-run.
- Test every migration on staging before production.

## 6. Performance verification

Run on staging immediately after a deploy:

```bash
DATABASE_URL=postgresql://staging:... npm run perf:explain
```

The script outputs `EXPLAIN (ANALYZE, BUFFERS)` for the canonical dashboard,
report, and search queries. Confirm:

- Report queries use `Attendance_employeeId_checkInTime_idx` and
  `Attendance_status_checkInTime_idx`.
- Search queries hit `Employee_division_idx` and the new
  `WorkLocation_*` indexes (or the trigram extension if added).
- No sequential scans on tables larger than ~10k rows.

## 7. Backup & restore

### What to back up

1. PostgreSQL database (selfie path + GPS metadata).
2. Persistent volume `/app/uploads` (the actual selfie image files).
3. Coolify environment variables (separately, in a password manager).

### Daily PostgreSQL backup

```bash
docker exec myprodusen-db pg_dump \
  -U postgres -d myprodusen_production -Fc \
  -f /backups/myprodusen-$(date +%Y%m%d).dump
```

Retention: 7 daily, 4 weekly, 12 monthly snapshots, off-host.

### Daily uploads backup

```bash
rsync -a --delete /app/uploads/ /backups/uploads-$(date +%Y%m%d)/
```

Or sync to S3-compatible storage:

```bash
aws s3 sync /app/uploads/ s3://myprodusen-backups/uploads/
```

### Restore drill

1. Provision a fresh PostgreSQL container with the same major version.
2. `docker exec -i myprodusen-db pg_restore -U postgres -d myprodusen_production -c < backup.dump`
3. Restore `/app/uploads/` from the matching dated snapshot.
4. Run `npm run db:deploy` to apply any newer migrations.
5. Smoke-test:
   - Login as Superadmin.
   - Open `/dashboard/attendance` history for an employee with selfies.
   - Confirm `GET /api/attendances/:id/selfie/check-in` returns the image.
6. Switch traffic only after the smoke test passes.

Run a restore drill on staging at least once per quarter.

## 8. Scheduled jobs

Set these up in Coolify's "Scheduled Tasks" panel (or as cron entries on the
host). All times are server local time.

| Schedule | Command | Purpose |
| -------- | ------- | ------- |
| Daily 02:00 | `pg_dump -U postgres -d myprodusen_production -Fc -f /backups/myprodusen-$(date +%Y%m%d).dump` | DB backup |
| Daily 02:30 | `rsync -a --delete /app/uploads/ /backups/uploads-$(date +%Y%m%d)/` | Uploads backup |
| Weekly Mon 03:00 | `find /backups -mtime +30 -delete` | Retention sweep |
| Monthly 1st 04:00 | (Future) selfie retention sweep older than 24 months | Storage hygiene |

## 9. Observability

- Healthcheck: `GET /api/health` returns `{ status: "ok" }` and basic DB ping.
- Audit log: query `AuditLog` for forensics. Sensitive actions logged today:
  `CHECK_IN`, `CHECK_OUT`, `CHECK_IN_GPS_*`, `CHECK_OUT_GPS_*`,
  `SELFIE_VIEW`, `INVALID_SELFIE_ACCESS`, `EXPORT`, `APPROVE`, `REJECT`,
  `LEAVE_*`, `KPI_*`, `ATTENDANCE_REJECTED_*`.
- Logs: see `lib/logger`. Secrets and connection strings are redacted.

## 10. Release runbook

Run these commands in order. Each gate must pass before moving to the next.

```bash
# 1. Code health gate (run on the developer machine before pushing).
npm run release:check
#    ↳ runs lint, full vitest suite, next build, and the migration-coverage
#      check (scripts/check-migrations-coverage.mjs).

# 2. (On the deploy target) full gate including production env validation.
npm run release:check:full
#    ↳ same as above plus scripts/check-production-env.mjs. Only passes
#      when every documented production env key is set and well-formed.

# 3. Apply database migrations on the target environment.
DATABASE_URL=postgresql://… npm run db:deploy

# 4. (One-time) bootstrap the superadmin if SUPERADMIN_* env keys are set.
SUPERADMIN_EMAIL=… SUPERADMIN_PASSWORD=… npm run bootstrap:superadmin

# 5. Validate index usage on the populated staging database.
DATABASE_URL=postgresql://staging:… npm run perf:explain

# 6. Walk the 13-step end-to-end smoke test from docs/FINAL_CHECKLIST.md.

# 7. Promote: `coolify deploy …` (or via the Coolify dashboard).
```

If any step fails, **do not proceed** until the failure is fixed. The
audit log and the env preflight script are the canonical guards against
silent regressions.
