# Coolify Deployment — MyProdusen

## Production Architecture

```txt
Browser
  ↓ HTTPS
myprodusen.online
  ↓ Coolify / Traefik SSL proxy
myprodusen-web-app container :3000
  ↓ Docker network: coolify
PostgreSQL: myprodusen-db / myprodusen_production
Redis: myprodusen-redis
Persistent uploads: /app/uploads
```

Production is hosted on a Contabo VPS through Coolify. KaffePOS is a separate project and must not share MyProdusen database, Redis, app settings, or deployment commands.

## Production Target

- App name: `myprodusen-web-app`
- App UUID: `llj9s86rrpnnq06a0dyq1aq1`
- Domain: `https://myprodusen.online`
- App port: `3000`
- Listen address: `0.0.0.0:3000`
- Docker network: `coolify`
- PostgreSQL host: `myprodusen-db`
- PostgreSQL database: `myprodusen_production`
- Redis host: `myprodusen-redis`
- Upload directory: `/app/uploads`

## Required Environment Variables

Use real secret values only in Coolify. Keep repository files placeholder-only.

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1

DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@myprodusen-db:5432/myprodusen_production

APP_URL=https://myprodusen.online
NEXT_PUBLIC_APP_URL=https://myprodusen.online
NEXTAUTH_URL=https://myprodusen.online
CORS_ORIGIN=https://myprodusen.online

JWT_SECRET=<RANDOM_32_PLUS_CHARACTER_SECRET>
NEXTAUTH_SECRET=<RANDOM_32_PLUS_CHARACTER_SECRET>

REDIS_URL=redis://:<REDIS_PASSWORD>@myprodusen-redis:6379
REDIS_PASSWORD=<REDIS_PASSWORD>
REDIS_DB=0
REDIS_MAX_RETRIES=3
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300

UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=5242880
DEFAULT_GEOFENCE_RADIUS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100
GPS_MAX_ACCURACY_METERS=100
SESSION_TIMEOUT_HOURS=8

SUPERADMIN_EMAIL=<SUPERADMIN_EMAIL>
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=<STRONG_SUPERADMIN_PASSWORD>
```

`SUPERADMIN_*` variables are optional after first bootstrap. Remove or rotate `SUPERADMIN_PASSWORD` after first successful Superadmin login.

## Coolify App Settings

- Build mode: `Dockerfile`
- Exposed port: `3000`
- Domain: `https://myprodusen.online`
- Network: `coolify`
- Health endpoint: `/api/health`
- Persistent volume: mount app upload storage to `/app/uploads`
- Build command override: none
- Start command override: none; Docker entrypoint handles startup

## DNS and SSL

- DNS `A` record for `myprodusen.online` points to the Contabo VPS IP.
- Coolify/Traefik manages HTTPS certificate issuance and renewal.
- Keep `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, and `CORS_ORIGIN` aligned with `https://myprodusen.online`.


## Realtime Settings

- Realtime endpoint: `/api/realtime`
- Transport: Server-Sent Events (SSE)
- Redis pub/sub channel: `myprodusen:realtime`
- No extra WebSocket process or manual server is required.
- If Redis is unavailable, SSE heartbeat remains active and UI falls back to normal refresh.

## Database Migration Strategy

Startup uses committed SQL migrations, not `drizzle-kit`, so runtime containers do not need manual package installation.

1. `docker-entrypoint.sh` validates required runtime env vars without printing secret values.
2. Startup verifies `UPLOAD_DIR` exists and is writable.
3. Startup waits for PostgreSQL with a timeout.
4. Startup runs `node scripts/run-migrations.mjs`.
5. Migration runner creates `_myprodusen_migrations` if missing.
6. Migration runner reads `drizzle/migrations/*.sql` in sorted order.
7. Migration runner skips files already tracked in `_myprodusen_migrations`.
8. Migration runner baselines files whose objects already exist in a manually-created production DB.
9. Migration runner applies missing migrations inside transactions when possible.
10. Startup bootstraps Superadmin only when all `SUPERADMIN_*` env vars exist.
11. Startup launches Next.js standalone server on `0.0.0.0:3000`.

