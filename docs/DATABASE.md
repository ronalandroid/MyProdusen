# Database

> **AI agent role source of truth:** MyProdusen production uses exactly three roles: `SUPERADMIN`, `LEADER`, and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` are historical database values only and must not be exposed in production UI or route access.


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
Attendance.adjustment_reason           -- optional clock note (≤150 chars); check-out note appended as "Clock-out: …"
```

GPS coordinates and distances live in the legacy `checkInLatitude / Longitude
/ Accuracy / Distance` columns; geo-status columns make those values
queryable without recomputing the radius check.

The optional clock-in/out note is stored in the existing `adjustment_reason`
column (no migration). Clock-out notes are appended to any clock-in note so
neither is lost. Clock-in/out writes run inside a DB transaction; the unique
`Attendance_employeeId_checkInDate_key` enforces one attendance per employee per
day and backs the race-safe duplicate check-in handling.

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

Exception: `0004_attendance_exceptions.sql` has one approved legacy checksum from the pre-idempotent file version (`3ead212f6c826c22df01708203b68bc0f3c9c1d55ea84125d65a6905055c15ac`). The current file only wraps the same objects with `IF NOT EXISTS` / duplicate-object guards for safe redeploy. The deployment runner allows that legacy checksum and still blocks any other checksum mismatch.

Exception: `0005_leave_balance_ledger.sql` has one approved legacy checksum from the pre-idempotent file version (`9a42caa30bef8e94b9fc1a9c52892047a88daf4110972dc0048846c147d11734`). The current file only wraps the same type, table, and indexes with `IF NOT EXISTS` / duplicate-object guards for safe redeploy. The deployment runner allows that legacy checksum and still blocks any other checksum mismatch.

## Official Work Location — 2026-05-22

Official attendance geofence location:

- Name: `Produsen Dimsum Medan | TBM GRUP`
- Latitude: `3.6009125`
- Longitude: `98.6964954`
- Radius: `100` meters
- Active: `true`

Schema mapping:

- Table: `WorkLocation`
- Radius column: `radius` stores radius in meters.
- Employee assignment: `Employee.defaultLocationId` links employee to official work location.
- Employee shift assignment: `Employee.defaultShiftId` must exist for attendance.

Operational seed/upsert:

```bash
npm run seed:work-location
```

The seed script upserts by stable ID/name, preserves existing address when present, does not delete locations, and never resets attendance or employee history.


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

## Production UAT Leader Data Gate — 2026-05-24

### Migration and Seeds
- `npm run db:deploy` passed on configured database; migration `0020_leader_role_teams_kpi_production.sql` applied.
- `npm run seed:work-location` passed; official location `Produsen Dimsum Medan | TBM GRUP` is active.
- `npm run seed:leader-teams` added and passed; it safely upserts teams `Cetak`, `Gudang`, and `Pengiriman` by name, uses no passwords, and performs no destructive delete.

### Verification Query Result
- Official active location: `1`.
- Active Superadmin users: `22`.
- Active Leader users: `0`.
- Active Employee users: `48`.
- Active Leader employee profiles: `0`.
- Leader profiles with active location and shift: `0`.
- Active teams: `3`.
- Active Leader assignments: `0`.
- Active Employee team assignments: `0`.
- Assigned employees with active location and shift: `0`.

### Data Blockers
- No active `LEADER` account exists in the configured database.
- No Leader employee profile/location/shift exists.
- No Leader assignment exists.
- No Employee team assignment exists.
- Staging UAT must create/verify first Leader, team assignment, member assignment, location, and shift through Superadmin-approved flow before production signoff.

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

## Final Role Assignment Database Update — 2026-05-24

- Added safe additive migration `0021_positions_team_assignment_metadata.sql`.
- Migration adds `Position`, `Team.slug`, `EmployeeTeamAssignment.positionId`, indexes, and one-active-primary-team guard per employee.
- Existing users, employees, attendance, KPI, payroll, reports, uploads, and audit records are preserved.
- Existing employees without team remain unassigned; Superadmin UI shows assignment gap and can assign team/division.
- `seed:leader-teams` safely upserts teams and never deletes or resets data.
- `setup:uat-leader-flow` and `verify:uat-leader-flow` require env credentials and do not print passwords.

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

## UAT Data Model Notes — 2026-05-24

- No destructive database change added in this patch.
- Existing `Employee.profilePhoto` now participates in profile completion with `phone`, `address`, and `profileCompletedAt`.
- Existing `Employee.defaultLocationId` and `Employee.defaultShiftId` remain source of truth for attendance validation.
- Avatar files are stored in persistent upload storage under `profile-avatars/YYYY/MM/{employeeId}/...`; database stores the protected `/api/profile/avatar/...` path only.

## Migration 0023 And Leave Ledger Release Audit — 2026-05-24

- `0023_kpi_targets_payroll_rules.sql` is additive and production-safe: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and `CREATE INDEX IF NOT EXISTS` only.
- Tables added/preserved: `KpiMetric`, `KpiTarget`, `PayrollRule`.
- Column added/preserved: `PayrollItem.bonusPay` with default `0`.
- No destructive SQL detected: no `DROP`, `DELETE`, `TRUNCATE`, or destructive `ALTER`.
- Leave balance quota changes must be append-only via `MANUAL_ADJUSTMENT` ledger rows.
- `npm run sync:leave-balance-period` supports `DRY_RUN=true`, `LEAVE_BALANCE_YEAR`, `LEAVE_BALANCE_QUOTA`, and `LEAVE_BALANCE_ACTOR_USER_ID`.

## Talenta-Inspired Feature Flag Data Safety — 2026-05-24

