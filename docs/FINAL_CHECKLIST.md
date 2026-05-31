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

## Production UAT Leader Gate — 2026-05-24

- [x] `0020_leader_role_teams_kpi_production.sql` applied on configured database by `npm run db:deploy`.
- [x] Official work location upserted by `npm run seed:work-location`.
- [x] Leader teams `Cetak`, `Gudang`, and `Pengiriman` upserted by `npm run seed:leader-teams`.
- [ ] First active Leader exists.
- [ ] First Leader has employee profile, default work location, and active shift.
- [ ] First Leader is assigned to a team.
- [ ] First active Employee is assigned to that team and has default work location and active shift.
- [ ] Superadmin UI flow verified on staging with real credentials.
- [ ] Leader UI/API flow verified on staging with real credentials.
- [ ] Employee UI/API flow verified on staging with real credentials.
- [ ] Authenticated E2E passes with env credentials only.
- [ ] Real-device GPS+selfie attendance passes inside/outside radius and selfie access checks.
- [x] Local `npm run release:check` passed.
- [x] Live public E2E passed against `https://myprodusen.online`.
- [x] Live safe route verification passed against `https://myprodusen.online`.

**Final status:** NOT READY for production signoff. READY only for staging data assignment and UAT preparation.

## Final Role And Assignment UAT Update — 2026-05-24

- Public register is employee-only: backend strips any submitted role/team/division/position/location/shift escalation and creates `EMPLOYEE` with existing activation policy.
- Only `SUPERADMIN` can change role, active status, team/division, position/title, work location, and shift.
- `LEADER` remains a self-service employee for GPS+selfie attendance and personal reports, plus team-scoped KPI input for assigned members only.
- `EMPLOYEE` remains self-service only and cannot input KPI, view other employees, access Leader pages, or access Superadmin pages.
- Role and work identity are separate: role controls access; team/division/position/location/shift control work assignment.
- Team/division examples include Produksi, Kargo, Cetak, Gudang, Pengiriman, Packing, and Quality Control; active data remains configurable by Superadmin.
- Added safe additive migration for position metadata and primary active employee team assignment guard.
- Added/updated production-safe scripts: `seed:leader-teams`, `setup:uat-leader-flow`, `verify:uat-leader-flow`, and `release:runtime`.
- `release:runtime` is target-container safe and intentionally excludes lint/test/build because production images may not ship dev dependencies.
- Remaining production signoff blockers: target-container `release:env`, authenticated E2E with real credentials, real-device GPS+selfie attendance, and protected selfie authorization verification.

## Final Role Assignment Gate — 2026-05-24

- [x] Public registration creates `EMPLOYEE` only.
- [x] Register UI has no role selector and no Leader/Superadmin option.
- [x] Superadmin can edit user role, team/division, position/title, work location, shift, and active status in one mobile-friendly user card.
- [x] Backend blocks self-demotion/deactivation and last active Superadmin downgrade/deactivation.
- [x] Backend requires Leader employee profile, location, shift, and team assignment.
- [x] Backend deactivates Leader assignments when role changes to `EMPLOYEE`.
- [x] Safe additive migration `0021_positions_team_assignment_metadata.sql` added.
- [x] Safe team seed includes Produksi, Kargo, Cetak, Gudang, Pengiriman, Packing, and Quality Control.
- [x] Local lint/test/build/release gate passed.
- [x] Live public route and public E2E passed.
- [ ] Target Coolify `npm run release:runtime` passed.
- [ ] UAT setup/verify with `UAT_*` env passed.
- [ ] Authenticated E2E with `E2E_*` credentials passed.
- [ ] Real-device GPS+selfie attendance passed.
- [ ] Protected selfie authorized/unauthorized access verified.

**Final status:** READY FOR REDEPLOY, not ready for production signoff.

## First Login Personal Profile Onboarding — 2026-05-24

