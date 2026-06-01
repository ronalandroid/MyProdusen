# Security

> **AI agent role source of truth:** MyProdusen production uses exactly three roles: `SUPERADMIN`, `LEADER`, and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` are historical database values only and must not be exposed in production UI or route access.


> Highest priority: protect employee data. RBAC is enforced server-side.
> Frontend hiding is UX, not security.

## Required production controls

- `JWT_SECRET` ≥ 32 random characters (production aborts otherwise — verified in `lib/auth.ts`).
- `.env` never committed. Coolify holds all secrets.
- Passwords hashed with bcrypt.
- Strict `getProductionJwtSecret()` is the single signing helper for sessions and password-reset tokens.
- HTTPS terminated by Coolify. Geolocation requires HTTPS by browser policy; do not work around it.
- Cookie-authenticated mutating API requests are protected by an Origin/Referer
  guard in `lib/core/route-handler.ts`; bearer-token API clients remain usable
  for trusted server-to-server calls.

## Roles & access

| Role | Access |
| --- | --- |
| `SUPERADMIN` | Full access. Role management, audit log read, system settings, reports, payroll, approvals, employee/team/location/shift management. |
| `LEADER` | Employee self-service plus assigned-team KPI/team scope only. No team payroll access, no global reports, no Superadmin APIs. |
| `EMPLOYEE` | Own data only. Submit attendance / leave / corrections, view own KPI/payroll/notifications/profile. |

Inactive users cannot log in. Disabled accounts lose access on the next auth
revalidation.

System `role` controls access only. Operational labels such as HR, Expedition, Driver, or Staff belong in employee `division`, `team`, and `position`, not in new RBAC roles. `LEADER` is the only production team-lead access role. Public registration always creates inactive `EMPLOYEE`; only existing authorized Superadmin flows may assign `LEADER` or `SUPERADMIN`, with last-Superadmin safety checks.

## Auth email delivery

Authentication email uses Resend through `lib/email.ts`.

- Required production env: `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- Registration and public registration send the `register` template.
- Forgot password sends a 30-minute reset link using the `forgot-password`
  template.
- Successful password reset sends the `reset-password` confirmation template.
- Role changes and account activation send `role-changed` and
  `account-approved` templates where applicable.
- If Resend env is missing outside production, email is logged as skipped for
  developer convenience. Production must configure Resend in Coolify.

## Attendance security

- GPS validation runs through `lib/attendance/gps-validation.ts`. Frontend
  decisions are ignored.
- Validates lat/lon presence and range, accuracy ≤ `GPS_MAX_ACCURACY_METERS`,
  optional `gpsTimestamp` freshness ≤ `GPS_TIMESTAMP_MAX_AGE_SECONDS`,
  work-location existence + active flag.
- Server computes Haversine distance vs `WorkLocation.radius`.
- `REJECT_OUTSIDE_GEOFENCE=true` (default) blocks outside-radius submissions.
  `false` enqueues them as `OUTSIDE_GEOFENCE` exceptions and notifies
  SUPERADMIN.
- Admin approval flips `check_in_geo_status` to `APPROVED_MANUAL`. Rejection
  flips it to `REJECTED`. Both notify the affected employee.
- Manual attendance adjustment requires Superadmin and a reason
  ≥ 5 characters.

## Selfie file access

- Stored under the private persistent volume
  `/app/uploads/attendance-selfies/...`.
- Never exposed as a public static folder.
- Served only through authenticated routes:
  - `GET /api/attendances/:id/selfie/check-in`
  - `GET /api/attendances/:id/selfie/check-out`
  - Legacy: `GET /api/attendance/selfie/[...path]` (still backward-compatible).
- RBAC: Employee → own only; Leader → own plus assigned team KPI scope; Superadmin → all. `ADMIN_HR` and `SUPERVISOR` historical values receive no production access.
- Path traversal blocked: attendance ID validated by `^[A-Za-z0-9_-]+$`,
  storage path resolver re-checks containment under `UPLOAD_DIR`.
- Stored selfie path strings are sanitised; backslashes, leading slashes,
  `..` segments are rejected outright.
- Cache headers: `Cache-Control: no-store, private` plus
  `X-Content-Type-Options: nosniff`.

## PDF report security

- `/dashboard/reports/pdf` and `POST /api/reports/pdf` are Superadmin-only.
- PDF responses use `Cache-Control: no-store, no-cache, must-revalidate, private`.
- Report type, date range, and row caps are validated with `PDF_REPORT_MAX_ROWS` and `PDF_REPORT_MAX_DATE_RANGE_MONTHS`.
- Selfie path, URL, and binary fields are stripped from PDF data.
- Every PDF download writes a `DOWNLOAD_PDF` audit log.

## Audit log

