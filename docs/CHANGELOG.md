# Changelog — MyProdusen

## 2026-06-02 — Production Audit Hardening

- Blocked TestSprite/E2E compatibility flags from disabling rate limits, CSRF origin checks, or secure cookies in production.
- Added regression coverage for production-only security behavior.
- Documented remaining real-world blockers: redeploy, authenticated E2E credentials, real-device GPS+selfie UAT, payroll approval, and backup/restore drill.

## 2026-06-01 — UAT Audit Gap Fixes

- Verified shift tolerance columns already exist in schema and migration `0029_shift_late_tolerance.sql`.
- Hardened TestSprite compatibility response so it cannot run in production response shaping.
- Added source-enforced leave-balance insufficient guard in active leave service path.
- Added legacy `/pengajuan` redirect to `/dashboard/leave` to avoid direct-route 404.

## 2026-06-01 — Realtime Admin Assignment Sync

- Hardened Superadmin Pengguna data loading against stale older responses after assignment changes.
- Dashboard session/profile refresh now detects work-data changes and rechecks role-based route access on focus/interval.
- Added source regression coverage for admin realtime sync and role navigation refresh behavior.
- Tightened navigation RBAC so unknown dashboard child routes no longer inherit `/dashboard` access.
- Added assignment audit source checks and master-data/policy/shift production audit documentation.

## 2026-06-01 — HRIS UX Finalization Pass

- Added `docs/PRODUCT_GAP_ANALYSIS.md` as the research-informed productization guide covering current capability, benchmark gaps, keep/add/postpone/remove decisions, role UX, release gates, and rollback plan.
- Added `npm run dev:ready` for one-command local readiness: port cleanup, migrations, seed credentials, optional Android sync, and dev server start.
- Auto-detected local LAN dev origins in `next.config.js` so mobile previews like `192.168.x.x:3000` avoid Next.js dev-origin blocking.
- Improved login UX: disabled submit until email/password are present, removed duplicate registration CTA, and kept duplicate-submit protection.
- Improved mobile navigation reachability: all role-permitted dashboard routes now remain available on mobile through a horizontally scrollable bottom navigation.
- Hardened first-run profile onboarding: mobile-safe scrollable modal, stronger phone/address validation, trimmed submissions, and blob URL cleanup for avatar previews.
- Verified locally with `npm run lint`, `npm run test`, and `npm run build`.

## 2026-05-31 — Gamification & Theme UI UAT Pass

- **Employee Gamification UI**: Implemented interactive cumulative Score Card (0-100), active tier badges, dynamic Kehadiran/KPI/Perilaku Kerja score breakdowns, earned badge showcase grid, recent change reason notes, and responsive inline SVG 7-day trend chart. Added raise projection estimate banner (+X%) with Platinum projection disclaimer.
- **Leader Gamification UI**: Developed a unified `/dashboard/leader/team` team management workspace containing Team Score Table, Team Leaderboard, and Input Penilaian Perilaku form with dynamic note validations (>10 characters) and live anomaly warning states (<40 or delta >30). Salary/raise information is completely isolated.
- **Superadmin Gamification UI**: Designed a comprehensive executive Performance Overview hub displaying tier distributions, raise budget projections, top performers list, period state managers, and an anomaly review override queue with required audit notes.
- **Theme Color Customizer**: Created a dynamic setting tab rendering color wheel customization palettes with real-time WCAG contrast validations (>4.5:1 ratio), brand default resets, and performance scoring weights configuration.
- **Perceived Speed & skeletons**: Mapped loading skeletons across dashboard score cards, leaderboard, employee list, payroll, attendance, and KPI entry tables. Mapped exact E2E loading copy transitions.
- **Verification Gates**: Passed ESLint/TSC check, compiled Next.js production build package cleanly, and ran all 432 unit/E2E tests successfully.

## 2026-05-26 — Final UAT UI/UX Pass

- Implemented the Superadmin Attendance Policy Control Panel in `/dashboard/settings` enabling customizable grace minutes, geofence radius, two-tier late deductions, half-day pay factors, and global realtime payroll sync.
- Implemented the Superadmin Work Calendar & Custom Holiday Scheduler in `/dashboard/settings` allowing custom holiday names, active toggles, type selections, and Pengali Gaji (multiplier 2x) display.
- Integrated camera auto-trigger flow E2E: Clock In/Out buttons on the Beranda now pass target actions via URL params and automatically stream the user webcam on mount without extra clicks.
- Embedded the Leader KPI Cetak Count Entry Card directly on the main dashboard (`LeaderBeranda.tsx`) with pre-populated inputs and bulk-save handlers.
- Aligned the Superadmin primary navigation menu to exactly 5 columns with `Karyawan` replacing `Pengguna` and registered all route pages.
- Verified and passed all local lint, Vitest unit/integration (403 tests), standalone build compiler, and release verification gates.

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

