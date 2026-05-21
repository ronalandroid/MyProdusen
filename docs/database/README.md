# Database

> **AI agent role source of truth:** MyProdusen production uses exactly two roles: `SUPERADMIN` and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` are historical database values only and must not be exposed in production UI or route access.


> Drizzle ORM on PostgreSQL. Migrations are additive only. Production never
> runs destructive Drizzle commands.

## Migration register

Run with `npm run db:deploy`. The migration runner reads `DATABASE_URL` from
the process environment and falls back to local `.env` for developer machines.
Each file is tracked in `_myprodusen_migrations` with a SHA-256 checksum.
Applied migration checksums are verified on every `npm run db:deploy`; edit-by-place of applied SQL files is rejected. Add a new migration instead.

| File | Purpose |
| ---- | ------- |
| `0000_clean_mad_thinker.sql` | Initial schema (User, Employee, Attendance, WorkLocation, Shift, AuditLog, Notification, ...). |
| `0001_productive_captain_flint.sql` | Schema follow-ups. |
| `0002_condemned_jubilee.sql` | Concurrent-safe schema follow-ups. |
| `0003_nappy_hydra.sql` | Schema additions. |
| `0004_attendance_exceptions.sql` | `AttendanceException` workflow. |
| `0005_leave_balance_ledger.sql` | Leave balance ledger. |
| `0006_payroll_period.sql` | Payroll period locks. |
| `0007_realtime_attendance_selfie.sql` | Selfie URL + uploaded_at columns. |
| `0008_attendance_selfie_metadata.sql` | Selfie size + MIME columns. |
| `0009_attendance_selfie_path.sql` | `check_in/out_selfie_path` (storage key) plus backfill. |
| `0010_attendance_report_indexes.sql` | Composite `(employeeId, checkInTime DESC)`, `(status, checkInTime DESC)`, `Employee_division_idx`. |
| `0011_attendance_geo_status.sql` | `check_in/out_geo_status`, `geo_validation_metadata` JSON, geo-status indexes. |

## Attendance fields (current)

Realtime selfie + GPS metadata, no binary in DB:

```
Attendance.checkInSelfie               -- legacy, kept for compatibility
Attendance.checkOutSelfie              -- legacy
Attendance.check_in_selfie_url         -- protected route URL
Attendance.check_out_selfie_url
Attendance.check_in_selfie_path        -- storage key (no route prefix)
Attendance.check_out_selfie_path
Attendance.check_in_selfie_uploaded_at
Attendance.check_out_selfie_uploaded_at
Attendance.check_in_selfie_size_bytes
Attendance.check_out_selfie_size_bytes
Attendance.check_in_selfie_mime_type
Attendance.check_out_selfie_mime_type

Attendance.check_in_geo_status         -- INSIDE_RADIUS / OUTSIDE_RADIUS / PENDING_REVIEW / APPROVED_MANUAL / REJECTED / GPS_UNAVAILABLE
Attendance.check_out_geo_status
Attendance.geo_validation_metadata     -- JSONB: lat/lon/accuracy/distance/timestamp evidence per check
```

GPS coordinates and distances live in the legacy `checkInLatitude / Longitude
/ Accuracy / Distance` columns; geo-status columns make those values
queryable without recomputing the radius check.

## Indexes

```
Attendance_employeeId_idx
Attendance_workLocationId_idx
Attendance_checkInTime_idx
Attendance_status_idx
Attendance_employeeId_checkInDate_key (UNIQUE — one attendance per day)