Every sensitive action writes to `AuditLog` with `actorUserId`, action,
entity, entityId, serialised payload, IP, and user-agent. Current actions:

- `LOGIN`, `LOGOUT`, `LOGIN_FAILED` (where feasible).
- `CHECK_IN`, `CHECK_OUT`, `CHECK_IN_FAILED`, `CHECK_OUT_FAILED`,
  `CHECK_IN_REJECTED_SELFIE`, `CHECK_OUT_REJECTED_SELFIE`.
- `CHECK_IN_GPS_VALID`, `CHECK_IN_GPS_PENDING_REVIEW`,
  `CHECK_IN_GPS_REJECTED`, plus the matching check-out variants.
- `SELFIE_VIEW` (only for non-owner views), `INVALID_SELFIE_ACCESS`.
- `EXPORT` (attendance, leave, KPI, employee reports).
- `APPROVE` / `REJECT` for leave, KPI, attendance exceptions.
- `CREATE` / `UPDATE` / `DELETE` for employees, locations, shifts, KPI
  templates, attendance adjustments.
- `ROLE_CHANGE`, `USER_ACTIVATE`, `USER_DEACTIVATE`.

Audit logs are read-only for non-superadmins. Retention follows the policy
documented in `DEPLOYMENT.md`.

## Notifications

Persisted in the `Notification` table with a best-effort realtime publish on
the `myprodusen:realtime` channel. Notification failures never block the
originating mutation.

Triggered by:

- Leave approval / rejection.
- KPI approval.
- Pending geo-fence attendance (notifies SUPERADMIN).
- Geo approve / reject (notifies the employee).


## Production security verification

- Upload volume `/app/uploads` must remain private and must not be mapped as public static storage.
- Attendance selfies are served only through protected API endpoints with ownership/RBAC checks.
- Payroll endpoints must enforce employee/leader-own access and Superadmin full access server-side. `ADMIN_HR` and `SUPERVISOR` must be denied.
- PDF report page and API remain Superadmin-only; non-Superadmin access must be tested after deploy.

## Gamification/theme release gates

- Gamification must stay disabled by default and must not expose private HR data, payroll, attendance, leave, KPI, employee identifiers, document names, upload paths, selfie paths, or rank/score data that can identify another employee without RBAC approval.
- Theme experiments must stay disabled by default and must not weaken auth, RBAC, CSRF, private cache, upload, or protected route controls.
- `scripts/check-release-gates.mjs` blocks enabled gamification flags unless `GAMIFICATION_RELEASE_APPROVED=true` is present.
- `scripts/check-release-gates.mjs` blocks theme experiment flags unless `THEME_RELEASE_APPROVED=true` is present.
- Release approval env keys are approval markers only; they do not replace server-side authorization tests.
- Secrets live only in Coolify/password manager: never commit `.env`, database dumps, upload archives, Resend keys, JWT secrets, or payroll exports.
- Protected API responses for selfies, PDF reports, payroll exports, and health checks must use private/no-store cache where sensitive.
- Production smoke test must verify unauthorized employee-to-employee, legacy-role, and public upload access denial.

## Hardening checklist

- [ ] `npm run lint` and `npm run test` clean before merge.
- [ ] Login rate limit verified end-to-end (5 attempts / 15 minutes per IP+username).
- [ ] `TESTSPRITE_DISABLE_RATE_LIMITS`, `E2E_DISABLE_RATE_LIMITS`, `TESTSPRITE_DISABLE_CSRF_ORIGIN`, and `E2E_DISABLE_CSRF_ORIGIN` are unset or `false` in production/Coolify.
- [x] Cookie-authenticated state-changing routes have Origin/Referer CSRF guard.
- [x] Test-support routes (`/api/test-support/*`) and activation-token helpers return 404 in production regardless of `TESTSPRITE_COMPAT_RESPONSE`; compat mode is non-production only.
- [x] GPS accuracy validation uses `GPS_MAX_ACCURACY_METERS` env (default 100m) instead of hardcoded value.
- [ ] No PII or secret in logs; `lib/logger` redacts known keys.
- [ ] Periodic restore drill on staging (quarterly).

## Account self-activation

Public registration creates an inactive employee-role user and emails a 24-hour
activation link through Resend. The link opens `/activate-account?token=...`,
which posts the token to `/api/auth/activate`; the backend verifies JWT purpose
`account-activation` before flipping `User.isActive` to `true`.

Superadmin can review registered users at `/dashboard/users`, see active vs
pending accounts, manually activate/deactivate accounts, and assign access role
(`Employee`, `Leader`, `Superadmin`). Employee placement details
such as division, position, supervisor, shift, and location remain managed in the
employee module.

## PWA + Attendance Security Update — 2026-05-19

