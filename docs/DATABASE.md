# Database

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


> Drizzle ORM on PostgreSQL. Migrations are additive only. Production never
> runs destructive Drizzle commands.

## Migration register

Run with `npm run db:deploy`. Each file is tracked in
`_myprodusen_migrations` with a SHA-256 checksum.

| File | Purpose |
| ---- | ------- |
| `0000_clean_mad_thinker.sql` | Initial schema (User, Employee, Attendance, WorkLocation, Shift, AuditLog, Notification, ...). |
| `0001_productive_captain_flint.sql` | Schema follow-ups. |
| `0002_add_attendance_unique_constraint.sql` | One-attendance-per-employee-per-day. |
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
