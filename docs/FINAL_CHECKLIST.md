# Final Checklist

Run through this before declaring a release ready. Every box is a real
verification step, not a wish.

## 1. Required environment variables

- [ ] `DATABASE_URL` set in Coolify.
- [ ] `JWT_SECRET` and `NEXTAUTH_SECRET` set with at least 32 random chars (production aborts otherwise).
- [ ] `NEXT_PUBLIC_APP_URL` and `APP_URL` point to the production domain.
- [ ] `SUPERADMIN_EMAIL` / `SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD` set for first-deploy bootstrap (rotate after).
- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL` configured.
- [ ] `STORAGE_DRIVER=local`, `UPLOAD_DIR=/app/uploads`, `ATTENDANCE_SELFIE_DIR=attendance-selfies`, `MAX_UPLOAD_SIZE=5242880`, `MAX_SELFIE_SIZE_MB=1`.
- [ ] `NEXT_PUBLIC_SELFIE_*` (max width / height / quality / target KB) set.
- [ ] `GPS_MAX_ACCURACY_METERS=100`, `DEFAULT_GEOFENCE_RADIUS_METERS=100`, `REJECT_OUTSIDE_GEOFENCE=true`, `GPS_TIMESTAMP_MAX_AGE_SECONDS=120`.
- [ ] `ATTENDANCE_EXPORT_MAX_ROWS=5000`, `PDF_REPORT_MAX_ROWS=1000`, and `PDF_REPORT_MAX_DATE_RANGE_MONTHS=12`.
- [ ] `REDIS_URL` configured if cache is desired (optional; app runs without it).

## 2. Build & verification

- [ ] `npm run release:check` exits 0. This is the local code-readiness gate
      — it runs `lint`, the full `test` suite, the production `build`, the
      migration-coverage check, and the design-reference contract check.
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

- [x] `UI_UX_GUIDE.md` remains aligned with `prd.md` and this checklist.
- [x] Mobile-first employee flow uses rounded cards, readable spacing, clear status chips, and bottom navigation.
- [x] Onboarding, login, dashboard, attendance, employees, leave, KPI, profile, and reports screens follow the approved yellow HRIS style.
- [x] Yellow `#FFC107` remains primary accent; red `#E53935` appears only for danger, reject, late, or critical states.
- [x] Loading, empty, error, and success states are present for forms, tables, dashboards, attendance, and reports.
- [x] UI hides unauthorized actions, while backend RBAC still enforces every protected action.
- [x] Profile settings pages are non-empty and reachable: personal info, password, notifications, and about app.
- [x] Form labels are programmatically bound to inputs and include clear helper/error text where needed.
- [x] Guaranteed no horizontal scrolling bug (`overflow-x-hidden`) and smooth touch interactions (`-webkit-overflow-scrolling`) on iOS/Safari.

## 5. RBAC end-to-end

- [ ] Employee can only view own attendance, own selfies, own exceptions.
- [ ] Supervisor can only view direct reports.
- [ ] Admin HR can view all employees, all selfies, export reports, approve leave / KPI.
- [ ] Superadmin has full access plus role management.
- [ ] Superadmin new-user form separates system role from division/position placement.
- [ ] New-user role assignment is enforced server-side with `canManageRole`.
- [ ] User activation / role updates send account-approved or role-changed email only on relevant transitions.
- [ ] Inactive users cannot log in.
- [ ] Cross-employee `/api/attendances/:id/selfie/...` returns 403.

## 6. Reporting & export

- [ ] `/dashboard/reports/attendance` renders summary cards, paginated table, and preset chips (today / this week / this month).
- [ ] CSV export requires `from` + `to` (422 otherwise).
- [ ] Export rows capped at `ATTENDANCE_EXPORT_MAX_ROWS`.
- [ ] CSV contains only YES/NO selfie flags — no path, URL, or binary.
- [ ] Export writes an `EXPORT / AttendanceReport` audit row with filters, scope, row count, and `truncated` flag.
- [ ] `/dashboard/reports/pdf` is reachable only by Superadmin and redirects other roles away.
- [ ] `POST /api/reports/pdf` enforces Superadmin server-side, uses `Cache-Control: no-store`, validates report type/date range, caps rows with `PDF_REPORT_MAX_ROWS`, strips selfie fields, and writes `DOWNLOAD_PDF` audit rows.
- [ ] PDF output includes MyProdusen header, TBM Group footer, period/filter info, summary cards, tables, charts, generated by/at, page number, and confidential note.

## 6.1 Payroll security

- [ ] Employee payroll page only uses `/api/payroll/me` and returns own payroll rows.
- [ ] Supervisor cannot access payroll routes or dashboard pages by default.
- [ ] Admin HR payroll access follows `PAYROLL_*` permission policy and cannot approve/pay final payroll.
- [ ] Superadmin can approve, mark paid, export CSV, and download payslips.
- [ ] Payroll export and payslip download create audit log rows.
- [ ] Approved/paid payroll data cannot be edited directly.

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

## 10. Design reference contract

- [ ] Every screen affected by this release is checked against
      `docs/references/design-checklist.md`.
- [ ] No invented layout, copy, or interaction that is not present in
      `docs/references/screens/*.png`.
