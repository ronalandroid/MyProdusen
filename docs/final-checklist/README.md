# Final Checklist — MyProdusen

> Role lock: production UI/login/access uses only `SUPERADMIN`, `LEADER`, and `EMPLOYEE`; `ADMIN_HR` and `SUPERVISOR` are historical database enum values only and must be denied in production access.

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

- [x] `npm run lint` passes.
- [x] `npm run test` passes.
- [x] `npm run build` passes.
- [x] `npm run release:check` passes.
- [x] `npm run release:check:full` passes in production-like env before promotion.
- [x] `npm run release:migrations` passes.
- [x] `npm run e2e:public` passes or skipped with reason.
- [x] `npm run e2e:staging` passes or skipped with reason.
- [x] `BASE_URL=https://myprodusen.online npm run verify:live-routes` passes or skipped with reason.

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
- [ ] Run authenticated live Superadmin/Leader/Employee E2E with approved `E2E_*` credentials.
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

## Official Work Location Gate — 2026-05-22

- [ ] Run `npm run seed:work-location` in production/Coolify shell after deploy.
- [ ] Confirm `Produsen Dimsum Medan | TBM GRUP` is active with latitude `3.6009125`, longitude `98.6964954`, radius `100m`.
- [ ] Assign every attendance employee to official work location and active shift.
- [ ] Real-device test inside radius accepts GPS+selfie attendance.
- [ ] Real-device or mocked outside-radius test rejects attendance.
- [ ] Employee with no assigned location cannot check in and sees `Lokasi kerja belum tersedia. Hubungi Superadmin.`
- [ ] Audit log records accepted and rejected attendance decisions with GPS metadata.


## 3-Role Leader Model — 2026-05-24

Production roles are now exactly `SUPERADMIN`, `LEADER`, and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` remain historical database enum values only and must not appear in production UI, seed accounts, tests, or new route access.

### SUPERADMIN

- Full system control: users, employees, roles, teams, leader assignment, employee team assignment, cabang/lokasi kerja, shifts, attendance, KPI, reports/export, payroll if active, and audit logs.
- Can create teams such as Cetak, Gudang, Pengiriman, Packing, Produksi, and Quality Control.
- Can assign one or more active `LEADER` users to teams and assign active employees to teams.
- Can view all attendance, KPI production entries, personal KPI, and global reports.

### LEADER

`LEADER` is also an active employee and must have an employee profile, default work location, and active shift for attendance. If incomplete, UI/API returns: “Anda belum memiliki data karyawan/lokasi kerja/shift. Hubungi Superadmin.” If not assigned to a team, UI/API returns: “Anda belum ditetapkan ke tim. Hubungi Superadmin.”

As self-service employee, `LEADER` can use GPS + realtime selfie attendance, own attendance history, own leave/cuti, own KPI/kinerja, own personal performance report, own notifications, and own payslip if payroll is active.

As team role, `LEADER` can view assigned team members only, input daily KPI/production count for assigned employees only, view team KPI summary, and view daily/weekly/monthly team performance reports scoped to assigned team. `LEADER` cannot view team payroll, edit sensitive employee data, access another leader team, access Superadmin global reports, or input own KPI unless `ALLOW_LEADER_SELF_KPI_INPUT=true`.

### EMPLOYEE

`EMPLOYEE` can use GPS + realtime selfie attendance, submit leave/cuti, view own KPI/kinerja only, view own attendance history only, view own personal report only, and view own notifications/payslip if active. `EMPLOYEE` cannot input KPI, see other employee data, or access leader/superadmin pages.

### Database Additions

Additive Drizzle migration `0020_leader_role_teams_kpi_production.sql` adds enum value `LEADER`, `Team`, `LeaderAssignment`, `EmployeeTeamAssignment`, and `KpiProductionEntry`. Migration is non-destructive and keeps historical data.

### API/RBAC Additions

- Superadmin: `GET/POST /api/teams`, `POST /api/teams/leader-assignment`, `POST /api/teams/employee-assignment`.
- Leader: `GET /api/leader/me`, `GET /api/leader/team-employees`, `GET/POST /api/leader/kpi-production`.
- Self KPI view: `GET /api/kpi/production/me`.
- Backend enforces role, active user, leader team scope, employee membership, quantity/date validation, self-KPI policy, and no-store API responses.

### UI Additions

- Leader dashboard has “Saya / Pribadi” and “Tim Saya”.
- Leader mobile primary nav: Beranda, Absensi, Input KPI, Tim, Akun.
- Leader pages: `/dashboard/leader/kpi-input`, `/dashboard/leader/team`, `/dashboard/leader/reports`.
- Employee KPI page shows production count source “Diinput oleh Leader” and empty state “Belum ada input KPI hari ini.”
