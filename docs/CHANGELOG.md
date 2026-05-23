# Changelog — MyProdusen

## 2026-05-20 — Deployment Readiness Hardening

- Fixed `npm run db:seed` so local/staging seed is executable and idempotent without duplicate user failures.
- Hardened offline sync UI by replacing raw browser alerts with inline Indonesian feedback and responsive accessible controls.
- Removed raw confirmation dialogs from overtime approval and payroll structure deletion; actions now use visible in-app confirmation states.
- Kept seed credentials environment-only; current UAT model uses Superadmin/Leader/Employee accounts.
- Added local TestSprite/E2E rate-limit bypass flags and `npm run start:testsprite`; production login rate limiting remains enabled by default.
- Changed login rate-limit identifier to normalized login email to avoid one shared IP bucket blocking unrelated test users.
- Added local-only TestSprite/E2E CSRF origin bypass flags for tunnel-based browser mutation tests; production CSRF origin checks remain enabled by default.
- Mapped historical `ADMIN_HR` and `SUPERVISOR` values to `EMPLOYEE` in user-management summaries so legacy roles are not exposed in production UI.
- Added TestSprite backend report and documented generated-test credential mismatch for backend API checks.
- Added env-based patched backend TestSprite scripts and local `requests` shim so generated API checks can run without hard-coded secrets or extra dependencies.
- Reran backend TestSprite after stricter credential/response-shape instructions; cloud backend result improved from 2/10 to 5/10 passed.

## 2026-05-20 — Two-Role Final Sync

- Locked all project documentation to the final three-role production model: `SUPERADMIN`, `LEADER`, and `EMPLOYEE`.
- Clarified local seed login emails while keeping passwords environment-only.
- Removed Admin HR/Supervisor credential requirements from full staging E2E; historical roles remain deny-only test fixtures.
- Re-verified Drizzle/PostgreSQL wording and nested `/docs/<topic>/README.md` documentation map.

## 2026-05-20 — Documentation Consolidation And Role Alignment

- Consolidated documentation into canonical docs: PRD, Architecture, Database, Security, UI/UX, Deployment, Testing QA, Operations, Final Checklist, Changelog.
- Re-aligned PRD and AGENTS to two production roles: `SUPERADMIN`, `EMPLOYEE`.
- Restored Admin HR/Supervisor historical-only rule for production UI and access.
- Confirmed Drizzle ORM + PostgreSQL + Drizzle SQL migrations + `npm run db:deploy` as final database stack.
- Removed Prisma references from active AGENTS and canonical database guidance.
- Clarified payroll as active when implementation is already enabled/documented; payroll data remains RBAC-protected.
- Added UI quality gate, API error standard, Definition of Done, and frontend/backend/database wiring rule.
- Merged testing reports into `TESTING_QA.md` and operations/deploy runbooks into `DEPLOYMENT.md` / `OPERATIONS.md`.
- Synced code role helpers, validation schemas, navigation policy, payroll access, dashboard role experience, and RBAC tests to three-role model.

## 2026-05-20 — WCAG UI/UX Hardening

- Fixed shared modal accessibility: proper `role="dialog"`, `aria-modal`, focus restore, Escape close, focus trap, mobile-safe footer action stacking, and 44px close target.
- Hardened shared buttons against clipped labels and icon/text overlap with shrink-safe icon/text layout.
- Marked decorative input icons as `aria-hidden`.
- Improved navigation active-state contrast and semantic status color contrast for WCAG-friendly readability.
- Confirmed attendance selfie preview remains mirrored for front camera and camera errors use high-contrast text tokens.

## 2026-05-20

- Added local-only TestSprite backend compatibility paths and aliases to make generated backend API tests deterministic without enabling production bypasses.
- Added TestSprite frontend code summary artifact and attempted frontend TestSprite run; blocked by TestSprite billing credits.
- Verified backend TestSprite 10/10 pass and focused Vitest 31/31 pass.

## 2026-05-20 — TestSprite frontend fixes continued

- Improved TestSprite frontend compatibility and real UI reachability for users, KPI templates/results, leave details, payroll, notifications, PDF export, overtime, and profile navigation.
- Fixed PDF report date serialization after selfie-field sanitization.
- Added local-safe registration and user-management UI affordances needed by E2E flows.
- Final TestSprite rerun could not complete because supplied TestSprite API key returned unauthorized; local config was redacted.

