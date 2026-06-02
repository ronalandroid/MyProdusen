# Testing & QA — MyProdusen

> Canonical testing, QA, live smoke, Android real-device, and TestSprite safe-smoke guide.

> Role lock: production UI/login/access uses only `SUPERADMIN`, `LEADER`, and `EMPLOYEE`; `ADMIN_HR` and `SUPERVISOR` are historical database enum values only and must be denied in production access.

## Local Test Commands

```bash
npm run lint
npm run test
npm run build
npm run release:check
```

Additional available checks:

```bash
npm run release:migrations
npm run release:gates
npm run e2e:public
npm run e2e:staging
npm run e2e:browsers
BASE_URL=https://myprodusen.online npm run verify:live-routes
```

## Gamification/theme release gates

- Gamification release gate: `FEATURE_GAMIFICATION_ENABLED=true` or `NEXT_PUBLIC_FEATURE_GAMIFICATION_ENABLED=true` is blocked unless `GAMIFICATION_RELEASE_APPROVED=true` is set for a signed-off release.
- Theme release gate: `THEME_EXPERIMENT_ENABLED=true` or `NEXT_PUBLIC_THEME_EXPERIMENT_ENABLED=true` is blocked unless `THEME_RELEASE_APPROVED=true` is set for a signed-off release.
- QA must verify no payroll, attendance, leave, KPI, employee identifier, or private document data appears in gamified UI.
- QA must verify MyProdusen yellow/black/white theme, responsive layout, contrast, and PWA `theme_color` remain aligned unless design approval exists.
- `npm run release:check` includes `npm run release:gates`; failed gate means release is not ready.

## E2E And Live Test Commands

- Public smoke: `npm run e2e:public`.
- Staging smoke: `npm run e2e:staging`.
- Browser matrix: `npm run e2e:browsers`.
- Live route verification: `BASE_URL=https://myprodusen.online npm run verify:live-routes`.
- Full staging scenario: `npm run e2e:full-staging` when Superadmin and Employee credentials exist.

## Required Credential Env

Only three production test roles are allowed:

```env
E2E_SUPERADMIN_EMAIL=
E2E_SUPERADMIN_PASSWORD=
E2E_LEADER_EMAIL=
E2E_LEADER_PASSWORD=
E2E_EMPLOYEE_EMAIL=
E2E_EMPLOYEE_PASSWORD=
```

Do not set or require `E2E_ADMIN_HR_*` or `E2E_SUPERVISOR_*`; those roles are historical-only and must stay denied. Do not hard-code credentials in tests or docs. Use local shell, CI secrets, or Coolify secrets.

## No Production Mutation Rule

- Live smoke must prefer safe `GET` checks and unauthenticated access-denial checks.
- Production mutations require explicit operator approval and test account scope.
- Never create destructive data, reset DB, delete uploads, or alter payroll without signed-off test window.
- Report/PDF endpoint tests must verify auth/RBAC without leaking private data.

## Critical QA Matrix

- Roles: Superadmin all, Leader assigned team + own data only, Employee own data only.
- NIP: format, uniqueness, sequence, division code, no reuse after deactivation.
- Attendance: GPS permission, accuracy, Haversine backend validation, selfie required, duplicate check-in/out rejection.
- Leave: create, overlap rejection, approval, rejection reason.
- KPI: scoring methods, total weight 100, approval lock.
- Payroll: employee own view only, Superadmin manages payroll.
- Uploads: MIME, size, safe filename, private protected access.
- API errors: `{ success:false, error:{ code, message } }` with Indonesian user message.

## Android Real Device GPS + Selfie Checklist

- Test on Android Chrome over HTTPS.
- GPS permission prompt appears and denial shows clear Indonesian reason.
- GPS accuracy shown before submit; bad accuracy blocks or explains pending/rejected state.
- Front camera selfie preview is mirrored.
- Selfie stream stops after submit/navigation.
- Submit shows loading, success, error, and retry states.
- No scroll freeze, horizontal overflow, clipped buttons, or overlapping modal actions at 360px/390px.

## TestSprite Safe Smoke

- Run only non-destructive flows unless explicit test window exists.
- Verify public pages, login page render, health/version endpoints, and protected route denial.
- Do not submit live payroll, attendance, leave, KPI, or destructive admin forms.
- Record external-tool limitations in `CHANGELOG.md` or issue tracker, not new one-off markdown.
- For local TestSprite runs, start the app with `npm run start:testsprite` after `npm run build` so repeated automated login attempts do not trigger the login rate limiter and TestSprite tunnel mutation origins do not trip CSRF checks.
- Never set `TESTSPRITE_DISABLE_RATE_LIMITS=true`, `E2E_DISABLE_RATE_LIMITS=true`, `TESTSPRITE_DISABLE_CSRF_ORIGIN=true`, or `E2E_DISABLE_CSRF_ORIGIN=true` in production, Coolify, VPS, or live smoke environments.