- PWA service worker must not cache private payroll, attendance, selfie, audit, or report data.
- PWA install prompt must rely on browser `beforeinstallprompt`; web apps cannot silently install themselves.
- Logout action must call `/api/auth/logout` and clear the httpOnly session cookie before redirecting to `/login`.
- Attendance frontend may show GPS proof, but backend remains the source of truth for GPS accuracy, timestamp age, Haversine distance, geofence decision, selfie validation, and audit logging.

## Safe Build Metadata Endpoint

- `/api/version` is public but must only expose safe operational metadata: app name, status, node env, app version, git commit SHA, and build time.
- Never expose secrets, database URLs, email provider keys, passwords, upload paths, selfie paths, or private file names from health/version endpoints.
- Use `/api/health` for health status and `/api/version` for deploy traceability after Coolify redeploy.

## Attendance Sync Security — 2026-05-21

Attendance Wave 2 keeps backend authority for attendance decisions:

- Frontend GPS/selfie status is UX only. Backend validates active employee, default location, active location, default shift, active shift, GPS accuracy, timestamp freshness, Haversine distance, selfie file type/size/signature, and duplicate daily check-in/out.
- Protected selfie endpoints remain authenticated and use ownership/RBAC checks. Employee can access only own selfie, Superadmin can access protected operational selfies.
- Selfie responses use `Cache-Control: no-store, private` and `X-Content-Type-Options: nosniff`.
- Non-owner selfie views and invalid selfie path attempts are audit logged.
- Attendance exception review requires backend endpoint processing and audit logging; rejected review needs a note in UI.

## Leave + KPI Sync Security — 2026-05-21

- Leave approval/rejection remains backend-authorized. Rejection requires a human-readable reason and audit log.
- Leave overlap and balance holds are checked server-side; frontend only shows status and guidance.
- KPI result update now rejects edits once a result is approved. Approved KPI changes require a future explicit authorized override flow with reason and audit log.
- KPI template and assignment actions remain Superadmin-only.

## Payroll + Reports Sync Security — 2026-05-21

- Employee payroll reads remain limited to `/api/payroll/me` and the employee attached to the authenticated session.
- Payslip download checks ownership for Employee and privileged access for Superadmin.
- Payslip and payroll export responses now send `Cache-Control: no-store, no-cache, must-revalidate, private` and `X-Content-Type-Options: nosniff`.
- Payroll CSV export and payslip download are audit logged.
- PDF reports remain Superadmin-only, private/no-store, and do not export private selfie files.

## Notifications + Audit Sync Security — 2026-05-21

- Notification list, read, mark-all-read, and delete actions are scoped to the authenticated user ID.
- Realtime events are filtered by target user/scope before delivery.
- Notification list responses now use `Cache-Control: no-store, private`.
- Audit log API remains Superadmin-only and now returns `Cache-Control: no-store, private`.
- Audit UI uses no-store fetch and server-side pagination/search.

## Email Delivery Security — 2026-05-21

- Resend remains the only transactional email provider.
- Production email requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; missing config fails loudly.
- Email delivery attempts are logged in `EmailLog` with template, recipient, subject, status, provider message id, sanitized error, and non-secret metadata.
- Tokens, API keys, raw passwords, cookies, and private URLs must not be stored in email metadata.
- Provider API errors are logged server-side only and returned to users through existing safe Indonesian API errors.

## Production Blocker Hardening — 2026-05-21

- User creation UI no longer ships a default password value; Superadmin must enter a unique initial password.
- Employee API compatibility payload normalization no longer falls back to `Password123!`; missing password fails validation.
- `/api/sync/queue` no longer returns synthetic success records for attendance or leave. Offline queue operations fail closed until a real service-backed implementation exists.
- Production env check now fails if TestSprite/E2E compatibility bypass flags are enabled, including `TESTSPRITE_COMPAT_RESPONSE`.

## Final platform hardening — 2026-05-22

- All shared `successResponse` / `errorResponse` API helpers now attach `Cache-Control: no-store, private` by default for protected JSON payloads.
- Global API middleware rejects cross-site cookie-authenticated mutating requests before route handlers run; bearer-token API clients remain supported.
- Forgot-password and reset-password endpoints use the `PASSWORD_RESET` rate-limit preset.
- Employee document multipart uploads are stored under private `UPLOAD_DIR/employee-documents` and served through authenticated `/api/documents/file/:employeeId/:storedName` endpoints with RBAC checks, `no-store`, and `nosniff`.

## Cloudflare Cache And Proxy Security — 2026-05-22