Rules:

- Never run destructive schema reset in production.
- Never run `npm install` inside a running production container.
- Never run `drizzle-kit push` manually after deploy.
- Add new schema changes as committed SQL migrations.
- Keep `npm run db:generate` clean before release.

## Deploy Checklist

1. Confirm GitHub branch contains latest Dockerfile, entrypoint, migrations, and docs.
2. Confirm Coolify env vars use production values and no placeholders.
3. Confirm app is attached to Docker network `coolify`.
4. Confirm PostgreSQL alias is `myprodusen-db`.
5. Confirm Redis alias is `myprodusen-redis`.
6. Confirm persistent upload volume targets `/app/uploads`.
7. Trigger Coolify deploy for `myprodusen-web-app`.
8. Watch logs for migration and startup messages.
9. Verify `/api/health` and main page return HTTP `200`.

## Verification Commands

```bash
docker ps
```

```bash
docker logs <container> --tail=200
```

```bash
curl -I https://myprodusen.online/api/health
```

```bash
curl -I https://myprodusen.online
```

```bash
psql -c "\dt"
```

Expected results:

- App container is running and healthy.
- Logs show `PostgreSQL connection ready`, `Database migrations complete`, and `Starting Next.js on 0.0.0.0:3000`.
- Health endpoint returns HTTP `200`.
- Main page returns HTTP `200`.
- Database contains MyProdusen tables and `_myprodusen_migrations`.

## Rollback Steps

1. In Coolify, redeploy the previous successful image or previous Git commit.
2. Do not reset or drop PostgreSQL data.
3. If a migration failed before tracking, inspect logs and fix forward with a new migration.
4. If app boot fails from env validation, restore the previous Coolify env values.
5. Re-run health and database verification commands after rollback.

## Troubleshooting

### `drizzle-kit: not found`

The production entrypoint no longer calls `drizzle-kit`. If this appears, Coolify is running an old image. Redeploy with fresh build cache.

### Empty Database Tables

Check logs for `Migration applying:` and `Migration applied:`. Confirm `DATABASE_URL` points to `myprodusen-db:5432/myprodusen_production`. Confirm `drizzle/migrations/*.sql` exists in the image.

### Existing Tables But No Migration Tracking

Runner baselines migration files when all objects in a file already exist. After successful startup, `_myprodusen_migrations` should contain applied or baselined filenames.

### Migration Failure

Read the first `ERROR: Database migration failed` block in app logs. The runner redacts database URLs. Fix SQL in a new commit and redeploy. Do not drop production data automatically.

### `DATABASE_URL` Connection Failure

Confirm PostgreSQL alias is `myprodusen-db`, database is `myprodusen_production`, credentials are correct, and both services are on `coolify` network.

### Redis Auth Failure

Confirm `REDIS_URL=redis://:<REDIS_PASSWORD>@myprodusen-redis:6379`. Redis is treated as optional for health; cache features may degrade until Redis is fixed.

### Upload Directory Not Writable

Confirm Coolify persistent volume mounts to `/app/uploads` and allows the container runtime user to write. Startup fails clearly if the directory cannot be created or written.

### Long Next.js Build On VPS

Keep `NEXT_TELEMETRY_DISABLED=1`. If VPS memory is tight, set `NODE_OPTIONS=--max-old-space-size=2048` in Coolify. Docker build uses a dummy `DATABASE_URL` and must not contact production PostgreSQL.

### Middleware / Proxy Warning

Next.js 16 warns that `middleware` is deprecated in favor of `proxy`. Do not rename middleware during deployment cleanup unless auth routing is tested end-to-end. Current warning is non-blocking.
