# Security

> Highest priority: protect employee data. RBAC is enforced server-side.
> Frontend hiding is UX, not security.

## Required production controls

- `JWT_SECRET` ≥ 32 random characters (production aborts otherwise — verified in `lib/auth.ts`).
- `.env` never committed. Coolify holds all secrets.
- Passwords hashed with bcrypt.
- Strict `getProductionJwtSecret()` is the single signing helper for sessions and password-reset tokens.
- HTTPS terminated by Coolify. Geolocation requires HTTPS by browser policy; do not work around it.

## Roles & access

| Role        | Access |
| ----------- | ------ |
| Superadmin  | Full access. Role management, audit log read, system settings. |
| Admin HR    | Employee / shift / location / leave / attendance / KPI operational data. Cannot create or promote Superadmin. |
| Supervisor  | Read + approve only for direct reports. KPI input for own team. |
| Employee    | Own data only. Submit attendance / leave / corrections. |

Inactive users cannot log in. Disabled accounts lose access on the next auth
revalidation.

## Attendance security

- GPS validation runs through `lib/attendance/gps-validation.ts`. Frontend
  decisions are ignored.
- Validates lat/lon presence and range, accuracy ≤ `GPS_MAX_ACCURACY_METERS`,
  optional `gpsTimestamp` freshness ≤ `GPS_TIMESTAMP_MAX_AGE_SECONDS`,
  work-location existence + active flag.
- Server computes Haversine distance vs `WorkLocation.radius`.
- `REJECT_OUTSIDE_GEOFENCE=true` (default) blocks outside-radius submissions.
  `false` enqueues them as `OUTSIDE_GEOFENCE` exceptions and notifies
  ADMIN_HR + SUPERADMIN.
- Admin approval flips `check_in_geo_status` to `APPROVED_MANUAL`. Rejection
  flips it to `REJECTED`. Both notify the affected employee.
- Manual attendance adjustment requires Admin HR or Superadmin and a reason
  ≥ 5 characters.

## Selfie file access

- Stored under the private persistent volume
  `/app/uploads/attendance-selfies/...`.
- Never exposed as a public static folder.
- Served only through authenticated routes:
  - `GET /api/attendances/:id/selfie/check-in`
  - `GET /api/attendances/:id/selfie/check-out`
  - Legacy: `GET /api/attendance/selfie/[...path]` (still backward-compatible).
- RBAC: Employee → own only; Supervisor → team only; ADMIN_HR /
  SUPERADMIN → all.
- Path traversal blocked: attendance ID validated by `^[A-Za-z0-9_-]+$`,
  storage path resolver re-checks containment under `UPLOAD_DIR`.
- Stored selfie path strings are sanitised; backslashes, leading slashes,
  `..` segments are rejected outright.
- Cache headers: `Cache-Control: private, max-age=300, must-revalidate` plus
  `X-Content-Type-Options: nosniff`.

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
- Pending geo-fence attendance (notifies ADMIN_HR + SUPERADMIN).
- Geo approve / reject (notifies the employee).

## Hardening checklist

- [ ] `npm run lint` and `npm run test` clean before merge.
- [ ] Login rate limit verified end-to-end (5 attempts / 15 minutes per IP+username).
- [ ] CSRF tokens on state-changing routes verified during pen-test.
- [ ] No PII or secret in logs; `lib/logger` redacts known keys.
- [ ] Periodic restore drill on staging (quarterly).