- Protected paths must return `Cache-Control: no-store, private`: `/api/*`, `/dashboard/*`, `/uploads/*`, payroll, PDF reports, document files, attendance, and selfie endpoints.
- Private responses must never return Cloudflare `cf-cache-status: HIT`.
- Public static assets may use `public, max-age=31536000, immutable` when they are logo/static/image/font assets.
- Service worker must not register a fetch handler and must not cache `/api/*`, `/dashboard/*`, `/uploads/*`, selfie, document, payroll, or PDF responses.
- Client IP extraction prefers `CF-Connecting-IP` only when Cloudflare trace headers are present, otherwise falls back to the first `X-Forwarded-For` value and then `X-Real-IP`.
- Rate limiting and audit logging use the shared `getClientIp()` helper, so Cloudflare proxy traffic still maps to the real client IP when Cloudflare headers are present.
- Keep Bot Fight Mode off until login, activation, attendance selfie upload, and PDF export have been tested behind Cloudflare.

## Attendance Geofence Security — 2026-05-22

- Official geofence source is `WorkLocation` in PostgreSQL, not frontend state.
- Official coordinate: `3.6009125, 98.6964954`, radius `100m`, name `Produsen Dimsum Medan | TBM GRUP`.
- Backend loads employee assigned `defaultLocationId` and rejects spoofed `workLocationId` values.
- Backend Haversine validation uses `GPS_MAX_ACCURACY_METERS`, `GPS_TIMESTAMP_MAX_AGE_SECONDS`, and `REJECT_OUTSIDE_GEOFENCE`.
- Employee with no assigned location cannot check in/out and sees `Lokasi kerja belum tersedia. Hubungi Superadmin.`
- Selfie remains required through realtime FormData and private upload storage.
- Attendance audit metadata must include employee ID, work location ID, latitude, longitude, accuracy, distance meters, radius meters, and decision where available.


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

## Production UAT Leader RBAC Gate — 2026-05-24

- Added credential-only Leader and Employee staging E2E scripts; no passwords or default insecure credentials are stored in code.
- Leader E2E verifies `LEADER` access to own team APIs and denial from Superadmin-only APIs (`/api/users`, `/api/teams`).
- Employee E2E verifies denial from Leader APIs (`/api/leader/me`, `/api/leader/team-employees`), Superadmin APIs, and KPI mutation endpoint.
- Public live verification passed for unauthenticated dashboard redirect, `/api/reports/pdf` `401`, and secret-safe `/api/health` and `/api/version` responses.
- Authenticated RBAC verification is pending until real staging `E2E_*` credentials and first Leader/team/member assignment exist.
- Protected selfie ownership/RBAC and unauthorized selfie checks remain pending for real-device GPS+selfie UAT.

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

## Final Role Assignment Security Update — 2026-05-24

- Public registration now allows only username, email, and password; role/work identity escalation fields are ignored server-side.
- Public registration always creates inactive `EMPLOYEE` per existing activation policy.
- Superadmin-only user update API enforces role management server-side, not frontend-only.
- Self-demotion/self-deactivation and last active Superadmin downgrade/deactivation are blocked.
- Leader promotion requires employee profile, active work identity, location, shift, and team assignment.
- Leader assignment removal happens when role is changed back to `EMPLOYEE`; employee history remains preserved.
- Team KPI input remains restricted to assigned team members only.

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

## UAT Security Updates — 2026-05-24

- Normal attendance check-in/check-out is restricted to `EMPLOYEE` and `LEADER`; `SUPERADMIN` receives `403` outside explicit admin correction/report flows.
- Profile avatar access uses `/api/profile/avatar/...` and is limited to owner user or `SUPERADMIN`.
- Profile avatar responses use `Cache-Control: no-store, private` and `X-Content-Type-Options: nosniff`.
- Profile completion API still rejects self-assignment of role/team/division/position/location/shift/payroll/permissions.
- Avatar upload validates image MIME/signature and stores only the protected route path in employee profile data.

## Production Sync Security Gate — 2026-05-24

- Public PDF endpoint check: unauthenticated `POST /api/reports/pdf` returns protected response (`401`), not public `200`.
- CDN verification confirms private dashboard/API/PDF/payroll/attendance routes are not publicly cached.
- Role model remains `SUPERADMIN`, `LEADER`, `EMPLOYEE` only for production UI/access.
- Superadmin normal selfie attendance remains blocked; Leader/Employee attendance remains self-service only.
- Protected avatar/selfie routes remain no-store/private and require ownership or Superadmin authorization.

## Feature Flag and Module Exposure Policy — 2026-05-24

Feature flags may hide navigation and entry points, but backend RBAC remains mandatory for every route. Disabled optional modules must not expose private data through main navigation. Core private APIs for attendance, profile/avatar, selfie, payroll, PDF reports, leave, KPI, notifications, and dashboard data must remain authenticated, role-scoped, and `no-store`/private where applicable.



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