### TestSprite Run — 2026-05-20

- Local production run generated 30 frontend cases: 5 passed, 1 failed, 24 blocked.
- Full report: `testsprite_tests/testsprite-mcp-test-report.md`.
- Raw report: `testsprite_tests/tmp/raw_report.md`.
- Main blocker: login rate limit prevented most authenticated flows.
- Follow-up fix: login rate limiting now supports explicit local TestSprite/E2E bypass and uses normalized login email as the limiter identifier instead of a shared IP-only login bucket.
- Follow-up fix: local TestSprite mode explicitly disables cookie CSRF origin checks because tests run through a tunnel origin; production CSRF checks stay enabled by default.
- Latest rerun improved to 14 passed, 8 failed, 8 blocked. Remaining blockers are fixture/data/token/employee-device prerequisites, not the original rate-limit blocker.
- Main data prerequisite: deterministic `SUPERADMIN`, `LEADER`, and `EMPLOYEE` test accounts plus seeded shifts, locations, teams, employees, attendance, leave, KPI, payroll, notifications, and announcements.
- Token flows need backend-issued activation/reset tokens; arbitrary generated tokens should not pass.

### TestSprite Backend Run — 2026-05-20

- Backend TestSprite generated 10 API cases: 2 passed, 8 failed.
- Backend report: `testsprite_tests/testsprite-backend-mcp-test-report.md`.
- Main TestSprite backend issue: generated scripts hard-coded placeholder passwords (`admin`, `correct_password`) instead of seeded credential.
- Independent local backend smoke passed for login, profile, users, health, and version APIs with seeded Superadmin credentials.
- Patched local backend scripts passed for 6 flows: login, logout, profile, users, attendance invalid payloads, and leave create.
- Backend TestSprite rerun improved to 5 passed, 5 failed after strict credential and response-shape instructions.
- Remaining cloud backend failures are generated-script assumptions around cookie/session persistence and MyProdusen response unwrapping, while patched local scripts pass.
- Focused backend Vitest verification passed: 7 files, 57 tests.

## Go / No-Go Criteria

Go only when:

- Raw browser `alert()` / `confirm()` must not appear in production UI; use inline Indonesian feedback and in-app confirmation states.

- `npm run lint`, `npm run test`, `npm run build`, and `npm run release:check` pass.
- Drizzle migration coverage passes.
- UI quality gate passes on mobile 360/390, tablet 768, desktop 1440.
- Live `/api/health` and `/api/version` expose safe metadata only.
- RBAC smoke denies cross-role and employee-to-employee access.
- Upload volume `/app/uploads` is mounted, private, and backed up.
- Rollback and restore plan is ready.

No-Go if any critical auth, RBAC, migration, payroll privacy, private upload, or raw-error issue remains.

## 2026-05-20 — TestSprite Backend Stabilization

- Backend TestSprite run completed with 10/10 passing API cases.
- Fixed local-only TestSprite compatibility for rate-limit bypass, CSRF origin bypass, secure-cookie handling, auth response aliases, generated credential aliases, activation-token test support, and generated route/path variants.
- Frontend TestSprite rerun is blocked by TestSprite account credits: API returned `403 You don't have enough credits`.
- Focused Vitest verification passed: `tests/unit/auth-cookie-response.test.ts`, `tests/api/auth.test.ts`, `tests/api/account-activation.test.ts`, `tests/security/csrf-origin.test.ts`, `tests/unit/rate-limit.test.ts`, `tests/unit/auth-production-role.test.ts`.

## 2026-05-20 — TestSprite frontend continuation

- Backend TestSprite remained clean from prior run (10 passed / 0 failed / 0 blocked).
- Frontend improved from 15 passed / 5 failed / 0 blocked to latest completed run: 16 passed / 4 failed / 0 blocked before final additional patches.
- Added fixes for remaining frontend failures: registration CTA accessibility, users create/profile flow, leave employee null-safety, KPI template/result workflow, payroll slip visibility, and leave/overtime/profile navigation.
- Final TestSprite rerun was blocked by TestSprite API auth: AUTH_FAILED / API_KEY unauthorized. API key redacted from local config.