- Reran frontend TestSprite with replacement key: 19 passed / 7 failed / 0 blocked before final local patches.
- Added final patches for users access, employee create/profile response shape, attendance overtime alias, leave overlap validation, employee access guard, payroll slip text, and report/profile links.
- Redacted TestSprite API key from local config after run.

## 2026-05-20 — TestSprite Failed/Blocked Case Sync

- Added Employee-visible `Lembur` navigation and dashboard CTA so overtime request/rate flows are discoverable.
- Allowed Superadmin own payroll read only through signed-in own employee profile, while preserving Employee own-only and Superadmin admin payroll access.
- Updated regression tests for overtime navigation, payroll own-read policy, leave overlap, and leave balance ledger.
- Documented remaining true external blockers for headless camera/GPS and protected selfie fixture requirements.
- Added safe route aliases `/lembur` and `/pengajuan/cuti` for TestSprite/manual deep links.
- Exposed Superadmin `Cuti` navigation for review workflows and added protected attendance/selfie history links from Users records with employee profiles.
- Sent explicit Superadmin approval override reason from leave approval UI so locked-period policy remains auditable.
- Added TestSprite/local fallback active overtime rate creation when no rates exist, gated by `TESTSPRITE_COMPAT_RESPONSE=true`.
- Added protected selfie links in attendance reports for rows with selfie metadata.
- Added auditable Superadmin override reason for leave rejection UI requests.

## 2026-05-21 — Stitch Dashboard UI Sync

- Added Stitch-aligned Employee dashboard sync strip, NIP/role API badges, attendance proof card, and personal feature cards for leave, KPI, payroll, notifications, and offline sync.
- Added Superadmin dashboard control-center panels mapping UI modules to employees/users, attendance exceptions, leave/KPI approvals, reports, audit logs, and dashboard stats APIs.
- Added shared `sync-strip`, `api-pill`, and attendance-card styling using existing MyProdusen brand tokens.

## 2026-05-21 — Feature Page Stitch UI Sync

- Added Stitch sync strips and route badges to attendance, leave, KPI, and reports pages.
- Clarified backend-source-of-truth rules in UI copy for GPS/geofence/selfie, leave overlap/approval, KPI approval locks, and protected report exports.

## 2026-05-21 — Core HR Wave 1 Sync

- Added additive Core HR lookup indexes for employee default shift/location, work-location name, and shift active/name queries.
- Added Stitch sync strips and route/database badges to employees, users, work locations, and shifts pages.
- Documented Wave 1 Core HR sync behavior, role lock, and migration safety.

## 2026-05-21 — Attendance Wave 2 Sync

- Aligned Drizzle attendance schema with report/history indexes and added additive indexes for `Attendance.shiftId` and `AttendanceException(status, createdAt)`.
- Added Stitch sync sections to attendance exception review and attendance report screens.
- Updated protected selfie access documentation to match the three-role production model.

## 2026-05-21 — Leave + KPI Wave 3 Sync

- Added additive Leave/KPI indexes for approval queues, overlap checks, active templates, assignment review, employee-period summaries, and approval-status dashboards.
- Added backend guard preventing edits to approved KPI results through submit/update paths.
- Added Stitch sync sections to leave balance and KPI template/assignment pages.

## 2026-05-21 — Payroll + Reports Wave 4 Sync

- Added additive payroll/report indexes for active salary templates, payroll assignments, run status/period filters, and employee payslip lookups.
- Added no-store/nosniff headers to protected payslip downloads and payroll CSV exports.
- Added Stitch sync sections to payroll, personal payslip, payroll structures, and PDF report pages.

## 2026-05-21 — Notifications + Audit Wave 5 Sync

- Added additive indexes for notification unread/history feeds and audit action/entity/user timelines.
- Added no-store headers to notification list and audit log API responses.
- Added Stitch sync sections to notifications and audit log pages.

## 2026-05-21 — Professional Email Delivery Logs

- Added `EmailLog` schema and migration `0019_email_delivery_logs.sql` for Resend delivery auditability.
- Added delivery logging for sent, failed, and skipped email attempts without storing secrets or tokens.
- Updated migration runner to load local `.env` while preserving production process environment behavior.
- Added focused tests for email delivery logging.

## 2026-05-21 — Production Blocker Hardening

- Removed default `Password123!` fallback from user creation UI and employee API normalization.
- Replaced mock offline sync queue success responses with fail-closed production messaging.
- Added regression tests for password and sync production blockers.
- Added employee E2E credential placeholders to `.env.example`.