Attendance_employeeId_checkInTime_idx       -- composite, paginated reports
Attendance_status_checkInTime_idx           -- status filters
Attendance_check_in_geo_status_idx          -- pending-review queue
Attendance_check_out_geo_status_idx
Employee_division_idx                       -- HR division filtering
Employee_nip_idx
Employee_userId_idx
```

`npm run perf:explain` validates index usage on staging:

```bash
DATABASE_URL=postgresql://staging:... npm run perf:explain
```

## Selfie storage rules

- Files live under
  `${UPLOAD_DIR}/${ATTENDANCE_SELFIE_DIR}/<year>/<month>/<employeeId>/<attendanceId>-{checkin|checkout}.<ext>`.
- Server generates the filename. Never trust the client filename.
- PostgreSQL stores only the relative key + size + MIME + timestamp.
- Selfies are served exclusively through authenticated routes; see
  `SECURITY.md`.

## Database safety rules

1. Do not reset production database.
2. Do not hard-delete employee or attendance history; deactivate instead.
3. Use additive migrations (`ADD COLUMN IF NOT EXISTS`) wherever possible.
4. Test every migration against staging first.
5. Never share the `myprodusen_production` schema with another Coolify app.
6. Backups run daily; restore drills run quarterly.

## Core HR Lookup Indexes — 2026-05-21

Wave 1 core HR sync added additive lookup indexes for employee master-data joins and active master-data screens:

- `Employee_defaultShiftId_idx` supports employee-to-shift lookup, dashboard filters, and attendance prerequisite checks.
- `Employee_defaultLocationId_idx` supports employee-to-work-location lookup, dashboard filters, and attendance prerequisite checks.
- `WorkLocation_name_idx` supports work-location master list lookup and operational review.
- `Shift_isActive_idx` supports active-shift selectors and attendance prerequisite checks.
- `Shift_name_idx` supports shift master list lookup.

Migration: `drizzle/migrations/0014_core_hr_lookup_indexes.sql`.

The migration is additive and uses `CREATE INDEX IF NOT EXISTS`. It does not drop, rewrite, or reset historical employee, attendance, KPI, upload, or audit data.

## Attendance Sync Indexes — 2026-05-21

Wave 2 attendance sync aligned Drizzle schema with attendance report/history indexes and added additive operational lookup indexes:

- Existing migration-backed schema indexes now include `Attendance_employeeId_checkInTime_idx` and `Attendance_status_checkInTime_idx` for history/report pagination.
- New additive index `Attendance_shiftId_idx` supports shift-based attendance filtering and diagnostics.
- New additive index `AttendanceException_status_createdAt_idx` supports pending/review queues by status and recency.

Migration: `drizzle/migrations/0015_attendance_sync_indexes.sql`.

The migration uses `CREATE INDEX IF NOT EXISTS` only. It does not modify or delete historical attendance, selfie metadata, exception, employee, KPI, upload, or audit data.

## Leave + KPI Sync Indexes — 2026-05-21

Wave 3 Leave + KPI sync added additive lookup indexes for approval queues, overlap checks, assignment lookups, and KPI approval dashboards:

- `LeaveRequest_status_createdAt_idx` supports pending leave approval queues by recency.
- `LeaveRequest_employeeId_status_startDate_endDate_idx` supports employee overlap checks and leave history filters.
- `KpiTemplate_isActive_idx` supports active template selectors.
- `KpiAssignment_templateId_period_idx` supports template-period assignment review.
- `KpiResult_employeeId_period_idx` supports employee KPI detail and summary queries.
- `KpiResult_isApproved_period_idx` supports KPI approval queues and approval-status dashboards.

Migration: `drizzle/migrations/0016_leave_kpi_sync_indexes.sql`.

The migration is additive and uses `CREATE INDEX IF NOT EXISTS`. It does not delete leave, KPI, employee, audit, payroll, upload, or attendance history.

## Payroll + Reports Sync Indexes — 2026-05-21

Wave 4 Payroll + Reports sync added additive lookup indexes for payroll selectors, runs, employee payslips, and export/report flows:

- `PayrollStructure_isActive_idx` supports active salary-template selectors.
- `EmployeePayroll_structureId_idx` supports structure-to-employee assignment review.
- `EmployeePayroll_effectiveDate_idx` supports effective-date diagnostics and history.
- `PayrollRun_status_period_idx` supports payroll status dashboards and period filters.
- `PayrollItem_employeeId_runId_idx` supports employee payslip lookup and private payroll history.

Migration: `drizzle/migrations/0017_payroll_reports_sync_indexes.sql`.

The migration is additive and uses `CREATE INDEX IF NOT EXISTS`. It does not delete payroll, payslip, employee, attendance, leave, KPI, upload, or audit history.

## Notifications + Audit Sync Indexes — 2026-05-21

Wave 5 Notifications + Audit sync added additive indexes for per-user notification feeds and audit timelines:

- `Notification_userId_isRead_createdAt_idx` supports unread notification lists and mark-all-read review.
- `Notification_userId_createdAt_idx` supports paginated per-user notification history.
- `AuditLog_action_idx` supports action filters.
- `AuditLog_entity_createdAt_idx` supports entity timelines.
- `AuditLog_userId_createdAt_idx` supports actor timelines.

Migration: `drizzle/migrations/0018_notifications_audit_sync_indexes.sql`.

The migration is additive and uses `CREATE INDEX IF NOT EXISTS`. It does not delete notification or audit history.

## Email Delivery Logs — 2026-05-21

Transactional Resend delivery attempts are now stored in `EmailLog` for audit and manual retry investigation:

- `template`, `recipient`, and `subject` identify the email type and target.
- `provider` and `providerMessageId` store Resend delivery reference when available.
- `status` stores `SENT`, `FAILED`, or `SKIPPED`.
- `errorMessage` stores sanitized provider failure text.
- `metadata` stores non-secret context only, such as template flags or role names.

Migration: `drizzle/migrations/0019_email_delivery_logs.sql`.

The migration is additive and uses `CREATE TABLE IF NOT EXISTS` plus `CREATE INDEX IF NOT EXISTS`.

## Migration checksum guard — 2026-05-22

`scripts/run-migrations.mjs` now compares each already-applied migration checksum against the SQL file on disk. If an applied migration file changes, deployment fails instead of silently skipping it. Add new migrations for schema changes; do not edit applied migration files.
