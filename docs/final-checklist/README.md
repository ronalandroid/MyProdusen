# Final Checklist — MyProdusen

> Role lock: production UI/login/access uses only `SUPERADMIN` and `EMPLOYEE`; `ADMIN_HR` and `SUPERVISOR` are historical database enum values only and must be denied in production access.

## Documentation

- [ ] `README.md` doc map current.
- [ ] `AGENTS.md` concise and enforceable.
- [ ] `docs/prd/README.md` matches final role, ORM, DB, payroll, UI, API error decisions.
- [ ] `docs/database/README.md`, `docs/security/README.md`, `docs/ui-ux-guide/README.md` updated for touched areas.
- [ ] `docs/testing-qa/README.md`, `docs/deployment/README.md`, `docs/operations/README.md`, `docs/changelog/README.md` current.

## Code And Data

- [ ] Drizzle ORM only; no Prisma config/import/schema.
- [ ] PostgreSQL migrations additive and non-destructive.
- [ ] `npm run db:deploy` / migration coverage verified.
- [ ] RBAC uses two production roles: `SUPERADMIN`, `EMPLOYEE`.
- [ ] Backend enforces RBAC; frontend only hides navigation.
- [ ] Employee own-data isolation verified.
- [ ] Payroll RBAC verified when payroll module enabled.
- [ ] Audit log added for sensitive actions.

## UI/UX Quality Gate

- [ ] No clipped button text.
- [ ] No icon/text overlap.
- [ ] No horizontal overflow.
- [ ] No raw JavaScript error visible to user.
- [ ] No scroll freeze.
- [ ] No dead buttons.
- [ ] Mobile 360/390 works.
- [ ] Tablet 768 works.
- [ ] Desktop 1440 works.
- [ ] Modal action buttons do not overlap.
- [ ] Form data not erased after validation error.
- [ ] Loading/error/empty/success states exist.
- [ ] Tap target minimum 44px.
- [ ] Front-camera selfie preview mirrored.
- [ ] Attendance GPS/selfie disabled reasons clear.

## Deployment

- [ ] Coolify env configured.
- [ ] `npm run release:env` passes in production shell/Coolify environment.
- [ ] `/app/uploads` volume mounted and private.
- [ ] `/api/health` healthy and secret-free.
- [ ] `/api/version` safe if present.
- [ ] Backups configured.
- [ ] Restore drill documented.
- [ ] Rollback plan ready.

## Verification Commands

- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run release:check` passes.
- [ ] `npm run release:check:full` passes in production-like env before promotion.
- [ ] `npm run release:migrations` passes.
- [ ] `npm run e2e:public` passes or skipped with reason.
- [ ] `npm run e2e:staging` passes or skipped with reason.
- [ ] `BASE_URL=https://myprodusen.online npm run verify:live-routes` passes or skipped with reason.

## Final Status

- [ ] Owner/HR/technical PIC signoff.
- [ ] Production smoke passed.
- [ ] Release is `READY`.

## Final Release Candidate Status — 2026-05-22

Release candidate code commit: `d987fa7` (`main`). Redeploy from latest `main` HEAD.

### Verified

- [x] Code gate passed before this docs update: `npm run release:check`.
- [x] Live safe routes passed: `/api/health` `200`, `/api/version` `200`, unauthenticated `POST /api/reports/pdf` `401`.
- [x] Live public responsive smoke passed: `E2E_BASE_URL=https://myprodusen.online npm run e2e:public` 20/20 across 360/390/768/1440.
- [x] Deployment checklist updated for Coolify no-cache redeploy, upload volume, env validation, health/version, protected PDF, Android, and backup/restore.
- [x] Android real-device test checklist added in `docs/ANDROID_REAL_DEVICE_TEST.md`.

### Pending Before Production Signoff

- [ ] Redeploy latest `main` commit and prove live commit SHA; current `/api/version` reports `gitCommitSha: unknown`.
- [ ] Run authenticated live Superadmin/Employee E2E with approved `E2E_*` credentials.
- [ ] Run Android real-device GPS/selfie check-in and check-out.
- [ ] Run PostgreSQL plus `/app/uploads` backup/restore drill to staging/test.
- [ ] Record Owner/HR/Technical PIC signoff.

Final GO/NO-GO: `READY FOR REDEPLOY` and `READY FOR STAGING UAT`; not full `READY FOR PRODUCTION` yet.

## Cloudflare Production Gate — 2026-05-22

- [ ] Cloudflare DNS active: `@` and `www` proxied; email records DNS-only.
- [ ] SSL Full strict, Always HTTPS, Brotli enabled.
- [ ] `BASE_URL=https://myprodusen.online npm run verify:cdn` passes.
- [ ] Static assets return public cache headers.
- [ ] `/api/health`, `/dashboard`, `/api/reports/pdf`, payroll, attendance, document, selfie, and upload paths are `no-store, private` and not `cf-cache-status: HIT`.
- [ ] Login/logout tested behind Cloudflare with no redirect loop and no stale dashboard after logout.
- [ ] Android/iPhone attendance GPS+selfie tested behind Cloudflare.
- [ ] Protected selfie, document, payroll, and PDF routes require auth/RBAC behind Cloudflare.
- [ ] Cloudflare cache purged after redeploy when static assets change.

## Mobile Navigation Gate — 2026-05-22

- [ ] Phone bottom nav has max five items and one row at 320/360/390/393/430/480 widths.
- [ ] Phone bottom nav has no mascot/chicken, no marketing copy, and no logout helper text.
- [ ] Content is not covered by bottom nav; bottom padding includes safe-area inset.
- [ ] `Lewati navigasi` is hidden on touch render and appears only on keyboard focus.
- [ ] Tablet `768/834` widths use compact sidebar, not oversized bottom nav.
- [ ] Desktop `1024/1280/1440/1920` widths use sidebar and no bottom nav.
- [ ] Akun page shows real `Keluar` button and confirmation `Anda yakin ingin keluar?`.
