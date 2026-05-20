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
- [ ] `npm run release:migrations` passes.
- [ ] `npm run e2e:public` passes or skipped with reason.
- [ ] `npm run e2e:staging` passes or skipped with reason.
- [ ] `BASE_URL=https://myprodusen.online npm run verify:live-routes` passes or skipped with reason.

## Final Status

- [ ] Owner/HR/technical PIC signoff.
- [ ] Production smoke passed.
- [ ] Release is `READY`.