- After registration, activation, and first login, the dashboard checks `/api/profile/me` with `no-store, private` behavior.
- If phone, address, or `profileCompletedAt` is missing, the app shows mandatory modal “Lengkapi Data Pribadi”.
- User-editable fields are limited to `phone` / Nomor HP and `address` / Alamat lengkap.
- Users cannot edit role, team/division, position/title, leader status, work location, shift, active status, payroll, or permissions.
- If a self-registered activated user has no employee row yet, saving personal profile creates a minimal employee profile with generated NIP and no work assignment.
- Superadmin-only assignment fields remain role, team/division, position/title, work location, shift, and active status.
- Employee/Leader dashboard shows clean assignment status cards when division, position, location, shift, or Leader team is missing.
- Near-real-time assignment sync uses authenticated profile refetch on dashboard focus and a light 60-second dashboard interval; role/nav updates after refetch/refresh while backend permissions apply immediately.
- Phone/address are private employee data. Owner and Superadmin may access them; Leader team APIs do not expose employee phone/address by default.
- Real-device GPS+selfie, protected selfie authorization, and authenticated live E2E remain required before production signoff.

## UAT Production Polish Checklist — 2026-05-24

- [x] Superadmin no longer sees normal selfie attendance CTA.
- [x] Superadmin direct normal check-in is forbidden by backend.
- [x] Employee/Leader attendance GPS card shows distance, radius, and outside-radius status.
- [x] First-login onboarding requires avatar, phone, and address.
- [x] Avatar is compressed client-side to WebP when supported and served through protected no-store route.
- [x] Pengguna icon is visually distinct from Beranda.
- [ ] KPI target configuration per team/leader/employee fully built and verified.
- [ ] Leave balance global/individual setting fully built and verified.
- [ ] Payroll custom target/bonus rules fully built and verified.
- [ ] Paid/unpaid payroll notification flow fully built and verified.
- [ ] Combined professional PDF report UAT verified.
- [ ] Authenticated staging E2E passed with real credentials.
- [ ] Real-device GPS+selfie attendance passed on Android/iPhone.

## Production Sync GO/NO-GO — 2026-05-24

- [x] Local code gate passed before final release-doc update.
- [x] Migration `0023_kpi_targets_payroll_rules.sql` audited additive and non-destructive.
- [x] Production-safe runtime scripts present: `release:runtime`, `seed:work-location`, `seed:leader-teams`, `setup:uat-leader-flow`, `verify:uat-leader-flow`, `verify:live-routes`, `verify:cdn`.
- [x] Leave balance period sync script added with dry-run mode.
- [x] Public E2E and live route checks passed.
- [x] CDN no-store/private check passed.
- [ ] Coolify latest image redeployed.
- [ ] Target production `npm run db:deploy` confirmed after redeploy.
- [ ] Authenticated E2E passed with real credentials.
- [ ] Android/iPhone real-device GPS+selfie passed.
- [ ] Protected avatar/selfie live authorization verified with real users.
- [ ] Backup/restore drill passed.

### Final Local Gate Rerun — 2026-05-24

- [x] `npm run test` passed after append-only leave ledger patch, 76 files / 385 tests.
- [x] `npm run release:check` passed after all changes.
- [x] React Doctor full offline scan returned 0 diagnostics.
- [x] `DRY_RUN=true npm run sync:leave-balance-period` passed with no writes.
- [x] Public live route, public E2E, CDN, and production npm audit checks passed.

## Talenta-Inspired GO/NO-GO Addendum — 2026-05-24

GO requires core MyProdusen modules visible and working, non-core modules hidden or feature-flagged off by default, no destructive migration, no private data exposure, backend RBAC intact, docs updated, and lint/test/build/release checks passing. NO-GO if optional Talenta-style modules clutter main nav, core attendance/leave/KPI/payroll/report flows are broken, tests fail, or hidden modules require data deletion.

## Navigation Simplified Polish Gate — 2026-05-24

- [x] Superadmin mobile navigation limited to exactly 5 items: Beranda, Pengguna, KPI, Payroll, and Akun.
- [x] Leader mobile navigation limited to exactly 5 items: Beranda, Absensi, Input KPI, Tim, and Akun.
- [x] Employee mobile navigation limited to exactly 5 items: Beranda, Absensi, Cuti, KPI, and Akun.
- [x] Non-core modules (overtime, documents, lms, recruitment, etc.) completely hidden from primary navigations while keeping routes fully reversible.
- [x] No horizontal overflow, no clipped select/buttons, and no visual clutter on widths 320px/360px/390px/768px/1440px.
- [x] Visually verified that sidebar is used from tablet upward and removes bottom nav there.
- [x] Verified and passed `npm run lint`, `npm run test` (388 tests), `npm run build`, and `npm run release:check`.
- [x] Live route verification and public Playwright E2E browser smoke tests passed against `https://myprodusen.online`.
- [x] Real `Keluar` button and confirmation dialog preserved on Akun page.