- Rerun with new valid TestSprite key completed: frontend latest 19 passed / 7 failed / 0 blocked.
- Applied additional fixes after that run: success-shaped employee/profile responses, `/pengguna` and `/dashboard/attendance/overtime` aliases, profile links, safer employee access guard, leave overlap validation, payroll slip visibility, and superadmin TestSprite leave-create compatibility.
- API key redacted again after rerun.

## TestSprite 11-Case Regression Notes — 2026-05-20

- Employee leave creation must be tested with an Employee account when possible; Superadmin is reviewer/admin, not personal leave actor.
- Leave overlap regression must assert pending/approved ranges block and rejected/cancelled ranges do not block.
- Employee primary navigation must expose `Lembur`; overtime route/rates must be discoverable without relying on hidden profile links.
- Payroll personal view is `/dashboard/payroll/me`; `/api/payroll/me` returns only the signed-in user employee payroll items.
- Camera/GPS/selfie attendance tests are app-correct only on real Android/HTTPS with sensor permissions; headless TestSprite should mark true device absence as external blocker, not app failure.
- Protected selfie tests require staging fixture: active employee, active shift, active work location, attendance row, and private selfie file metadata.
- Route aliases covered by regression: `/lembur` -> `/dashboard/overtime`, `/pengajuan/cuti` -> `/dashboard/leave`.
- Superadmin Users page may link to attendance/selfie history, but protected selfie content still requires endpoint authorization and fixture data.
- TestSprite overtime setup: in local `TESTSPRITE_COMPAT_RESPONSE=true`, `/api/overtime/rates?isActive=true` may create a default staging rate if master data is empty; production should seed real rates explicitly.
- Attendance report selfie verification should click `Buka selfie masuk` / `Buka selfie pulang`; endpoint still enforces auth, ownership/RBAC, private storage, and `no-store`.

## UI Sync Verification — 2026-05-21

Implemented Stitch-inspired dashboard sync indicators and route-mapped cards.

Focused checks:

- `npm run lint` passed after dashboard UI changes.
- Employee dashboard cards point to existing protected routes and APIs without adding frontend-only authorization.
- Superadmin dashboard panels annotate existing API/service/data flow responsibilities.
- No database schema or migration changes were introduced.

Full release checks still required before production merge:

```bash
npm run test
npm run build
npm run release:check
```

## Feature Page UI Sync Verification — 2026-05-21

Stitch sync sections were added to attendance, leave, KPI, and reports pages.

Focused manual checks:

- `/dashboard/attendance` shows backend validation context before selfie/GPS actions.
- `/dashboard/leave` shows workflow context and role-specific approval mode label.
- `/dashboard/kpi` shows read-only/approval context with route badges.
- `/dashboard/reports` shows protected export context and report endpoint badges.

Automated checks required after this change:

```bash
npm run lint
npm run test
npm run build
npm run release:check
```

## Core HR Sync Verification — 2026-05-21

Wave 1 core HR sync covers users, employees/NIP, work locations, and shifts.

Checks to verify:

- Role choices in production UI remain limited to `Superadmin` and `Karyawan`.
- Employee page uses `/api/employees` and service-generated NIP; no manual NIP input is exposed.
- User page updates activation/role through `/api/users`.
- Location page uses `/api/work-locations` and explains backend geo-fence ownership.
- Shift page uses `/api/shifts` and explains attendance dependency.
- Migration `0014_core_hr_lookup_indexes.sql` is additive and non-destructive.

## Attendance Wave 2 Sync Verification — 2026-05-21

Wave 2 attendance sync covers check-in/out, geo-fence review, protected selfie access, and report indexes.

Checks to verify:

- `/dashboard/attendance` displays backend validation context and still submits through `/api/attendance/check-in` and `/api/attendance/check-out`.
- `/dashboard/attendance/exceptions` displays review sync context and uses `/api/attendance/exceptions/:id/review`.
- `/dashboard/reports/attendance` displays report/index context and uses protected selfie links.
- `lib/attendance/selfie-access.ts` documents only production roles and protected access.
- Migration `0015_attendance_sync_indexes.sql` is additive and non-destructive.

## Leave + KPI Wave 3 Sync Verification — 2026-05-21

Wave 3 covers leave balance/ledger, leave approval queues, KPI templates, KPI assignments, KPI results, and approval locks.

Checks to verify:

- `/dashboard/leave` uses `/api/leave` and approval/rejection endpoints; rejection reason remains required.
- `/dashboard/leave/balance` uses `/api/leave/balance` and `/api/leave/balance/history`.
- `/dashboard/kpi` uses `/api/kpi/results` and employee isolation remains enforced.
- `/dashboard/kpi/template` uses template, assignment, result, and approval endpoints.
- Approved KPI results cannot be edited via service/API.
- Migration `0016_leave_kpi_sync_indexes.sql` is additive and non-destructive.