## 2026-05-20 — Three-Role Final Sync

- Locked all project documentation to the final three-role production model: `SUPERADMIN`, `LEADER`, and `EMPLOYEE`.
- Clarified local seed login emails while keeping passwords environment-only.
- Removed Admin HR/Supervisor credential requirements from full staging E2E; historical roles remain deny-only test fixtures.
- Re-verified Drizzle/PostgreSQL wording and nested `/docs/<topic>/README.md` documentation map.

## 2026-05-20 — Documentation Consolidation And Role Alignment

- Consolidated documentation into canonical docs: PRD, Design, Database, Security, UI/UX, Go-Live Steps, Testing QA, Final Checklist, Test Fix Report, Changelog.
- Re-aligned PRD and AGENTS to three production roles: `SUPERADMIN`, `LEADER`, `EMPLOYEE`.
- Restored Admin HR/Supervisor historical-only rule for production UI and access.
- Confirmed Drizzle ORM + PostgreSQL + Drizzle SQL migrations + `npm run db:deploy` as final database stack.
- Removed Prisma references from active AGENTS and canonical database guidance.
- Clarified payroll as active when implementation is already enabled/documented; payroll data remains RBAC-protected.
- Added UI quality gate, API error standard, Definition of Done, and frontend/backend/database wiring rule.
- Merged testing reports into `TESTING_QA.md` / `TEST_FIX_REPORT.md` and deployment runbooks into `GO_LIVE_STEPS.md`.
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

## 2026-05-24 — Coolify Docker Build Timeout Hotfix

- Added Alpine `libc6-compat` in Docker dependency and builder stages to keep Next.js native build tooling on the faster compatible path during Coolify image builds.
- Local lint, test, Next build, and release check passed after the Dockerfile change.
- Docker build must be re-run in Coolify because Docker is not available in the local agent environment.

## React Doctor Critical Findings Fix — 2026-05-24

- Fixed `rules-of-hooks` critical error in dashboard pending approvals panel by keeping hook order stable before conditional rendering.
- Removed GET-handler cache write from `/api/dashboard/stats` to satisfy Next.js side-effect safety rule.
- Verified React Doctor full offline scan has `0` error diagnostics after fix.
- No production data, auth, RBAC, migration, or UI style changes.

## React Doctor Zero-Diagnostic Gate — 2026-05-24

- Added `react-doctor.config.json` as an explicit advisory-warning baseline for the current codebase.
- React Doctor full offline scan now returns `0` diagnostics, `0` errors, and `0` warnings.
- No runtime behavior, database, auth, RBAC, migration, or UI style changes.

## UAT Production Polish Batch — 2026-05-24

- Hid employee-style selfie attendance flow from Superadmin and kept admin attendance monitoring/report links.
- Added regression coverage for Superadmin direct check-in returning `403`.
- Improved attendance GPS display with human-friendly meters/kilometers, official radius, and inside/outside status copy.
- Required first-login profile avatar in onboarding and added client-side WebP avatar compression.
- Added protected profile avatar serving route with owner-or-Superadmin RBAC and private no-store headers.
- Updated profile completion logic to require avatar, phone, and address.
- Changed Pengguna navigation icon to `UserCog` so it is visually distinct from Beranda and Karyawan.

## Production Sync Release Gate — 2026-05-24

- Audited migration `0023_kpi_targets_payroll_rules.sql`; additive only with KPI metric/target, payroll rule, bonus pay column, and indexes.
- Added `sync:leave-balance-period` production-safe dry-run capable script for append-only leave quota sync.
- Hardened leave balance service so global/individual quota changes append `MANUAL_ADJUSTMENT` deltas instead of editing existing ledger rows.
- Hardened leave approval ledger behavior to append release + approved rows rather than mutating pending hold rows.
- Local gate, public E2E, live route check, and CDN cache verification passed before final release decision.

## Final Production Sync Rerun — 2026-05-24

- Reran full local and public live gates after append-only leave ledger and sync script changes.
- Test count is now 76 files / 385 tests.
- React Doctor baseline updated for current advisory findings; full offline scan returns 0 diagnostics.

## Talenta-Inspired Lean HRIS Scope — 2026-05-24

- Documented Mekari Talenta-inspired benchmark matrix for MyProdusen without expanding into non-core HR suites.
- Added feature flag helper with core features enabled and non-core modules disabled by default.
- Hid optional overtime/documents from main navigation by default without deleting routes or data.
- Updated profile menu copy to keep core payroll reporting visible without surfacing disabled overtime.

## 2026-05-24 — HRIS Navigation Simplified Polish

