# Coolify Deployment — MyProdusen

## Target

- App name: `myprodusen-web-app`
- Domain: `https://myprodusen.online`
- Exposed port: `3000`
- Deploy mode: Dockerfile
- Docker network: `coolify`
- PostgreSQL alias: `myprodusen-db`
- PostgreSQL database: `myprodusen_production`
- Redis alias: `myprodusen-redis`

KaffePOS is separate. Do not use `kaffepos-postgres` or `kaffepos_production` for this app.

## Coolify Environment Variables

Use real secret values only in Coolify.

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1

APP_URL=https://myprodusen.online
NEXT_PUBLIC_APP_URL=https://myprodusen.online
NEXTAUTH_URL=https://myprodusen.online

DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@myprodusen-db:5432/myprodusen_production

REDIS_URL=redis://:<REDIS_PASSWORD>@myprodusen-redis:6379
REDIS_PASSWORD=<REDIS_PASSWORD>
REDIS_DB=0
REDIS_MAX_RETRIES=3
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300

NEXTAUTH_SECRET=<RANDOM_32_PLUS_CHARACTER_SECRET>
JWT_SECRET=<RANDOM_32_PLUS_CHARACTER_SECRET>

UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=5242880

GPS_MAX_ACCURACY_METERS=100
DEFAULT_GEOFENCE_RADIUS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100
SESSION_TIMEOUT_HOURS=8

SUPERADMIN_EMAIL=<SUPERADMIN_EMAIL>
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=<STRONG_SUPERADMIN_PASSWORD>

NODE_OPTIONS=--max-old-space-size=2048
```

After first deploy, rotate `SUPERADMIN_PASSWORD` or remove `SUPERADMIN_*` variables if bootstrap is no longer needed.

## Runtime Behavior

1. Container validates `DATABASE_URL`.
2. Container waits up to 60 seconds for PostgreSQL.
3. Container runs `drizzle-kit push --force` once on startup.
4. Container optionally creates or updates the initial Superadmin only when all `SUPERADMIN_*` variables exist.
5. Container starts Next.js standalone server on `0.0.0.0:3000`.

`drizzle-kit push --force` is idempotent for matching schema and creates tables in an empty database. It must not be pointed at KaffePOS.

## Post-Deploy Verification

```bash
docker ps
```

```bash
docker logs <myprodusen-web-app-container> --tail=200
```

```bash
docker exec -it <postgres-container> psql -U postgres -d myprodusen_production -c "\dt"
```

```bash
curl -i https://myprodusen.online/api/health
```

Expected health response: HTTP `200` with `database.status` as `ok`. Redis is optional for health and reports optional status when unavailable.

## Troubleshooting

- If startup fails with `DATABASE_URL is required`, set `DATABASE_URL` in Coolify runtime env.
- If PostgreSQL readiness fails, confirm app and database are on Docker network `coolify` and alias is `myprodusen-db`.
- If Redis logs auth failure, confirm `REDIS_URL` uses `myprodusen-redis` and correct password.
- If tables are missing, inspect startup logs for `Running Drizzle schema sync` and `Drizzle schema sync complete`.