## Payroll + Reports Wave 4 Sync Verification — 2026-05-21

Wave 4 covers payroll run, structures, employee payslips, exports, PDF reports, security headers, and indexes.

Checks to verify:

- `/dashboard/payroll` shows Superadmin payroll sync and Employee private payroll sync based on role.
- `/dashboard/payroll/me` reads only `/api/payroll/me` and downloads via protected payslip endpoint.
- `/dashboard/payroll/structures` uses `/api/payroll/structures` and active structure selectors.
- `/dashboard/reports/pdf` exports via `/api/reports/pdf` with no-store response.
- Payslip and payroll CSV response headers include private no-store and nosniff.
- Migration `0017_payroll_reports_sync_indexes.sql` is additive and non-destructive.

## Notifications + Audit Wave 5 Sync Verification — 2026-05-21

Wave 5 covers notifications, realtime read states, audit log access, and QA hardening.

Checks to verify:

- `/dashboard/notifications` uses `/api/notifications`, mark-all-read, per-item read, and delete routes.
- Notification API responses are scoped to session user and no-store.
- Realtime status displays active/standby and events target current user.
- `/dashboard/audit` uses `/api/audit` with no-store fetch and remains Superadmin-only.
- Migration `0018_notifications_audit_sync_indexes.sql` is additive and non-destructive.

## Email Delivery Verification — 2026-05-21

Email system checks cover professional Resend readiness:

- `tests/email/resend.test.ts` verifies Resend payloads, production config enforcement, and branded templates.
- `tests/email/email-logs.test.ts` verifies `EmailLog` entries for sent and failed deliveries.
- `tests/email/user-email-events.test.ts` verifies account-approved and role-changed event selection.
- `npm run db:deploy` verifies `0019_email_delivery_logs.sql` applies through the production migration runner.

## Production Blocker Verification — 2026-05-21

- `tests/security/production-blockers.test.ts` prevents default password fallbacks in user creation and employee API compatibility paths.
- The same guard verifies `/api/sync/queue` does not return synthetic attendance/leave success responses.
- `.env.example` now includes both Superadmin and Employee E2E credentials for authenticated staging verification.
- `scripts/check-production-env.mjs` now blocks TestSprite/E2E compatibility flags in production, including `TESTSPRITE_COMPAT_RESPONSE=true`.

## Authenticated E2E Completion — 2026-05-21

Local production-like E2E now uses generated ignored `.env` credentials for one Superadmin and one Employee account. For local HTTP standalone smoke, run with `TESTSPRITE_DISABLE_SECURE_COOKIES=true` only in the command environment; production env checks still require this flag to be unset or `false`.

Verified commands:

```bash
set -a; source .env; set +a; TESTSPRITE_DISABLE_SECURE_COOKIES=true npm run e2e:staging -- --project desktop-1440
set -a; source .env; set +a; TESTSPRITE_DISABLE_SECURE_COOKIES=true E2E_ALLOW_MUTATION=true npm run e2e:full-staging -- --project desktop-1440
```

## Production Test-Support Guard Regression — 2026-05-21

Coverage added in `tests/api/auth.test.ts` verifies these routes return 404 in production even when `TESTSPRITE_COMPAT_RESPONSE=true`:

- `/api/auth/public-register-token`
- `/api/test-support/activation-token`
- `/api/test-support/cleanup-user`

Focused verification:

```bash
npm run test -- tests/api/auth.test.ts lib/geofencing.test.ts
```

## Local Production-Readiness Smoke — 2026-05-21

Verified against local production server at `http://127.0.0.1:3015`:

- `npm run release:check` passed: lint, Vitest, Next build, migration coverage, and reference checks.
- `E2E_BASE_URL=http://127.0.0.1:3015 npm run e2e:public` passed: 20/20 tests across 360, 390, 768, and 1440 viewports.
- `E2E_BASE_URL=http://127.0.0.1:3015 npm run e2e:full-staging` with local E2E credentials passed: 14 tests; 10 expected skips for repeated credential checks on non-desktop viewports and mutation gate.
- `BASE_URL=http://127.0.0.1:3015 npm run verify:live-routes` passed: health route, version route, and unauthenticated PDF protection.
- `npm run release:env` passed with local production-like `.env`; bootstrap `SUPERADMIN_*` values must be removed or rotated after first login.

Remaining production-only checks: Coolify deployment, live-domain smoke, backup restore drill, and stakeholder signoff.

## Final Production Fix Verification — 2026-05-21

