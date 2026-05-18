# Live Test Report — MyProdusen

Tanggal: 2026-05-18
Domain: `https://myprodusen.online`

## Summary

Local source and production build contain `POST /api/reports/pdf`, but live returned `404` before latest redeploy. Root cause is most likely stale Coolify image/commit or build cache, not missing local source route.

## Local Status

- `npm run e2e:public`: PASS.
- `npm run e2e:staging`: PASS with expected credential skips.
- `npm run lint`: PASS.
- `npm run test`: PASS, 297 tests.
- `npm run build`: PASS.
- `npm run release:migrations`: PASS.
- `npm run release:check`: PASS.
- Local build output includes `/api/reports/pdf`.
- Local unauthenticated `POST /api/reports/pdf` returns `401` or `403`.

## Live Status Before Redeploy

- `GET /api/health`: PASS, `200`.
- `POST /api/reports/pdf`: FAIL, `404`.

Expected after latest redeploy:

- Unauthenticated: `401` or `403`.
- Non-superadmin: `403`.
- Superadmin: `200`, `application/pdf`, `Cache-Control: no-store`.

## Root Cause

Most likely:

1. Coolify deployed old commit/image.
2. Coolify build cache reused old `.next` output.
3. Domain still routed to old container.
4. Branch configured in Coolify differs from local working branch.

## Fix Steps

1. Commit latest source.
2. Push to branch used by Coolify.
3. Redeploy Coolify with rebuild image/no cache.
4. Set metadata env: `APP_VERSION`, `NEXT_PUBLIC_APP_VERSION`, `GIT_COMMIT_SHA`, `BUILD_TIME`.
5. Verify `/api/health` metadata matches expected deploy.
6. Run `BASE_URL=https://myprodusen.online npm run verify:live-routes`.
7. Run `E2E_BASE_URL=https://myprodusen.online npm run e2e:public`.

## Commands To Rerun

```bash
npm run lint
npm run test
npm run build
npm run release:migrations
npm run release:check
npm run e2e:public
npm run e2e:staging
BASE_URL=https://myprodusen.online npm run verify:live-routes
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

Superadmin live smoke, only after rate limit clears:

```bash
E2E_BASE_URL=https://myprodusen.online \
E2E_SUPERADMIN_EMAIL=<email> \
E2E_SUPERADMIN_PASSWORD=<password> \
npm run e2e:staging
```

## Rate Limit Note

Superadmin login smoke must run only on `desktop-1440`. Mobile/tablet credential login tests are skipped intentionally to avoid triggering production login rate limit. If rate limit happens, wait 15 minutes.

## Latest Verification Result

Local after adding route verifier:

```bash
BASE_URL=http://127.0.0.1:3010 npm run verify:live-routes
```

Result:

- `GET /api/health`: PASS, `status: ok`.
- Health metadata present locally: app `MyProdusen`, version/commit/buildTime fallback `unknown` when env not set.
- `POST /api/reports/pdf`: PASS, unauthenticated returns `401`.

Live before redeploy:

```bash
BASE_URL=https://myprodusen.online npm run verify:live-routes
```

Result:

- `GET /api/health`: PASS, `status: ok`.
- Health metadata absent on live, confirming live is still old build without latest health metadata.
- `POST /api/reports/pdf`: FAIL, `404`.

Conclusion:

- Local source/build is ready.
- Live must be redeployed with latest commit and no-cache rebuild.

## Post-Redeploy Live Verification — PASS

Tanggal: 2026-05-18

Setelah redeploy, live route mismatch sudah selesai.

Command:

```bash
BASE_URL=https://myprodusen.online npm run verify:live-routes
```

Result:

- `GET /api/health`: PASS, `200`, `status: ok`.
- `POST /api/reports/pdf`: PASS, unauthenticated returns `401`.
- `/api/reports/pdf` no longer returns `404`.

Command:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

Result:

- 12 passed.
- Responsive public smoke passed on 360, 390, 768, 1440.
- Healthcheck no secret leak passed.
- PDF route protection passed.

Command:

```bash
E2E_BASE_URL=https://myprodusen.online E2E_SUPERADMIN_EMAIL=<set> E2E_SUPERADMIN_PASSWORD=<set> npm run e2e:staging
```

Result:

- 13 passed.
- 3 skipped intentionally for mobile/tablet login to avoid rate limit.
- Desktop Superadmin login reached `/dashboard/users`.
- PDF route protection passed.

Remaining note:

- Health metadata currently returns `version`, `commit`, and `buildTime` as `unknown`. Set `APP_VERSION`, `GIT_COMMIT_SHA`, and `BUILD_TIME` in Coolify to verify exact deployed commit from `/api/health`.

## One-Shot Final Live Verification — 2026-05-19

Target: `https://myprodusen.online`

Commands:

```bash
BASE_URL=https://myprodusen.online npm run verify:live-routes
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

Results:

- `GET /api/health`: PASS, `200`, `status=ok`, no secret leak.
- `POST /api/reports/pdf` unauthenticated: PASS, `401`.
- `/api/reports/pdf` no longer returns `404`; route is deployed and protected.
- Live public Playwright smoke: PASS, 12 passed on 360, 390, 768, and 1440 projects.

Notes:

- Superadmin PDF `200 application/pdf` was not re-tested here because credential env was not present in shell.
- TestSprite was skipped because no local CLI/MCP/API key was available.
- Rotate previously exposed TestSprite API key before future TestSprite runs.

## Mobile/PWA Production Fix Note — 2026-05-19

Source now includes:

- Role-prioritized mobile bottom navigation with Akun as account/logout destination.
- Logout only inside `/dashboard/profile` account flow with confirmation/loading/error state.
- PWA manifest, install prompt, and install-only service worker with no private data caching.
- Attendance GPS readiness/accuracy card before submit.
- Lazy-loaded realtime selfie camera.

Live verification required after next Coolify redeploy:

```bash
BASE_URL=https://myprodusen.online npm run verify:live-routes
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

Manual device checks still required for PWA install and Android GPS+selfie.

## Pre-Redeploy Verification for Mobile/PWA Fix — 2026-05-19

Local source verification after mobile/PWA/attendance UX fixes:

- `npm run lint`: PASS.
- `npm run test`: PASS, 297 tests.
- `npm run build`: PASS.
- `npm run release:check`: PASS.
- `npm run e2e:public`: PASS, 12 passed.
- `npm run e2e:staging`: PASS, 12 passed, 4 skipped.

Current live safe smoke before redeploy remains healthy:

- `BASE_URL=https://myprodusen.online npm run verify:live-routes`: PASS.
- `E2E_BASE_URL=https://myprodusen.online npm run e2e:public`: PASS, 12 passed.