## Major Dashboard UX Restructure Gate — 2026-05-24

- [x] Employee and Leader greeting headers show personalized time-of-day greetings, user avatar, position, NIP, and notification bell trigger.
- [x] Employee and Leader primary attendance cards integrate real-time GPS coordinates, shift startTime/endTime, allowed radius, distance (meters/kilometers), and inside/outside geofence statuses.
- [x] Clock In and Clock Out buttons placed side-by-side on the attendance card, directing to the camera selfie Absensi flow, shifting states dynamically depending on active records.
- [x] Employee, Leader, and Superadmin dashboards show an 8-item Quick Actions Grid (icons on top, labels below, 4 columns, no horizontal overflow, tap targets min 44px).
- [x] Hidden all irrelevant Talenta modules (recruitment, lms, reimbursement, EWA, survey, asset) to keep layouts focused.
- [x] Superadmin dashboard does NOT render clock-in or clock-out camera selfie button elements.
- [x] Superadmin dashboard renders an Executive Summary Card, Quick Actions Grid, Performance Summary panels, and recent Audit Logs/approvals.
- [x] Personal/Team summary cards correctly fetch Cuti available days, active Absen status badges, monthly metrics, and leader team production metrics.
- [x] Clean Indonesian operational copy maintained with MyProdusen warm yellow/cream visual identity intact.
- [x] Verified and passed all 388 Vitest units, `npm run lint`, `npm run build`, and `npm run release:check`.
- [x] Public Playwright smoke browser E2E tests (20/20 viewports) and live routes checked successfully against `https://myprodusen.online`.
- [x] Cloudflare CDN cache private no-store headers checked successfully (`verify:cdn`).

**Final Status:** READY FOR REDEPLOY.



## Production Attendance, KPI, Payroll Realtime Sync — 2026-05-26

- [x] Attendance priority flow is GPS + realtime selfie for `EMPLOYEE` and `LEADER`; `SUPERADMIN` does not use normal employee selfie clock-in/out.
- [x] Official geofence default radius is 150 meters. Backend remains source of truth for distance, GPS accuracy, stale GPS rejection, selfie requirement, and inside/outside decision.
- [x] Camera Auto-Trigger Flow: Integrated `autoStart` in `RealtimeSelfieCamera` to automatically start webcam streaming if Clock In or Clock Out dashboard button is clicked.
- [x] Embedded Leader KPI Cetak Card: Embedded team production input card directly on the leader's main dashboard (`LeaderBeranda.tsx`) with pre-populated inputs and save handlers.
- [x] Superadmin Mobile Nav Karyawan Swap: Primary Superadmin tab menu aligned to exactly 5 columns with `Karyawan` replacing the old `Pengguna` tab, verified by RBAC and navigation unit tests.
- [x] Verified and passed linter (`npm run lint`), build compiler (`npm run build`), all 398 Vitest unit tests, and full release checks (`npm run release:check`).
- [ ] Production payroll deductions and multipliers must be reviewed and approved by company policy/legal owner before production payroll use.

**Final Status:** READY FOR REDEPLOY.


## Gamification & Performance Score Update

- Performance score module adds Attendance Score (30%), KPI Score (50%), and Culture & Discipline Score / Penilaian Perilaku Kerja (20%) defaults; configuration must total 100 or return `GAMIFICATION_WEIGHT_INVALID`.
- New active Employee and Leader start from score 100 and can maintain annual 365-day performance for configurable raise projection tiers.
- Default Platinum projection: score 100 maintained 365 days = +10%, with disclaimer: “Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.”
- Badge service definitions cover Streak 7 Hari, Streak 30 Hari, KPI Perfect Month, Zero Alpha Quarter, Top Performer, and Consistent Gold. Badges are backend-calculated, not fake frontend state.
- Culture & Discipline Score / Penilaian Perilaku Kerja is limited to assigned team members, disallows self-scoring, requires score 0–100 plus notes minimum 10 characters, and queues anomalies for score < 40 or score delta > 30.
- Superadmin controls periods, score weights, raise tiers, anomalies, score overrides with audit reason, reports, and company distribution.
- Theme customization stores sanitized hex colors only, validates contrast, emits safe CSS tokens, audits changes, and resets to default MyProdusen yellow/cream/charcoal/red identity.
- Private performance/theme APIs use no-store responses; payroll/attendance/security actions must not use fake optimistic success.
- UX includes skeleton states, safe progress states (Memvalidasi GPS…, Mengaktifkan kamera…, Menyimpan data…, Menghitung payroll…, Memperbarui skor…), double-submit prevention, and input preservation on error.