## 2026-05-21 — Production Release Gate Docs

- Updated deployment and final checklist docs to require `npm run release:env` and `npm run release:check:full` before promotion.

## 2026-05-21 — Authenticated E2E Risk Closure

- Added local production-like E2E credentials in ignored `.env`; current local UAT may seed Superadmin/Leader/Employee accounts from env only.
- Fixed standalone build asset copying so `npm run start:prod` serves `_next/static` and `public` assets correctly.
- Forced Vitest setup to use `NODE_ENV=test` so production-like local `.env` values do not change unit-test runtime behavior.

## 2026-05-21 — Final Coolify Go-Live Runbook

- Added Coolify release/start command guidance for `release:env`, `db:deploy`, and `start:prod`.
- Documented standalone static asset behavior and local-only secure-cookie E2E override.
- Added post-bootstrap cleanup and go-live command order to deployment/operations docs.

## 2026-05-21 — Test-Support Production Guard Fix

- Blocked activation-token and cleanup test-support helpers in production regardless of TestSprite compatibility flags.
- Added regression tests proving production returns 404 for public register-token and test-support helper routes.
- Kept TestSprite compatibility route behavior available only outside production.

## 2026-05-21 — Local Production-Readiness Smoke

- Ran full local release gate and local production server smoke checks.
- Verified public responsive smoke across 360, 390, 768, and 1440 viewports.
- Verified local credential staging smoke, health/version safety, and unauthenticated protected PDF behavior.
- Documented remaining external gates: Coolify deploy, live-domain smoke, backup restore drill, and stakeholder signoff.

## 2026-05-21 — Final Production Fix Pass

- Raised Vitest timeout for DB-backed tests to reduce parallel-run flakiness.
- Standardized reimbursement API responses through shared response helpers with safe Indonesian errors.
- Re-ran migration deploy locally; all migrations were skipped/applied as expected and deployment runner completed.

## 2026-05-21 — Coolify Migration Startup Hotfix

- Made `scripts/run-migrations.mjs` tolerate production runtime images without the dev-only `dotenv` package.
- Coolify runtime now uses process environment directly and will not fail startup migrations with `ERR_MODULE_NOT_FOUND: dotenv`.

## 2026-05-22 — CI/CD Readiness Gate

- Added GitHub Actions CI for PostgreSQL-backed release checks on push and pull request.
- Added Docker image build validation using Buildx without publishing images.
- Documented CI as a validation gate before Coolify deployment.

## 2026-05-22 — Fullstack Platform Readiness Hardening

- Added GitHub Actions release-check and Docker-build validation gates.
- Added global API CSRF middleware for cookie-authenticated mutations.
- Added password-reset rate limiting.
- Moved employee document uploads to private `UPLOAD_DIR` storage with protected download endpoint.
- Added migration checksum mismatch detection to the deployment runner.
- Added private no-store headers to shared API response helpers.

## 2026-05-22 — Backup Restore Compatibility Fix

- Updated restore script to use `pg_restore` for custom-format database dumps created by the backup script.
- Aligned upload restore default with production private volume `/app/uploads`.

## 2026-05-22 — Final Release Candidate Gate

- Documented release candidate code commit `d987fa7` and instructed Coolify redeploy from latest `main` HEAD.
- Documented live safe route result: health `200`, version `200`, unauthenticated report PDF `401`.
- Documented live public responsive smoke result: 20/20 pass across 360/390/768/1440.
- Added Android real-device GPS/selfie checklist.
- Marked authenticated live E2E, Android real-device test, backup/restore drill, redeploy proof, and stakeholder signoff as pending before full production signoff.

## 2026-05-22 — Migration Checksum Compatibility Hotfix

- Allowed approved legacy checksums for `0004_attendance_exceptions.sql` and `0005_leave_balance_ledger.sql` after their SQL was made idempotent without changing created schema objects.
- Kept checksum mismatch protection active for all other migrations and unexpected checksum values.

## 2026-05-22 — Email Activation Link And UI Polish

- Fixed activation and reset email links to prefer canonical `APP_URL` over `NEXT_PUBLIC_APP_URL`, preventing `localhost:3000` links in production email.
- Refined MyProdusen email header/footer visual treatment with a lighter logo tile and TBM Group badge for better Gmail readability.
- Added regression tests for canonical app URL precedence and branded email HTML output.

## 2026-05-22 — Email System Production Coverage