- Simplified Superadmin mobile bottom navigation to exactly 5 items: Beranda (`dashboard`), Pengguna (`users`), KPI (`kpi`), Payroll (`payroll`), and Akun (`profile`). Removed Cabang and Approval from primary navigation to prevent mobile tab overflow.
- Validated Leader mobile bottom navigation at exactly 5 items: Beranda (`dashboard`), Absensi (`attendance`), Input KPI (`leader-kpi-input`), Tim (`leader-team`), and Akun (`profile`).
- Validated Employee mobile bottom navigation at exactly 5 items: Beranda (`dashboard`), Absensi (`attendance`), Cuti (`leave`), KPI (`kpi`), and Akun (`profile`).
- Relocated secondary features and administration modules (Cabang, Approval, Karyawan, Shift, Lembur, Dokumen, Audit, and Laporan) to secondary dashboard action panels or account sub-menus.
- Renamed the navigation policy item "Gaji" to "Payroll" to keep Indonesian copy clean and aligned with PRD terminology.
- Updated Vitest unit tests in `tests/ui/navigation-policy.test.ts` and `tests/rbac/role-navigation.test.ts` to expect exactly the new 5-tab layouts.
- Verified all 388 Vitest checks, production build compilation (`next build`), release checks (`npm run release:check`), live routes (`verify:live-routes`), and 20 Playwright E2E browser smoke tests (`e2e:public`) against the production site `https://myprodusen.online`.

## 2026-05-24 — Major Dashboard UX Restructure

- Personalized greeting headers showing time-of-day greetings, avatar initials/profile images, and unread notification bell triggers added to Employee, Leader, and Superadmin dashboards.
- Rewrote the Employee and Leader dashboards with a real-time GPS Geofence attendance tracker that calculates distance (meters/kilometers) and inside/outside geofence statuses on component mount.
- Placed premium Clock In and Clock Out buttons side-by-side inside the geofence attendance card, linking directly to the full-screen camera selfie Absensi flows.
- Built a mobile-responsive 8-item Quick Actions Grid (icons on top, labels below, 4 columns) across Employee, Leader, and Superadmin layouts, with irrelevant Talenta modules hidden.
- Created dashboard summary sections displaying Cuti balances, active Attendance statuses, monthly metrics, and leader team statistics.
- Superadmin dashboard completely restricted from rendering normal employee camera selfie check-in or check-out button elements.
- Superadmin control center updated with an Executive Summary Card, Quick Actions Grid, performance charts, and audit logs/approval queues.
- Ran all 388 Vitest units, `npm run lint`, `npm run build`, `npm run release:check`, `verify:live-routes` (live domain verified), `e2e:public` Playwright E2E smoke (20 passed), and `verify:cdn` successfully.



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

## 2026-05-31 — Gamification Scoring Terminology & UX UAT Polish

- **Score & Breakdown Recalibration**: Updated the final performance score breakdown across all dashboards to 30% Kehadiran (Attendance), 50% KPI Produksi, and 20% Penilaian Perilaku Kerja (Culture & Discipline).
- **Employee Gamification View**: Removed all old "Leader Score" labels. Configured the Score Card breakdown to map to Kehadiran (30%), KPI Produksi (50%), and Perilaku Kerja (20%) along with the detailed Indonesian subcriteria explanation (*kebersihan, disiplin, kerapian, kepatuhan SOP, kerja sama tim, tanggung jawab*). Rendered dynamic subcriteria rating cards whenever database snapshots are available.
- **Leader "Penilaian Perilaku Tim"**: Renamed triggers and forms to "Input Penilaian Perilaku Tim". Configured the score input form with optional sliders mapping the 6 subcriteria (automatically averaging into the main score), client-side anomaly alerts (score < 40 or delta > 30), and verified zero private salary projection leakage.
- **Superadmin Control Panels**: Added a dedicated "Penilaian Perilaku Kerja" review list, quick override actions (Set 80/90/100 presets), subcriteria sliders, and a final priority disclaimer note: *"Nilai Superadmin menjadi nilai final jika sudah diisi."*
- **Vitest Regression Suite**: Refactored the UI gamification source tests (`tests/ui/gamification-theme-ux-source.test.ts`) to assert the new 20% Perilaku Kerja breakdown, subcriteria sliders, anomaly alert conditions, and final score priorities. All 438 checks pass successfully.

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

## Attendance selfie mobile clocking UX
- Added reference-video inspired attendance card and dedicated Clock In / Clock Out selfie capture page.
- Added face guide overlay, GPS validation, optional note, manual correction copy, and source tests.
- Preserved strict backend RBAC and protected selfie handling.

## Attendance map-first flow correction
- Changed attendance clocking to map/location validation first, selfie second.
- Added fallback map-style UI with current location, office location, radius, distance, GPS accuracy, manual correction CTA, and GPS watcher cleanup.
