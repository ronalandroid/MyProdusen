# Deployment — MyProdusen

> Canonical deployment, Coolify, redeploy, and production smoke guide.

> Role lock: production UI/login/access uses only `SUPERADMIN` and `EMPLOYEE`; `ADMIN_HR` and `SUPERVISOR` are historical database enum values only and must be denied in production access.

## Target

- VPS.
- Coolify.
- Docker / Next.js standalone container.
- PostgreSQL service.
- Persistent private upload volume at `/app/uploads`.

## Required Environment

```env
DATABASE_URL=
JWT_SECRET=
NEXTAUTH_SECRET=
APP_URL=
NEXT_PUBLIC_APP_URL=
NODE_ENV=production
UPLOAD_DIR=/app/uploads
ATTENDANCE_SELFIE_DIR=attendance-selfies
MAX_UPLOAD_SIZE=
MAX_SELFIE_SIZE_MB=1
GPS_MAX_ACCURACY_METERS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100
REJECT_OUTSIDE_GEOFENCE=true
GPS_TIMESTAMP_MAX_AGE_SECONDS=120
ATTENDANCE_EXPORT_MAX_ROWS=5000
RESEND_API_KEY=
RESEND_FROM_EMAIL=
SUPERADMIN_EMAIL=
SUPERADMIN_PASSWORD=
PAYROLL_MODULE_ENABLED=
PAYROLL_MUTATION_ENABLED=
APP_VERSION=
GIT_COMMIT_SHA=
BUILD_TIME=
```

Secrets must be configured in Coolify, not committed.

## Deploy Steps

1. Push reviewed code.
2. Configure Coolify env vars.
3. Mount `/app/uploads` persistent volume.
4. Build Docker image.
5. Run `npm run release:env` inside the production shell/Coolify environment; fix every error before migration or app start.
6. Run `npm run db:deploy` before app start or as release command; Coolify must provide `DATABASE_URL` as an environment variable, while local developer runs may use `.env`.
7. For fresh staging only, run `npm run db:seed` after setting `SEED_SUPERADMIN_PASSWORD` and `SEED_EMPLOYEE_PASSWORD`; never print real passwords in docs or logs.
8. Start app with production command.
9. Check `/api/health`.
10. Check `/api/version` if endpoint exists.
11. Run smoke tests from `TESTING_QA.md`.

## Coolify Release Command

Recommended release command before app start:

```bash
npm run release:env && npm run db:deploy
```

Recommended start command:

```bash
npm run start:prod
```

`npm run build` copies `.next/static` and `public` into `.next/standalone` so the standalone server can serve JavaScript, CSS, fonts, manifest, and icons.

## Production Verification Commands

Run from production-like shell after env is configured:

```bash
npm run release:check:full
BASE_URL=https://myprodusen.online npm run verify:live-routes
```

If running local HTTP E2E against `start:prod`, `TESTSPRITE_DISABLE_SECURE_COOKIES=true` may be used only in the command environment. Never set it in Coolify production env.

## Post-Bootstrap Cleanup

- Remove or rotate `SUPERADMIN_PASSWORD` after first successful Superadmin login.
- Keep `TESTSPRITE_COMPAT_RESPONSE=false`, `TESTSPRITE_DISABLE_RATE_LIMITS=false`, `E2E_DISABLE_RATE_LIMITS=false`, `TESTSPRITE_DISABLE_CSRF_ORIGIN=false`, `E2E_DISABLE_CSRF_ORIGIN=false`, and `TESTSPRITE_DISABLE_SECURE_COOKIES=false` in production.
- Keep `E2E_*` credentials dedicated to staging-safe accounts only.

## No-Cache Redeploy

Use when stale build or route artifact suspected:

1. Trigger Coolify rebuild with no cache.
2. Confirm latest `GIT_COMMIT_SHA` / `BUILD_TIME` in `/api/version`.
3. Run `BASE_URL=https://myprodusen.online npm run verify:live-routes`.
4. Re-test login, dashboard, attendance, report/PDF auth denial, payroll RBAC.

## Health And Version

- `/api/health`: status only, no secrets, no DB URL, no upload path, no private filenames.
- `/api/version`: safe metadata only: app name, status, env label, version, git SHA, build time.

## Rollback

- Prefer app image rollback for app-only failures.
- Database restore requires explicit approval.
- Never reset production DB.
- Use `OPERATIONS.md` rollback procedure.

## Signoff

Release can go live only when `FINAL_CHECKLIST.md` and `TESTING_QA.md` go/no-go criteria pass.

## Coolify migration startup hotfix — 2026-05-21

The production runtime image intentionally installs only production dependencies plus traced Next.js output. `scripts/run-migrations.mjs` must not require dev-only packages at startup. The migration runner now loads `dotenv/config` opportunistically for local development and continues without it in Coolify, where env vars come from the platform.

If Coolify logs show `ERR_MODULE_NOT_FOUND: Cannot find package 'dotenv' imported from /app/scripts/run-migrations.mjs`, redeploy a commit that includes this hotfix.

## GitHub CI/CD Gate — 2026-05-22

Repository pushes and pull requests run `.github/workflows/ci.yml` before production promotion:

- `release-check` starts PostgreSQL 16, runs `npm ci`, applies Drizzle SQL migrations with `npm run db:deploy`, then runs `npm run release:check`.
- `docker-build` builds the production Docker image without pushing it.
- Coolify remains the deployment target; CI is a validation gate, while Coolify performs the actual deploy from `main`.

## Private document storage — 2026-05-22

Employee document uploads must use the same private persistent upload volume as attendance selfies. Configure `UPLOAD_DIR=/app/uploads` in Coolify and mount that path as a persistent volume. Document files are no longer written under `public/uploads`; they are served only through authenticated document API endpoints.