## Final Backend Gamification Checkpoint (2026-05-31)
- Migration `0026_gamification_constraints_settings.sql` is additive only and hardens gamification constraints/settings.
- Run `node scripts/preflight-gamification-0026.mjs` before production migration; if multiple `PerformancePeriod` rows are `ACTIVE`, stop and manually audit/resolve without deleting period data.
- Gamification config persists in `CompanySetting.GAMIFICATION_CONFIG` with weights 30/50/20, retroactive leader-score days, period type, and raise tiers.
- Theme persists in `CompanyThemeSetting` with sanitized hex colors, safe tokens, `themeMode`, `updatedBy`, and `updatedAt`; invalid contrast returns `THEME_CONTRAST_INVALID`.
- Active Employee/Leader score baseline remains 100 for the active period; 365 days at average score 100 projects +10% and remains an estimate, not final payroll commitment.
- Badge service is idempotent and avoids duplicate awards. `scripts/run-gamification-badges.mjs` is a manual hook; production worker must call the service with real attendance/KPI/alpha/ranking aggregation before marking automated badge runs complete.
- Score override, config/theme changes, exports, leader score submissions, and period state changes require audit trails; Leader scope is own team only.

## Gamification & Theme UI UAT Polish Checklist — 2026-05-31

- [x] Employee Gamification Dashboard has a cumulative Score Card (0-100), active tier display, Kehadiran/KPI Produksi/Perilaku Kerja score breakdown, interactive raise projection banner with Platinum projection disclaimer, earned badges grid showcase, recent change reason notes, and responsive inline SVG 7-day trend chart. Included dynamic subcriteria display (Kebersihan, Disiplin, Kerapian, Kepatuhan SOP, Kerja Sama Tim, Tanggung Jawab) if available in backend records.
- [x] Leader workspace (`/dashboard/leader/team`) includes Team Score Table, Team Leaderboard, and Input Penilaian Perilaku Tim form with client-side/server-side note validations (>10 characters), optional subcriteria sliders, and live anomaly warning states (<40 or delta >30). Salary/raise info completely isolated.
- [x] Superadmin Dashboard Overview renders performance metric summaries, tier distributions, raise budget projections, top performers list, period state manager, direct final score input with priority disclaimer and optional subcriteria sliders, and Culture & Discipline Score anomaly review override queue with required audit notes.
- [x] Superadmin Settings UI renders dynamic 4-tab dashboard containing color wheel customization palettes with WCAG contrast validations (>4.5:1 ratio), brand default resets, and weight configs.
- [x] Perceived speed loading skeletons are integrated across dashboard score cards, leaderboard, employee list, payroll, attendance, and KPI entry tables. Loading copy transitions are mapped E2E.
- [x] Real data integration wired without any fake optimistic success for attendance or payroll.
- [x] Responsive layout verified across all viewports (320x568 up to 1440x900) without card clipping, nav overlaps, modal overflows, tiny tap buttons, or horizontal scrolling.
- [x] All 438 unit/E2E test files passed successfully (`npm run test`).
- [x] Build compiler generated production package bundles cleanly (`npm run build`).