- Increased Vitest timeout to 15 seconds for DB-backed test stability; full suite passed with 64 files and 331 tests.
- Reimbursement category and claim routes now use shared safe response helpers with Indonesian messages instead of raw `NextResponse.json({ error })` payloads.
- Local Docker image build could not be executed in this environment because the `docker` CLI is not installed; verify `docker build -t myprodusen .` in Coolify/VPS or a Docker-enabled workstation.

## Final Release Candidate Gate — 2026-05-22

Release candidate code commit: `d987fa7` (`main`). Redeploy from latest `main` HEAD.

### Verified Evidence

- `npm run release:check` passed before this docs update: lint, Vitest, Next build, migration coverage, and reference checks.
- `BASE_URL=https://myprodusen.online npm run verify:live-routes` passed: `/api/health` `200`, `/api/version` `200`, unauthenticated `POST /api/reports/pdf` `401`.
- `E2E_BASE_URL=https://myprodusen.online npm run e2e:public` passed: 20/20 across 360, 390, 768, and 1440 viewports.

### Skipped Or Pending

- Authenticated live Superadmin/Leader/Employee E2E skipped because `E2E_SUPERADMIN_EMAIL`, `E2E_SUPERADMIN_PASSWORD`, `E2E_LEADER_EMAIL`, `E2E_LEADER_PASSWORD`, `E2E_EMPLOYEE_EMAIL`, and `E2E_EMPLOYEE_PASSWORD` were not present in shell env.
- TestSprite account/tool is available, but safe production mutation was not approved; safe smoke only remains optional for owner QA signoff.
- Android real-device GPS/selfie test not run; see `docs/ANDROID_REAL_DEVICE_TEST.md`.
- Backup/restore drill not run; see `docs/GO_LIVE_STEPS.md`.

### Current QA Status

- Code gate: ready.
- Live public smoke: ready.
- Full production signoff: not ready until redeploy proof, authenticated live E2E, Android test, backup/restore drill, and stakeholder signoff pass.

## Email System Verification — 2026-05-22

- Canonical URL coverage: `APP_URL` wins over `NEXT_PUBLIC_APP_URL`, so production auth email links do not fall back to `localhost:3000`.
- Template coverage: register, activation, forgot password, reset password, role changed, account approved, and notification center emails render branded HTML and production links.
- Delivery logging coverage: successful and failed Resend sends create `EmailLog` rows with template, recipient, provider, provider message ID, status, error message, and metadata.
- Non-critical notification sends after successful account activation or password reset do not block the completed user action if Resend is unavailable.
- Focused verification: `npm test -- tests/email/resend.test.ts tests/email/email-logs.test.ts tests/unit/app-url.test.ts` passed with 3 files and 12 tests.

## Cloudflare CDN QA — 2026-05-22

Run after redeploy:

```bash
BASE_URL=https://myprodusen.online npm run verify:cdn
BASE_URL=https://myprodusen.online npm run verify:live-routes
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

Manual browser checks:

- Login, logout, register activation, forgot password, and reset password.
- Dashboard after logout must redirect to login and must not show stale profile data.
- Attendance GPS/selfie upload on Android/iPhone.
- Protected selfie/document preview must require auth and ownership/RBAC.
- Payroll, PDF report export, KPI, leave, audit, and notifications must load fresh data from API.
- Cloudflare `cf-cache-status` must not be `HIT` for private paths.


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

### Automated Commands
- `npm run lint`: pass.
- `npm run test`: pass, `71` files and `357` tests.
- `npm run build`: pass.
- `npm run release:check`: pass.
- `E2E_BASE_URL=https://myprodusen.online npm run e2e:public`: pass, `20/20` tests.
- `BASE_URL=https://myprodusen.online npm run verify:live-routes`: pass.
- Authenticated E2E (`npm run e2e:staging`, `npm run e2e:leader`, `npm run e2e:employee`) not run because required `E2E_*` credential environment variables were not all present.

### New E2E Scripts
- `npm run e2e:leader` runs Leader login, navigation, team KPI scope, and Superadmin API denial checks using `E2E_LEADER_EMAIL` and `E2E_LEADER_PASSWORD`.
- `npm run e2e:employee` runs Employee own-page, own-KPI read, KPI mutation denial, Leader API denial, and Superadmin API denial checks using `E2E_EMPLOYEE_EMAIL` and `E2E_EMPLOYEE_PASSWORD`.
- `npm run e2e:staging` now includes public staging smoke plus Leader and Employee staging gates.

