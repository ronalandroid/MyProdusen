# Staging environment

MyProdusen has no always-on staging server by deliberate decision: the
production VPS is resource-constrained, and a second permanent app + Postgres +
Redis stack on it would compete with production for RAM/CPU. Instead, staging is
an **on-demand full stack** you spin up locally (or on any Docker host) to
rehearse a release, run E2E, or reproduce a bug against a production-like build,
then tear down.

It uses the **same `Dockerfile` that ships to production**, so the standalone
build, entrypoint migrations, and superadmin bootstrap behave exactly as in prod
— but against throwaway, isolated data.

## First run

```bash
cp .env.staging.example .env.staging
# edit .env.staging: set the DB password and two >=32-char secrets
#   openssl rand -base64 48   # for STAGING_JWT_SECRET and STAGING_NEXTAUTH_SECRET

npm run staging:up      # build + start app + Postgres + Redis
```

The app comes up on `http://localhost:3100` (override with `STAGING_APP_PORT`).
Migrations run automatically on boot; if you set `STAGING_SUPERADMIN_*`, a
superadmin is bootstrapped.

```bash
npm run staging:logs    # follow app logs
npm run staging:down    # stop, KEEP data volumes
docker compose -f docker-compose.staging.yml --env-file .env.staging down -v   # stop + WIPE data
```

## Notes

- **Isolation**: dedicated containers, network, and named volumes
  (`staging_pgdata`, `staging_redisdata`, `staging_uploads`). Nothing touches
  production.
- **Secrets**: `.env.staging` is gitignored. Never put production secrets here —
  generate fresh staging-only values.
- **CSP**: staging runs the nonce policy in report-only mode
  (`CSP_NONCE_REPORT_ONLY=true`) so a misconfiguration can't blank the page mid
  rehearsal. Production stays enforced.
- **Redis/realtime**: wired to the bundled Redis, so SSE/realtime features work
  the same as production.
- **Health**: `curl http://localhost:3100/api/health` — same payload as prod
  (db/redis/disk/memory checks + version).

## Promoting to a hosted staging later

If a dedicated staging host is provisioned, this compose file is the blueprint:
point a Coolify app at a `staging` branch with a separate Postgres + Redis and
the same env keys, and add a `staging.myprodusen.online` DNS record. No app code
changes are required.