## Culture & Discipline Score Update
- Old user-facing "Leader Score" label is now "Culture & Discipline Score" / "Penilaian Perilaku Kerja".
- Legacy `LeaderScoreEntry` storage remains for backward compatibility; no destructive rename.
- Formula: Attendance 30% + KPI Produksi 50% + Perilaku Kerja 20%.
- `GAMIFICATION_WEIGHT_CULTURE=20` is primary; `GAMIFICATION_WEIGHT_LEADER` remains legacy alias fallback.
- Superadmin can input/edit Culture & Discipline Score for any Employee/Leader and final score has priority by default (`CULTURE_SCORE_SUPERADMIN_PRIORITY=true`).
- Leader can input only assigned team members, cannot score self, cannot score outside team, cannot see team salary projection amounts, and cannot override Superadmin final score.
- Advanced subcriteria can evaluate kebersihan, disiplin, ketepatan waktu perilaku, kerapian, kepatuhan SOP, kerja sama tim, tanggung jawab, and optional attitude.
- All submit/update/override actions require audit log: `CULTURE_SCORE_SUBMITTED`, `CULTURE_SCORE_UPDATED`, `CULTURE_SCORE_OVERRIDDEN`.
- Employee sees transparent score breakdown with Perilaku Kerja explanation.
- Preferred API: `/api/performance/culture-score`; legacy `/api/leader/performance/leader-score` remains alias.

## QA Automation Checkpoint — Live/Public + Culture Build
- Local quality gates passed: `npm run lint`, `npm run test`, `npm run build`, `npm run release:check`.
- Live route verification passed for `/api/health`, `/api/version`, and unauthenticated PDF protection.
- CDN cache verification passed: static assets cacheable; API/dashboard/PDF/attendance/payroll responses no-store/private or non-cacheable.
- Playwright public live smoke found horizontal overflow on `/login` mobile-360. Root cause: auth decorative/background layout could extend document width on deployed build.
- Fix applied locally: `.auth-page` now uses `max-width: 100vw`, `overflow-x: clip`, and `box-sizing: border-box`; regression test added in `tests/ui/auth-overflow-source.test.ts`.
- Authenticated E2E is BLOCKED because `E2E_SUPERADMIN_EMAIL`, `E2E_LEADER_EMAIL`, and `E2E_EMPLOYEE_EMAIL` are missing. Password env values without matching emails are insufficient.
- TestSprite API key is present, but no TestSprite MCP/CLI runner is available in this repo session; TestSprite frontend/backend runs are BLOCKED pending runner/tool access.
- Real-device GPS+selfie UAT is BLOCKED / NOT RUN. See `docs/manual-real-device-uat.md`.
- GO/NO-GO: NO-GO for production signoff. Public live smoke must pass after redeploy, authenticated E2E credentials must be supplied, TestSprite must run, and real-device UAT must complete.

## Final QA Hotfix Checkpoint — Parallel Readiness
- Parallel QA agents verified local Playwright public E2E, backend release/RBAC gates, and TestSprite runner availability.
- Local public Playwright passed: `npm run e2e:public` => 20 passed.
- Authenticated E2E environment is partial: Superadmin/Employee credentials present in `.env`, Leader credentials missing (`E2E_LEADER_EMAIL`, `E2E_LEADER_PASSWORD`). Authenticated production signoff remains BLOCKED until all three roles are available and pass.
- Authenticated Playwright helpers now forward auth cookies on API-context requests so browser login state and API checks stay aligned.
- Superadmin users-page assertion accepts current UI label `Pengguna` plus legacy `Manajemen User & Aktivasi`.
- TestSprite remains BLOCKED: local MCP/CLI runner not installed; `@testsprite/testsprite-runner` and `@testsprite/testsprite-cli` are not available from npm; existing cloud execution previously blocked by billing/credits.
- No destructive DB commands were run. Migration/static release checks passed.
- GO/NO-GO: READY FOR REDEPLOY only after commit/push; NOT production signoff until redeploy live public, authenticated roles, TestSprite/owner acceptance, real-device GPS+selfie, prod db deploy, and backup/restore are done.

## Authenticated E2E Credential Verification — Live
- Sourced local `.env` for authenticated Playwright probe without printing secrets.
- Superadmin and Employee credential variables exist, but live `/api/auth/login` returned `401`; credentials are invalid or not provisioned on production.
- Leader credential variables are missing: `E2E_LEADER_EMAIL`, `E2E_LEADER_PASSWORD`.
- Authenticated E2E remains BLOCKED. Do not mark production signoff until valid production Superadmin/Leader/Employee E2E credentials are supplied and all role suites pass.
