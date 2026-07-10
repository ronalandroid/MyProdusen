# Backup restore drill

A backup only counts once a restore of it has been rehearsed. This runbook
restores a production dump into the **on-demand staging stack**
([staging.md](staging.md)) and verifies the app boots against it — proving the
dump, the migrations, and the restore procedure all still work.

**Cadence:** run the drill monthly, and after any migration that changes core
tables (attendance, payroll, leave).

## Where dumps come from

| Source | Path | Produced by |
|--------|------|-------------|
| VPS local backups | `/backups/myprodusen/<YYYY-MM-DD>/myprodusen-db-*.dump` | `scripts/backup-production-template.sh` (Coolify scheduled task) |
| Fresh dump straight from prod | `/tmp/myprodusen-backup-drill-*.dump` | `npm run backup:drill` (dry run creates the dump only) |
| Offsite copy (R2/S3), when configured | mirror of the VPS layout | rclone/aws-cli sync of `/backups/myprodusen` |

All dumps are `pg_dump --format=custom`, so they restore with `pg_restore`.

## Drill steps

### 1. Bring up the staging stack (wiped)

```bash
cp .env.staging.example .env.staging   # first time only; fill secrets
docker compose -f docker-compose.staging.yml --env-file .env.staging down -v  # wipe old data
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d postgres
```

Only `postgres` is started — the app would run migrations against an empty DB
before the restore, which is not what we are rehearsing.

### 2. Restore the dump into the staging database

The staging Postgres does not publish a host port by default, so copy the dump
into the container and restore from inside:

```bash
DUMP=/path/to/myprodusen-db-YYYYMMDD-HHMMSS.dump
PG=$(docker compose -f docker-compose.staging.yml --env-file .env.staging ps -q postgres)

docker cp "$DUMP" "$PG":/tmp/restore.dump
docker exec -e PGPASSWORD="$STAGING_DB_PASSWORD" "$PG" \
  pg_restore --clean --if-exists --no-owner --no-privileges \
  -U "${STAGING_DB_USER:-myprodusen}" -d "${STAGING_DB_NAME:-myprodusen_staging}" /tmp/restore.dump
docker exec "$PG" rm /tmp/restore.dump
```

(Alternative: uncomment the `ports:` line for postgres in
`docker-compose.staging.yml` and run `scripts/backup-restore-drill.sh` with
`STAGING_RESTORE_DATABASE_URL` pointing at `localhost:55432` — the script
refuses URLs that look like production and requires
`DRILL_CONFIRM=RESTORE_TO_STAGING`.)

### 3. Boot the app on top of the restored data

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build app
npm run staging:logs   # watch: entrypoint runs pending migrations against the restored DB
```

This step is the real test: the migration runner
(`scripts/run-migrations.mjs`) must apply cleanly on top of production data.

### 4. Verify

- [ ] `curl -fsS http://localhost:3100/api/health` → HTTP 200, `"status":"ok"`
- [ ] Login works with a production account (or the bootstrapped superadmin)
- [ ] Spot-check row counts against prod:
  ```bash
  docker exec "$PG" psql -U myprodusen -d myprodusen_staging -c \
    'select (select count(*) from "Employee") employees, (select count(*) from "Attendance") attendances, (select count(*) from "PayrollItem") payroll_items;'
  ```
- [ ] Attendance list and payroll pages render with real data
- [ ] Note the wall-clock time of steps 2–3 — that is the floor of your
      recovery time objective (RTO)

### 5. Tear down

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging down -v
```

Always `-v`: the restored volume contains production data (PII, payroll) and
must not linger on a laptop.

## Drill log

| Date | Dump date | Restore + boot time | Result / notes |
|------|-----------|---------------------|----------------|
|      |           |                     |                |

## Failure playbook

- **`pg_restore` errors on missing roles/extensions** → re-run with
  `--no-owner --no-privileges` (already in the commands above); if an
  extension is missing, add it to the staging postgres image.
- **Migrations fail on restored data** → that is the drill catching a real
  incompatibility. Fix forward with a new migration; never edit applied ones.
- **Dump older than 24h is the newest available** → the scheduled backup is
  broken; treat as an incident, check the Coolify scheduled task first.
