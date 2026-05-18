# Production Smoke Test — MyProdusen

Run this checklist after every production deploy and after every restore drill. Use real HTTPS production URL, real Android phone for attendance, and test accounts with non-sensitive sample data. Do not paste secrets, dumps, or selfie paths into tickets or chat.

## Preconditions

- `npm run release:check` passed before deploy.
- Coolify deployment status is healthy.
- Production env vars are complete in Coolify.
- PostgreSQL service is connected.
- Persistent volume `/app/uploads` is mounted and private.
- Resend sender domain is verified.
- Test Superadmin, Admin HR, Supervisor, and Employee accounts are available.
- Rollback plan and latest backup location are known.

## A. Public Pages

1. Open homepage at production `APP_URL`.
2. Confirm page loads over HTTPS without browser security warning.
3. Open `/login`.
4. Open `/register`.
5. Open `/forgot-password`.
6. Confirm brand tone, logo, colors, and mobile layout remain unchanged.

Expected result: public pages load quickly, no server error, no mixed-content warning.

## B. Auth + Email

1. Register a new employee account from `/register`.
2. Confirm Resend sends activation email to the registered email.
3. Open activation link and confirm account is activated.
4. Login after activation.
5. Try login with an inactive test user and confirm access is blocked.
6. Open `/forgot-password` and request reset email.
7. Confirm reset email link uses HTTPS production `APP_URL`.
8. Reset password with a valid token.
9. Login using the new password.

Expected result: activation and reset flows work, inactive user stays blocked, no secret appears in UI or logs.

## C. Superadmin

1. Login as Superadmin.
2. Open `/dashboard`.
3. Open `/dashboard/users`.
4. Approve or activate a pending test user.
5. Change test user role to allowed role, then restore intended role.
6. Open audit log page.
7. Confirm activation and role-change audit rows exist.

Expected result: Superadmin has full access; audit log captures sensitive changes.

## D. Employee Setup

1. Create a test employee from employee management.
2. Confirm NIP is auto-generated and follows `MPD-{YEAR}-{DIVISION_CODE}-{SEQUENCE}`.
3. Create or verify an active work location with correct latitude, longitude, and radius.
4. Create or verify an active shift.
5. Assign employee to the work location and shift.
6. Confirm employee profile shows correct assignment.

Expected result: employee, NIP, work location, and shift are stored without duplicate or dummy data.

## E. Attendance GPS + Selfie

1. Login as employee on a real Android phone over HTTPS.
2. Allow camera permission.
3. Allow location permission.
4. Confirm GPS accuracy is within allowed threshold.
5. Check in with realtime camera selfie.
6. Confirm backend geo-fence validation result is accepted or follows configured outside-radius policy.
7. Confirm selfie is saved privately under upload volume, not public static path.
8. Check out with realtime camera selfie.
9. Open attendance history and confirm check-in/check-out data appears.
10. Confirm audit log records attendance actions.

Expected result: no gallery upload path, missing GPS/selfie rejected, backend validates distance.

## F. Protected Selfie

1. Login as Superadmin and view the test attendance selfie.
2. Login as Admin HR and view selfie only if role policy allows it.
3. Login as employee and view own selfie.
4. Login as another employee and attempt to view the first employee selfie.
5. Confirm access is denied.
6. Try direct public URL to `/app/uploads/...` or guessed upload path.
7. Confirm public access fails.
8. Check audit log for privileged selfie view if applicable.

Expected result: selfies are served only through protected API routes with `Cache-Control: no-store, private`.

## G. Leave

1. Login as employee.
2. Submit leave request.
3. Submit sick or permission request if relevant to current workflow.
4. Login as Supervisor or Admin HR.
5. Approve one request.
6. Reject another request with a clear reason.
7. Confirm rejection without reason is blocked.
8. Confirm employee receives notification.
9. Confirm audit log records approval/rejection.

Expected result: leave workflow respects ownership, reason rule, notification, and audit.

## H. KPI

1. Login as authorized Admin HR or Superadmin.
2. Create KPI template with valid weights.
3. Assign KPI to test employee.
4. Login as Supervisor or authorized reviewer.
5. Input KPI result.
6. Approve result.
7. Login as employee.
8. Confirm employee sees own KPI only.
9. Confirm audit log records KPI create/update/approval.

Expected result: KPI workflow works end-to-end and approved result cannot be edited without policy.

## I. Payroll

1. Login as employee.
2. Confirm employee sees own payroll only.
3. Attempt to access another employee payroll and confirm denied.
4. Login as Superadmin.
5. Open payroll summary.
6. Generate or review payroll run for test period.
7. Confirm payroll mutation respects RBAC.
8. Export payroll CSV with authorized role.
9. Confirm unauthorized role cannot export payroll.
10. Confirm audit log records payroll export, approve, mark paid, and payslip download.

Expected result: payroll data never leaks across employee, supervisor, or unauthorized Admin HR scope.

## J. Reports

1. Export attendance CSV with authorized role.
2. Confirm CSV respects filters and row cap.
3. Login as Superadmin.
4. Download Attendance Summary PDF.
5. Download KPI Performance PDF.
6. Download Payroll Summary PDF.
7. Download Executive HR PDF.
8. Login as non-Superadmin and try PDF download.
9. Confirm non-Superadmin is blocked.
10. Confirm report audit log rows exist.

Expected result: exports are permission-protected, audited, and PDF never includes selfie path, URL, or binary.

## K. Health + Performance

1. Open `/api/health`.
2. Confirm HTTP 200 and `status: "ok"`.
3. Confirm response does not expose secrets or connection strings.
4. Confirm homepage loads fast on mobile network.
5. Confirm dashboard loads normally for Superadmin and Employee.
6. Check Coolify application logs for server errors.
7. Check PostgreSQL service logs for connection errors.

Expected result: app healthy, no obvious server errors, no secret leakage.

## L. Final Verification

1. Confirm `npm run release:check` passed before deploy.
2. Confirm Coolify deployment is healthy.
3. Confirm database connected.
4. Confirm `/app/uploads` volume mounted.
5. Confirm Resend email works.
6. Confirm logs checked after smoke test.
7. Confirm latest database backup exists.
8. Confirm latest uploads backup exists.
9. Confirm rollback plan is ready.

Expected result: release can stay live for real employee usage.

## Result Record

Record these after each smoke test:

| Field | Value |
| --- | --- |
| Date/time |  |
| Release/version |  |
| Tester |  |
| Production URL |  |
| Android device/browser |  |
| Backup ID before deploy |  |
| Result | Pass / Fail |
| Issues found |  |
| Decision | Keep live / Roll back / Fix forward |
