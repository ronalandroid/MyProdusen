# Coolify Deployment

> Coolify-specific configuration. For the broader runbook (env, backup,
> restore, performance smoke test), read [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Target

- App name: `myprodusen-web-app`
- Domain: `https://myprodusen.online`
- Exposed port: `3000`
- Deploy mode: Dockerfile
- Docker network: `coolify`
- PostgreSQL alias: `myprodusen-db`
- PostgreSQL database: `myprodusen_production`
- Redis alias (optional): `myprodusen-redis`

KaffePOS or other Coolify projects must use a different DB. Never share the
`myprodusen_production` schema.

## Environment variables

Configure inside Coolify (never commit real secrets). The full list lives in
[`DEPLOYMENT.md`](./DEPLOYMENT.md). Minimum:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HOSTNAME=0.0.0.0

APP_URL=https://myprodusen.online
NEXT_PUBLIC_APP_URL=https://myprodusen.online

DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@myprodusen-db:5432/myprodusen_production
JWT_SECRET=<RANDOM_32_PLUS_CHARACTER_SECRET>

UPLOAD_DIR=/app/uploads
ATTENDANCE_SELFIE_DIR=attendance-selfies
MAX_SELFIE_SIZE_MB=1
NEXT_PUBLIC_SELFIE_MAX_WIDTH=720
NEXT_PUBLIC_SELFIE_MAX_HEIGHT=720
NEXT_PUBLIC_SELFIE_IMAGE_QUALITY=0.75
NEXT_PUBLIC_SELFIE_TARGET_SIZE_KB=300

GPS_MAX_ACCURACY_METERS=100
DEFAULT_GEOFENCE_RADIUS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100
REJECT_OUTSIDE_GEOFENCE=true
GPS_TIMESTAMP_MAX_AGE_SECONDS=120
ATTENDANCE_EXPORT_MAX_ROWS=5000

SUPERADMIN_EMAIL=<SUPERADMIN_EMAIL>
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=<STRONG_SUPERADMIN_PASSWORD>
```

After the first deploy, rotate `SUPERADMIN_PASSWORD` or remove the
`SUPERADMIN_*` keys.

## Persistent storage

Mount a persistent volume at `/app/uploads`:

```
volume source: /var/lib/coolify/volumes/myprodusen-uploads
container path: /app/uploads
```

Selfies are stored under
`/app/uploads/attendance-selfies/<year>/<month>/<employeeId>/<attendanceId>-{checkin|checkout}.<ext>`.

Checklist:

- [ ] Persistent volume mounted at `/app/uploads`.
- [ ] App user can write to the path (entrypoint creates the
      `attendance-selfies/` subdirectory lazily).
- [ ] No reverse-proxy rule exposes `/app/uploads/*` publicly.
- [ ] Volume is included in the backup schedule.
- [ ] Retention policy planned (archive/delete > 24 months) and run as a
      scheduled job, not inside request handling.

## Runtime behaviour

1. Container validates `DATABASE_URL`.
2. Container waits up to 60 seconds for PostgreSQL.
3. Container runs `npm run db:deploy` (idempotent, checksum-tracked).
4. Container optionally creates/updates the Superadmin only when all
   `SUPERADMIN_*` variables exist.
5. Container starts Next.js standalone server on `0.0.0.0:3000`.

## Scheduled tasks

Wire these in Coolify → app → Scheduled Tasks:

| Schedule (cron) | Command | Purpose |
| --------------- | ------- | ------- |
| `0 2 * * *` | `pg_dump -U postgres -d myprodusen_production -Fc -f /backups/myprodusen-$(date +\%Y\%m\%d).dump` | Daily DB dump |
| `30 2 * * *` | `rsync -a --delete /app/uploads/ /backups/uploads-$(date +\%Y\%m\%d)/` | Daily uploads sync |
| `0 3 * * 1` | `find /backups -mtime +30 -delete` | Weekly retention sweep |

## Post-deploy verification

```bash
docker ps                                         # container running
docker logs <myprodusen-web-app-container> --tail=200
curl -s https://myprodusen.online/api/health      # returns { status: "ok" }
DATABASE_URL=... npm run perf:explain              # index usage check (run on staging)
docker exec <container> node scripts/check-production-env.mjs   # env preflight
```

Then walk the 13-step end-to-end smoke test in
[`FINAL_CHECKLIST.md`](./FINAL_CHECKLIST.md).

## Migration to S3-compatible storage (future)

When traffic outgrows the local volume:

1. Implement the S3 driver behind `STORAGE_DRIVER=s3` in `lib/upload.ts`.
2. Reuse the existing key layout so URLs stay stable.
3. Continue serving through `/api/attendances/:id/selfie/{check-in|check-out}`
   so authorization stays centralised.
4. Update the backup schedule to drop the `rsync` task once S3 versioning
   covers it.