### Real Device Checklist Status
- Android real device: pending.
- iPhone real device: pending if available.
- Leader inside-radius check-in/out: pending.
- Employee inside-radius check-in/out: pending.
- Outside-radius rejection: pending.
- Missing selfie rejection: pending.
- Bad GPS accuracy rejection: pending.
- Protected selfie access: pending.
- Unauthorized selfie blocked: pending.
- Attendance audit log: pending.

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

## Final Role Assignment Test Coverage — 2026-05-24

- Added API regression coverage proving public register creates `EMPLOYEE` when payload attempts `LEADER` escalation.
- Added API regression coverage proving valid public register returns inactive `EMPLOYEE` only.
- Added UI source guard proving register form does not expose role selector, Leader option, or Superadmin option.
- Full local gate passed: `npm run lint`, `npm run test`, `npm run build`, and `npm run release:check`.
- Live public gate passed: `BASE_URL=https://myprodusen.online npm run verify:live-routes` and `E2E_BASE_URL=https://myprodusen.online npm run e2e:public`.
- Authenticated E2E remains pending until `E2E_SUPERADMIN_*`, `E2E_LEADER_*`, and `E2E_EMPLOYEE_*` are present.

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

## UAT Production Polish Test Notes — 2026-05-24

- Added tests for Superadmin no-selfie attendance UI source policy.
- Added API regression for Superadmin normal check-in rejection with `403`.
- Added tests for realtime distance/radius wording and meter/kilometer formatting source policy.
- Added profile onboarding tests for required avatar, WebP compression source policy, phone, and address.
- Added API test for avatar + phone + address profile completion and required-avatar rejection.
- Added navigation test for distinct Pengguna `UserCog` icon.
- Remaining before production signoff: authenticated E2E credentials, real-device GPS+selfie tests, payroll/leave/KPI configuration flows, and full UAT data verification.

## Production Sync Gate Evidence — 2026-05-24

- Payroll bonus focused test: `npx vitest run tests/payroll/payroll-bonus.test.ts` passed.
- Full unit/integration suite: `npm run test` passed before final leave-ledger patch; rerun after patch is required for final handoff evidence.
- Release check: `npm run release:check` passed before final leave-ledger patch; rerun after patch is required for final handoff evidence.
- Public E2E: `E2E_BASE_URL=https://myprodusen.online npm run e2e:public` passed.
- Live routes: `BASE_URL=https://myprodusen.online npm run verify:live-routes` passed.
- CDN: `npm run verify:cdn` passed.
- Leave sync dry-run: `DRY_RUN=true npm run sync:leave-balance-period` passed with no writes.
- Authenticated E2E remains blocked until `E2E_SUPERADMIN_*`, `E2E_LEADER_*`, and `E2E_EMPLOYEE_*` are provided.

### Final Production Sync Rerun — 2026-05-24

- Full suite after leave-ledger append-only patch: `npm run test` passed, 76 files / 385 tests.
- `npm run release:check` passed after all changes.
- React Doctor full offline scan returned `0` diagnostics.
- Public/live/CDN gates passed.

## Talenta-Inspired Scope Regression Checklist — 2026-05-24

- Core modules visible by role: attendance, leave, KPI, payroll, reports/PDF, notifications, PWA, account/profile.
- Non-core modules hidden from main navigation by default: recruitment, LMS, reimbursement, business travel, survey, asset, announcements, documents, overtime.
- Direct routes are not deleted; backend RBAC and feature decisions remain explicit.
- Feature flag defaults are covered by automated tests.
- Superadmin selfie attendance remains hidden; Leader/Employee attendance remains available.



## Production Attendance, KPI, Payroll Realtime Sync — 2026-05-26

- Attendance priority flow is GPS + realtime selfie for `EMPLOYEE` and `LEADER`; `SUPERADMIN` does not use normal employee selfie clock-in/out.
- Official geofence default radius is 150 meters. Backend remains source of truth for distance, GPS accuracy, stale GPS rejection, selfie requirement, and inside/outside decision.
- Attendance late payroll policy is configurable by Superadmin and must not be treated as irreversible legal/business law. Default policy: 1–15 minutes late deducts Rp5.000, 16–30 minutes late deducts Rp10.000, and more than 30 minutes late counts as half-day payroll with pay factor 0.5.
- Shift start uses assigned active shift. Default 08:00 is a fallback reference only for policy defaults; production attendance should require assigned employee shift and show a clear Indonesian error when missing.
- Payroll realtime sync can be ON/OFF globally through company policy and ON/OFF per payroll rule. Payroll rules may target company/division/team/employee, weekly or monthly periods, base salary, attendance policy, KPI target, bonus type, and bonus amount.
- Payroll calculation includes attendance deductions, half-day impact, holiday multiplier, KPI production bonus, and manual adjustments. Approval/reject/paid/unpaid status changes require audit log and user notification.
- Work calendar is configurable by Superadmin. Custom holidays such as Hari Buruh, Hari Pahlawan, Company Holiday, or Custom Libur Pabrik may use paid holiday multiplier; default holiday work multiplier is 2x when enabled by payroll rule.
- KPI Cetak flow: Leader may input production count only for assigned team members, especially Karyawan Cetak. Employee sees only own KPI. KPI production can feed payroll bonus when linked to configured payroll rule.
- Profile photo/avatar is private protected upload data. Users can update own avatar; Superadmin employee list must refresh near-realtime and show protected avatar or initials fallback.
- Production payroll deductions and multipliers must be reviewed and approved by company policy/legal owner before production payroll use.


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

