# Final Checklist

Run through this before declaring a release ready. Every box is a real
verification step, not a wish.

## 1. Required environment variables

- [ ] `DATABASE_URL` set in Coolify.
- [ ] `JWT_SECRET` set with at least 32 random chars (production aborts otherwise).
- [ ] `NEXT_PUBLIC_APP_URL` and `APP_URL` point to the production domain.
- [ ] `SUPERADMIN_EMAIL` / `SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD` set for first-deploy bootstrap (rotate after).
- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL` configured.
- [ ] `STORAGE_DRIVER=local`, `UPLOAD_DIR=/app/uploads`, `ATTENDANCE_SELFIE_DIR=attendance-selfies`, `MAX_SELFIE_SIZE_MB=1`.
- [ ] `NEXT_PUBLIC_SELFIE_*` (max width / height / quality / target KB) set.
- [ ] `GPS_MAX_ACCURACY_METERS=100`, `DEFAULT_GEOFENCE_RADIUS_METERS=100`, `REJECT_OUTSIDE_GEOFENCE=true`, `GPS_TIMESTAMP_MAX_AGE_SECONDS=120`.
- [ ] `ATTENDANCE_EXPORT_MAX_ROWS=5000`.
- [ ] `REDIS_URL` configured if cache is desired (optional; app runs without it).

## 2. Build & verification

- [ ] `npm run release:check` exits 0. This is the local code-readiness gate
      — it runs `lint`, the full `test` suite, the production `build`, and
      the migration-coverage check (`scripts/check-migrations-coverage.mjs`).
- [ ] `npm run release:check:full` exits 0 on the deploy target. Same as
      above plus the env preflight (`scripts/check-production-env.mjs`),
      so it only passes when production env vars are wired in.
- [ ] `npm run db:deploy` ran successfully in production order (no skipped migrations after `0011`).
- [ ] `npm run bootstrap:superadmin` ran once after migrations.
- [ ] `npm run perf:explain` (against staging) shows index usage on
      `Attendance_employeeId_checkInTime_idx`,
      `Attendance_status_checkInTime_idx`, `Employee_division_idx`,
      and the geo-status indexes from `0011`.

## 3. Coolify

- [ ] Build command `npm run build`. Start command `npm run start`.
- [ ] Persistent volume mounted at `/app/uploads`.
- [ ] Healthcheck `/api/health` returns 200.
- [ ] Daily PostgreSQL `pg_dump` schedule active.
- [ ] Daily `/app/uploads` rsync schedule active.
- [ ] Weekly retention sweep (`find /backups -mtime +30 -delete`) active.

## 4. Selfie / GPS hardening

- [ ] `/dashboard/attendance` uses the realtime camera (no file picker, no gallery).
- [ ] Attendance selfie capture uses live camera preview + canvas capture + `FormData` blob only.
- [ ] Attendance UI contains no upload button, gallery picker, `<input type="file">`, or `accept="image/*"` fallback.
- [ ] Backend rejects missing selfie, invalid MIME, oversized selfie.
- [ ] Selfie filenames are server-generated and stored under
      `attendance-selfies/<year>/<month>/<employeeId>/...`.
- [ ] `/api/attendances/:id/selfie/check-in` and `.../check-out` enforce RBAC
      (employee-self, supervisor-team, admin-all) and audit-log non-owner
      views.
- [ ] Path traversal returns 404 with `INVALID_SELFIE_ACCESS` audit row.
- [ ] GPS validator rejects missing / out-of-range lat-lon, oversized
      accuracy, stale timestamp, and inactive locations.
- [ ] Outside-radius behaviour matches `REJECT_OUTSIDE_GEOFENCE`. Pending
      entries appear at `/dashboard/attendance/exceptions`.

## 4.1 UI/UX upgrade

- [ ] `UI_UX_GUIDE.md` remains aligned with `prd.md` and this checklist.
- [ ] Mobile-first employee flow uses rounded cards, readable spacing, clear status chips, and bottom navigation.
- [ ] Onboarding, login, dashboard, attendance, employees, leave, KPI, profile, and reports screens follow the approved yellow HRIS style.
- [ ] Yellow `#FDC704` remains primary accent; red `#B51B19` appears only for danger, reject, late, or critical states.
- [ ] Loading, empty, error, and success states are present for forms, tables, dashboards, attendance, and reports.
- [ ] UI hides unauthorized actions, while backend RBAC still enforces every protected action.

## 5. RBAC end-to-end

- [ ] Employee can only view own attendance, own selfies, own exceptions.
- [ ] Supervisor can only view direct reports.
- [ ] Admin HR can view all employees, all selfies, export reports, approve leave / KPI.
- [ ] Superadmin has full access plus role management.
- [ ] Inactive users cannot log in.
- [ ] Cross-employee `/api/attendances/:id/selfie/...` returns 403.

## 6. Reporting & export

- [ ] `/dashboard/reports/attendance` renders summary cards, paginated table, and preset chips (today / this week / this month).
- [ ] CSV export requires `from` + `to` (422 otherwise).
- [ ] Export rows capped at `ATTENDANCE_EXPORT_MAX_ROWS`.
- [ ] CSV contains only YES/NO selfie flags — no path, URL, or binary.
- [ ] Export writes an `EXPORT / AttendanceReport` audit row with filters, scope, row count, and `truncated` flag.

## 7. Notifications

- [ ] Leave approval / rejection notifies the employee.
- [ ] KPI approval notifies the employee.
- [ ] Pending geo attendance notifies SUPERADMIN + ADMIN_HR.
- [ ] Geo approve / reject notifies the employee.
- [ ] Notification failures never block the original mutation.

## 8. End-to-end smoke test (the 13-step scenario)

Run this manually before declaring a release ready.

1. Login as Superadmin, create an employee with auto-NIP.
2. Assign work location and shift to the employee.
3. Login as the employee, perform realtime selfie + GPS check-in.
4. Perform realtime selfie + GPS check-out.
5. Login as Admin HR, view the selfies via the protected endpoint.
6. If any pending geo exception was created, approve it from
   `/dashboard/attendance/exceptions` and confirm the employee receives a
   notification and `check_in_geo_status` flips to `APPROVED_MANUAL`.
7. Submit a leave request as the employee.
8. Approve the leave as Supervisor or Admin HR — confirm employee notification.
9. Input + approve KPI as Supervisor / Admin HR — confirm employee notification.
10. Open Superadmin dashboard, verify counts.
11. Export attendance CSV from `/dashboard/reports/attendance` — confirm audit row.
12. Inspect `AuditLog` for `CHECK_IN`, `CHECK_OUT`, `EXPORT`, `SELFIE_VIEW`,
    `APPROVE`, `REJECT`, `CHECK_IN_GPS_*`.
13. Attempt cross-employee selfie access — confirm 403 + `SELFIE_VIEW` audit
    rows only when the viewer is allowed.

## 9. Reference repo guardrail

- [ ] No code copied from `ikhsan3adi/absensi-karyawan-gps-barcode` or
      `josephines1/o-present` (research-only per `REFERENCE_REPO_ANALYSIS.md`).
- [ ] No public uploads folder, no base64 selfies, no default password
      `123456`, no Tabler / Bootstrap UI kit added.