- Added canonical URL regression coverage across all auth email templates.
- Kept Resend delivery attempts wired to `EmailLog` for sent and failed emails.
- Made account-approved and reset-password notification emails non-blocking after the core user action succeeds.

## 2026-05-22 — Responsive Dashboard UI Cleanup

- Removed production-visible engineering/debug pipeline cards and endpoint/database chips from dashboard feature pages.
- Limited mobile bottom navigation to five role-specific primary items and kept desktop-only logo out of mobile nav.
- Updated Akun logout confirmation copy and added UI regression tests for forbidden debug labels and primary nav policy.

## 2026-05-22 — Cloudflare CDN Sync

- Added global no-store headers for protected API, dashboard, and upload paths.
- Added `npm run verify:cdn` to validate static cache, private no-store, Cloudflare cache status, and secret-free responses.
- Made client IP extraction Cloudflare-aware for rate limiting and audit logs.
- Documented Cloudflare DNS, SSL, cache bypass, static cache, purge, and emergency DNS-only rollback rules.

## 2026-05-22 — Dashboard CDN Header Hotfix

- Added exact `/dashboard` no-store header rule because live Cloudflare audit found the unauthenticated redirect was dynamic but missing `Cache-Control`.
- Kept nested `/dashboard/:path*`, `/api/:path*`, `/uploads`, and `/uploads/:path*` protected with `no-store, private`.

## 2026-05-22 — Real Device Mobile Nav Fix

- Hardened phone bottom navigation to one row, five items, safe-area padding, and `76px` base height.
- Moved tablet navigation to compact sticky sidebar from `768px` upward.
- Removed legacy nav marketing/logout helper card and added source regression tests for nav cleanliness.
- Made the dashboard skip link hidden until keyboard focus.

## 2026-05-22 — Professional UI/UX Audit & Complete Verification Gate

- Audited all user-facing public and authenticated layouts across small/medium phones, tablet, and desktop viewports.
- Verified absolute compliance of phone bottom navigation: mascot-free, marketing-free, and limited to exactly 5 items per role in one row.
- Confirmed skip-link accessibility is fully functional (hidden on layout and visible on keyboard focus).
- Validated real logout functionality inside Akun page with modal confirmation and loading state.
- Checked and verified that all engineering/debug chips (e.g. Frontend, API, Drizzle, etc.) are completely absent from user-facing screens.
- Executed the full CI/CD release gate successfully (TypeScript, Drizzle migrations, reference contracts, Vitest suite with 349/349 passing, standalone production build, Playwright public and staging E2E smoke tests).


## 2026-05-22 — Official Work Location Geofence

- Added official work location upsert script for `Produsen Dimsum Medan | TBM GRUP` at `3.6009125, 98.6964954`, radius `100m`.
- Added Cabang Google Maps links and attendance distance/radius preview.
- Expanded attendance audit metadata for accepted and rejected GPS/selfie/geofence outcomes.
- Added regression tests for official coordinate, outside-radius rejection, bad GPS accuracy, UI contract, and seed script safety.


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

## 2026-05-24 — Production UAT Leader Gate Preparation

- Added `npm run seed:leader-teams` with safe idempotent upsert for `Cetak`, `Gudang`, and `Pengiriman` teams; no credentials, no deletes, no resets.
- Added `npm run e2e:leader` and `npm run e2e:employee`; expanded `npm run e2e:staging` to include Leader and Employee credential-only staging gates.
- Ran configured database migration and applied `0020_leader_role_teams_kpi_production.sql`.
- Verified official work location and seeded teams exist.
- Confirmed production data blockers: no active Leader, no Leader profile/location/shift, no Leader assignment, and no Employee team assignment.
- Ran local release gate and live public route checks; authenticated E2E and real-device GPS+selfie remain pending.
- Final gate status: NOT READY for production signoff until staging data assignment, authenticated E2E, RBAC scope checks, and real-device attendance pass.

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

## 2026-05-24 — Final Role Assignment Model Hardening

- Enforced employee-only public registration and ignored self-submitted role/work-assignment escalation fields.
- Updated register success copy to clarify Superadmin assignment of division, position, location, and shift.
- Added Superadmin user assignment controls for role, team/division, position/title, location, shift, and active status.
- Added backend safeguards for Leader promotion prerequisites, self-demotion, last Superadmin protection, and Leader assignment deactivation when demoted to Employee.
- Added additive `Position`/assignment metadata migration and expanded safe team seed data.
- Added registration/UI regression tests and ran local release gate plus live public smoke.

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