- [ ] Brand tokens (`--primary`, `--accent-red`, `--text-primary`,
      `--bg-main`, `--success`, `--warning`) used; no hard-coded hex.
- [ ] Every commit that touched UI cites the matching checklist line.
- [ ] Email templates follow `docs/references/email-style-guide.md`.
- [ ] If the operator approved a new design board, the file in
      `docs/references/screens/` was replaced in place AND
      `design-checklist.md` was updated in the same PR.

## Staging smoke test

- [ ] Landing page opens over HTTPS.
- [ ] Register works and sends activation email.
- [ ] Activation link opens HTTPS `APP_URL` and activates account.
- [ ] Login works; inactive user is blocked.
- [ ] Superadmin sees `/dashboard/users`.
- [ ] Employee is created with generated NIP.
- [ ] Work location and shift are created.
- [ ] Employee is assigned shift and work location.
- [ ] Employee check-in works with GPS + realtime selfie.
- [ ] Employee check-out works with GPS + realtime selfie.
- [ ] Protected selfie view works for authorized role.
- [ ] Unauthorized selfie access is blocked.
- [ ] Leave request works; approval and rejection work.
- [ ] KPI workflow works end-to-end.
- [ ] Payroll employee view and Superadmin summary work.
- [ ] PDF report download works for Superadmin only; non-Superadmin is blocked.
- [ ] CSV export works and writes audit log.
- [ ] Sensitive audit logs are created.
- [ ] Notifications appear for workflow events.
- [ ] `/api/health` returns healthy without secrets.

## Production final release gate

- [ ] Production env complete in Coolify, including `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `APP_URL`, `NEXT_PUBLIC_APP_URL`, upload vars, Resend vars, payroll vars, and report caps.
- [ ] `npm run release:check` passed before deploy.
- [ ] Coolify deploy healthy and container uses production start, not dev server.
- [ ] `/api/health` healthy and does not expose secrets.
- [ ] PostgreSQL database connected.
- [ ] `/app/uploads` persistent volume mounted and private.
- [ ] Database backup tested with `pg_restore --list`.
- [ ] Upload backup tested with `tar -tzf`.
- [ ] Restore drill tested on staging/test using latest DB dump and uploads archive.
- [ ] Resend activation and forgot-password email tested over HTTPS `APP_URL`.
- [ ] GPS + realtime selfie tested on real Android phone.
- [ ] Protected selfie access tested for authorized and unauthorized users.
- [ ] Superadmin PDF report tested; non-Superadmin blocked.
- [ ] Payroll employee view, Superadmin summary, mutation RBAC, export, and audit tested.
- [ ] Audit log tested for auth, user role, attendance, leave, KPI, payroll, report, and selfie events.
- [ ] Unauthorized access tested for employee, supervisor, Admin HR, and public requests.
- [ ] Rollback plan ready with backup ID, operator, and restore window.
- [ ] Production smoke test recorded in `docs/PRODUCTION_SMOKE_TEST.md` result table format.

## Go-live and SOP documents

- [ ] Go-live checklist reviewed: [`GO_LIVE_CHECKLIST.md`](./GO_LIVE_CHECKLIST.md).
- [ ] Superadmin SOP shared: [`SOP_SUPERADMIN.md`](./SOP_SUPERADMIN.md).
- [ ] Admin HR SOP shared: [`SOP_ADMIN_HR.md`](./SOP_ADMIN_HR.md).
- [ ] Supervisor SOP shared: [`SOP_SUPERVISOR.md`](./SOP_SUPERVISOR.md).
- [ ] Employee SOP shared: [`SOP_EMPLOYEE.md`](./SOP_EMPLOYEE.md).
- [ ] Troubleshooting guide shared with HR/admin PIC: [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md).
- [ ] Rollback plan reviewed by Owner, HR, and technical PIC: [`ROLLBACK_PLAN.md`](./ROLLBACK_PLAN.md).
- [ ] Operations runbook assigned to daily/weekly/monthly PIC: [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md).

## Staging UAT package

- [ ] Staging deploy steps reviewed: [`STAGING_DEPLOY_STEPS.md`](./STAGING_DEPLOY_STEPS.md).
- [ ] Staging UAT result filled: [`STAGING_UAT_RESULT.md`](./STAGING_UAT_RESULT.md).
- [ ] Staging go/no-go decision recorded: [`STAGING_GO_NO_GO.md`](./STAGING_GO_NO_GO.md).

## Live Deployment Route Verification

- [ ] Latest code committed and pushed to Coolify branch.
- [ ] Coolify redeployed with rebuild image/no cache.
- [ ] `/api/health` returns `200` and `status: ok`.
- [ ] `/api/health` app metadata shows expected `APP_VERSION` / `GIT_COMMIT_SHA` / `BUILD_TIME`.
- [ ] `BASE_URL=https://myprodusen.online npm run verify:live-routes` passes.
- [ ] `POST /api/reports/pdf` unauthenticated returns `401` or `403`, never `404`.
- [ ] `E2E_BASE_URL=https://myprodusen.online npm run e2e:public` passes.
- [ ] Superadmin staging login test runs only once on desktop to avoid rate limit.
- [ ] If login rate limit appears, wait 15 minutes and rerun only required live smoke.
