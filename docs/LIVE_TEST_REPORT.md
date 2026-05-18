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