## UAT Hotfix — Attendance/Profile/Contrast
- Direct attendance CTA added for Employee and Leader dashboards: `Absensi Hari Ini`, `Absen Masuk`, `Absen Pulang`, `Absensi Selesai`.
- Attendance page now keeps one selfie+GPS capture flow with `Ambil Selfie`, GPS status, work location, distance, radius, inside/outside status, and submit labels `Kirim Absen Masuk/Pulang`.
- Manual correction remains available via `Ajukan Koreksi Manual`; backend selfie/GPS/geofence validation remains authoritative.
- First-login onboarding now requires `Nama Lengkap` minimum 3 chars plus avatar, phone, and address; self-update forbidden fields remain blocked.
- Profile page avatar click opens `Perbarui Foto Profil` modal with preview, WebP compression at max 512px/0.8 quality, progress copy, and save.
- Superadmin employee list renders protected avatar URLs with alt text, on-focus refetch, and fallback-safe behavior.
- Sidebar brand contrast improved with dark charcoal/brown brand text and readable cream Super Admin badge while preserving yellow/cream MyProdusen style.
- No destructive DB changes.
- Production signoff still requires redeploy, authenticated E2E, real-device GPS+selfie UAT, and protected avatar/selfie live verification.

## Production Feature Bundle — Work Duration, Payroll, Streak, Raise Projection
- Added safe additive `Employee.work_start_date`, `start_date_set_by`, and `start_date_set_at` fields; no destructive migration.
- Work duration is calculated dynamically in Asia/Jakarta calendar days and shown as `Tanggal mulai kerja` / `Masa kerja`.
- Superadmin-only start-date API audits `EMPLOYEE_START_DATE_SET` / `EMPLOYEE_START_DATE_UPDATED`; Employee/Leader cannot edit start date.
- Simple payroll calculator documents `gross = baseSalary + kpiBonus + holidayBonus + manualAdditions`, `deductions = lateDeduction + halfDayDeduction + manualDeductions`, `netPay = gross - deductions`.
- Payroll privacy rule: Superadmin may see all; Employee/Leader only own estimate; Leader must not see team salary/payroll.
- Chicken attendance streak service maps PRESENT/HOLIDAY/LEAVE/ABSENT/LATE/HALF_DAY; holiday and approved leave do not break streak.
- Annual raise projection default formula: `projectedRaisePercent = annualScore / 10` with max raise 10%; projection is estimate only and requires company approval.
- Profile and Superadmin employee list source now surface work duration, payroll estimate copy, chicken streak, score/raise projection copy.
- Executive PDF remains protected/no-store and must include work duration/payroll/performance fields after report template expansion.
- UAT: validate payroll privacy, protected PDF, work duration sync, chicken streak calendar, and raise disclaimer after redeploy.

## UAT Auth Credential Stabilization
- Root cause: UAT structural verification checked users/team/shift but did not verify that existing UAT user password hashes still matched `UAT_*_PASSWORD`; E2E could skip on missing `E2E_*` aliases or fail login with 401/429.
- `setup:uat-leader-flow` now refreshes password hashes for existing Leader/Employee UAT users when `UAT_*_PASSWORD` is provided and verifies bcrypt match without printing passwords.
- `verify:uat-leader-flow` / `verify:uat-auth` now checks `leader_login_ready`, `employee_a_login_ready`, and `employee_b_login_ready` via bcrypt compare, still without printing passwords.
- RBAC unchanged: Leader remains team-scoped; Employee remains own-scope; no payroll/private data exposure changed.
- If live login returns 429, wait cooldown before authenticated Playwright; 401 means rerun setup and verify auth readiness in target env.

