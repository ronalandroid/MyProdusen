# Security

> **AI agent role source of truth:** MyProdusen production uses exactly two roles: `SUPERADMIN` and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` are historical database values only and must not be exposed in production UI or route access.


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

| Role        | Access |
| ----------- | ------ |
| Superadmin  | Full access. Role management, audit log read, system settings. |
| Employee    | Own data only. Submit attendance / leave / corrections. |

Inactive users cannot log in. Disabled accounts lose access on the next auth
revalidation.

System `role` controls access only. Operational labels such as HR, Admin,
Leader, Expedition, Driver, or Staff belong in employee `division` and
`position`, not in the RBAC role list. Superadmin may assign any role when
creating a new employee account. Superadmin manages all production accounts
only; attempts to create or promote Superadmin are blocked server-side.

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
- RBAC: Employee → own only; Superadmin → all. `ADMIN_HR` and `SUPERVISOR` historical values receive no production access.
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
- Payroll endpoints must enforce employee-own access and Superadmin full access server-side. `ADMIN_HR` and `SUPERVISOR` must be denied.
- PDF report page and API remain Superadmin-only; non-Superadmin access must be tested after deploy.
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
(`Employee`, `Superadmin`). Employee placement details
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