Non-core Talenta-style modules are hidden by feature flags, not removed from the database. Do not drop existing overtime, document, reimbursement, announcement, or related tables without a separate approved destructive-change plan. Core production data remains attendance, shifts, work locations, leave ledger, KPI production/targets, payroll rules/items, notifications, protected uploads, teams/positions, users/employees, and audit logs.



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

## Professional Gamification Data Sources

Gamification is an aggregation layer, not a source of fake records.

Primary sources:

- Attendance records: check-in/out time, status, geofence metadata, shift context, and daily attendance evidence.
- Attendance daily summaries or heatmap API: monthly streak state and present/late/leave/off/absent mapping.
- KPI production records and KPI results: production performance contribution.
- Behavior/culture score records: discipline, cleanliness, neatness, SOP compliance, teamwork, and responsibility where recorded.
- Employee performance score summaries/snapshots: current score, historical score trend, tier, projected raise percent, and badges.

Current schema-backed gamification/performance tables include the migration-backed performance score summary, score snapshot, leader score entry/anomaly, score period, badge, and gamification settings structures introduced by `0025_gamification_performance_theme.sql`, `0026_gamification_constraints_settings.sql`, `0027_culture_discipline_score_alias.sql`, and `0028_work_duration_payroll_streak_projection.sql`.

Raise projection is privacy-sensitive. Employee may see own projected raise estimate. Leader must not see team salary/payroll amount. Superadmin may see company-level performance and review/override behavior scores according to RBAC and audit rules.

## MyProdusen MVP Finalization Scope — Produsen Dimsum Medan

MVP scope is intentionally limited to operational HRIS flows needed for daily use:

1. Absensi selfie + geotag/geofence.
2. Payroll/gajian sederhana.
3. KPI produksi sync.
4. Pengajuan cuti + saldo cuti.
5. Role-based dashboard for `SUPERADMIN`, `LEADER`, and `EMPLOYEE` only.

Postponed/non-MVP: recruitment, complex BPJS/tax automation, bank disbursement, 360 review, reimbursement, multi-company, enterprise workflow builder, and extra roles such as `ADMIN_HR` or `SUPERVISOR`.

### Attendance MVP

Employee/Leader dashboard flow: Clock In/Clock Out → GPS/map validation → distance/radius status → selfie capture → optional note → submit → attendance history refresh. Backend must require authenticated employee profile, assigned active shift, assigned active work location, GPS evidence, selfie evidence, geofence validation, protected selfie storage, and audit-sensitive action logging. Superadmin does not use normal attendance CTA.

### Payroll/Gajian MVP

Superadmin owns payroll setup, calculation review, period/status control, payslip/report access, and approval/payment state. Employee and Leader can see own payroll/payslip only. Leader cannot see assigned-team salary, payroll amount, payslip, or payroll export. Payroll breakdown should remain simple: base salary, KPI bonus if configured, attendance deduction, holiday multiplier if supported, and final amount.

### KPI Production MVP

Leader inputs production KPI only for assigned team members. Leader outside-team input is blocked. Leader self-KPI input stays blocked unless an explicit env/policy allows it. Employee sees own KPI read-only. Superadmin can see all KPI, configure target/rules where available, and filter by division/team/month where available.

### Leave/Cuti MVP

Employee and Leader can submit leave request with reason/date/duration, see status, and consume balance only through approved flow. Server blocks overlap and insufficient balance with `LEAVE_BALANCE_INSUFFICIENT`. Leave balance changes are append-only ledger events. Superadmin approves/rejects and may adjust balance through ledgered workflow.

### MVP Release Rule

No fake GPS, fake selfie, fake KPI, fake payroll, or fake leave balance may be marked pass. Real-device attendance and authenticated UAT remain required before production signoff.


## TBM Division & Payroll Master Data

MyProdusen supports configurable TBM master data for `Administrasi`, `Produksi`, `Packing`, and `BEGE`. Superadmin manages divisions, positions, payroll rules, and employee payroll placement from “Struktur Divisi & Gaji”. Defaults are editable seed data, not locked business constants.

Default payroll rules seed:
- Admin Training: Administrasi/Admin monthly training Rp2.000.000 and full Rp2.300.000.
- Produksi Harian: Produksi daily Rp60.000/day.
- Packing Harian: Packing daily Rp60.000/day.
- Produksi Cetak Perempuan: Produksi/Produksi Cetak daily Rp50.000/day.
- Adon Helper Laki-laki: Produksi/Adon Helper daily Rp60.000/day.
- BEGE Default: configurable daily default with custom amount.

Salary privacy: Superadmin can manage and report all salary rules. Employees can read only their own salary rule and payslip. Leaders can see attendance, KPI, score, and production progress only; leaders must not see team salary amounts. Employee-specific custom overrides beat division/position defaults. Training status resolves training salary until training ends, then full salary.

---

## Frontend UI/UX v4 update

Current frontend UI/UX baseline:
- Design language: Strava-inspired, metric-first, mobile-first.
- Brand accent: `#FFC107` yellow.
- Fonts: Poppins for UI/headings, JetBrains Mono for stats and numeric values.
- Surfaces: soft gray page bands with white cards.
- Radius: 8px default radius.
- Navigation: white desktop sidebar with yellow active left border; mobile bottom nav with yellow active state.
- Shared primitives restyled globally through `app/globals.css`: `.btn`, `.input`, `.card`, `.table`, `.badge`, `.nav-item`, `.stat-card`, `.alert`.
- Employee Beranda includes Strava-style stat strip: Hadir, Streak, Skor.

Validation status:
- `npm run lint` passed after UI/UX v4 update.
- `npm run build` passed after UI/UX v4 update.

When updating this document, keep workflow/security/data rules unchanged and only align frontend descriptions with v4 UI/UX language.