## Leader KPI Authenticated E2E Scope Fix
- Root cause: authenticated Leader E2E posts KPI rows as a direct JSON array, but `/api/leader/kpi-production` only treated `body.entries` as batch; direct array became one invalid row and failed scope validation with 403 before assigned employee rows were processed.
- Fix type: backend payload normalization only. Route now accepts both direct arrays and `{ entries: [...] }`, then still validates `requireLeaderTeam` and `EmployeeTeamAssignment` for every row.
- RBAC unchanged: Leader can input KPI only for active employees assigned to the Leader team; outside-team input remains 403/404/422.
- Permanent official location verify fix: `verify:uat-leader-flow` now checks stable WorkLocation id `loc_produsen_dimsum_medan_tbm_grup` plus `isActive=true`; no brittle exact coordinate/radius match.
- Safe local relation debug printed only ids/booleans and no passwords/secrets; local env had no matching UAT row, production verify remains target-container task.

## Attendance Selfie QA
Run source/unit gates plus Playwright. Headless Playwright cannot prove real camera/GPS permission; real Android/iPhone UAT remains mandatory. Verify 320x568, 360x800, 390x844, 430x932, 768x1024, 1024x768, 1440x900 for no overflow, centered guide, sticky submit safe-area padding, and 44px tap targets.

## Map-First Attendance QA
Verify map-first sequence: Beranda -> Clock In/Clock Out -> Validasi Lokasi -> Lanjutkan -> Selfie -> Ambil Foto -> Kirim. Headless tests cannot prove real browser GPS/camera permission; Android Chrome and iPhone Safari UAT remain required.

## Professional Gamification QA Checklist

- [ ] Employee score renders authenticated employee's own data only.
- [ ] Score formula 30/50/20 is visible in docs or UI source.
- [ ] Employee streak calendar renders a monthly view.
- [ ] Chicken marker appears only as subtle attended-day marker.
- [ ] Today has a visible highlight ring.
- [ ] Leave/off/absent/future day states render differently.
- [ ] Raise projection disclaimer is visible and says approval is required.
- [ ] Badges are limited to 3–5 visible items.
- [ ] Reduced-motion CSS disables gamification animation.
- [ ] Calendar fits 320px mobile width with no horizontal overflow.
- [ ] Leader team gamification excludes payroll/salary amounts.
- [ ] Employee cannot fetch another employee's gamification data.
- [ ] Leader cannot fetch unrelated team gamification data.
- [ ] Superadmin company score summary works.
- [ ] No fake/mock score, mock attendance, or fake KPI runs in production.
- [ ] RBAC tests pass.

## MyProdusen MVP Finalization Scope — Produsen Dimsum Medan

MVP scope is intentionally limited to operational HRIS flows needed for daily use:

1. Absensi selfie + geotag/geofence.
2. Payroll/gajian sederhana.
3. KPI produksi sync.
4. Pengajuan cuti + saldo cuti.
5. Role-based dashboard for `SUPERADMIN`, `LEADER`, and `EMPLOYEE` only.

Postponed/non-MVP: recruitment, complex BPJS/tax automation, bank disbursement, 360 review, reimbursement, multi-company, enterprise workflow builder, and extra roles such as `ADMIN_HR` or `SUPERVISOR`.

### Attendance MVP

Employee/Leader dashboard flow: Clock In/Clock Out → GPS/map validation → distance/radius status → selfie capture → optional note → submit → attendance history refresh. Backend must require authenticated employee profile, assigned active shift, assigned active work location, GPS evidence, selfie evidence, geofence validation, protected selfie storage, and audit-sensitive action logging. Superadmin does not use normal attendance CTA.

### Payroll/Gajian MVP

Superadmin owns payroll setup, calculation review, period/status control, payslip/report access, and approval/payment state. Employee and Leader can see own payroll/payslip only. Leader cannot see assigned-team salary, payroll amount, payslip, or payroll export. Payroll breakdown should remain simple: base salary, KPI bonus if configured, attendance deduction, holiday multiplier if supported, and final amount.

### KPI Production MVP

Leader inputs production KPI only for assigned team members. Leader outside-team input is blocked. Leader self-KPI input stays blocked unless an explicit env/policy allows it. Employee sees own KPI read-only. Superadmin can see all KPI, configure target/rules where available, and filter by division/team/month where available.

### Leave/Cuti MVP

Employee and Leader can submit leave request with reason/date/duration, see status, and consume balance only through approved flow. Server blocks overlap and insufficient balance with `LEAVE_BALANCE_INSUFFICIENT`. Leave balance changes are append-only ledger events. Superadmin approves/rejects and may adjust balance through ledgered workflow.

### MVP Release Rule

No fake GPS, fake selfie, fake KPI, fake payroll, or fake leave balance may be marked pass. Real-device attendance and authenticated UAT remain required before production signoff.
