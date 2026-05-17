# Implementation Plan

> Track of what is shipped, what's in flight, and what's deferred. The
> highest source of truth is `prd.md`; everything here describes how to get
> there.

## 1. Status snapshot

- ✅ Lint clean (`tsc --noEmit`).
- ✅ 35 test files / 206 tests passing (`vitest run`).
- ✅ Production build succeeds (`next build`).
- ✅ 13 Drizzle migrations, all additive / idempotent.
- ✅ Audit-logged check-in / check-out / selfie view / report export / leave + KPI approval.
- ✅ Protected selfie endpoints with private storage and audit on non-owner views.
- ✅ Hardened GPS validator with reject-vs-pending workflow.
- ✅ Live work-location admin, paginated employee admin, employee-facing exception submission.
- ✅ Daily / weekly / monthly preset chips on the attendance report.
- ✅ EXPLAIN ANALYZE runbook (`npm run perf:explain`).
- ✅ Approved UI/UX direction documented in `UI_UX_GUIDE.md`: mobile-first yellow HRIS app, rounded cards, bottom navigation, and required screen patterns.

## 2. Phases

### Phase 1 — Foundation (done)
- Lint + build green; root `AGENTS.md` and current-state docs committed; baseline Docker validated; healthcheck endpoint shipped.

### Phase 2 — Auth + RBAC (done)
- Strict `JWT_SECRET` validation (production aborts on missing / short secret).
- `requireAuth` fetches active user/role from the database.
- Root middleware protects `/dashboard/*`.
- Role hierarchy enforced during user creation and role changes.
- Login rate-limit + strong password policy.
- Password-reset signing now uses the same `getProductionJwtSecret` helper as session signing — no fallback secret in production.

### Phase 3 — Database Safety (done)
- Per-employee per-day uniqueness on `Attendance`.
- Documented safe migration workflow (`npm run db:deploy`).
- Audit log writes for all sensitive mutations.
- Production bootstrap separated from dev seed.

### Phase 4 — Core Feature Wiring (done)
- Auth tokens travel via httpOnly cookies plus `Authorization: Bearer` fallback.
- Live API integration for employees, locations, shifts, leave, attendance, KPI.
- Row-level scoping hardened across routes; integration tests cover every scope.

### Phase 5 — Attendance Production Flow (done)
- Realtime selfie capture (no `<input type="file">`, no gallery picker).
- Backend selfie validation: MIME signature + size + storage path containment.
- GPS validator (`lib/attendance/gps-validation.ts`) is the only authoritative source for distance / radius / accuracy / timestamp freshness.
- Manual adjustment route + admin review surface for outside-radius pending entries.
- Employee → manager pre-validation: location and shift assignment must exist.
- Attendance UI must continue using realtime camera capture only; no upload, gallery, or manual file fallback may be added during UI polish.

### Phase 6 — KPI + Reports (done)
- KPI service + `/api/kpi/*` routes with audit-logged approval and notifications.
- Dashboard aggregation endpoints.
- Attendance report unified through `lib/reports/attendance-history.ts`:
  - `GET /api/reports/attendance` (paginated list + CSV / UTF-8-BOM XLSX export).
  - `GET /api/reports/attendance/summary` (cards).
  - Daily / weekly / monthly preset chips on the dashboard page.
  - `ATTENDANCE_EXPORT_MAX_ROWS` cap and `truncated:true` audit field.

### Phase 7 — Notification + Audit (done)
- Notification persistence + best-effort realtime publish; never blocks the originating mutation.
- Audit log API + Superadmin audit page integration.
- Retention policy documented.

### Phase 8 — Testing (done)
- Geofence math, NIP, permissions, KPI scoring, date utilities — all unit-tested.
- Integration coverage for auth, RBAC, attendance geofence, leave approvals, attendance reports, protected selfie access, work-location search.
- `npm run lint && npm run test && npm run build` is the gate.

### Phase 9 — Docker + Coolify Release (done)
- Dockerfile + standalone Next.js build validated.
- Coolify env keys, persistent `/app/uploads` volume, healthcheck path documented.
- `npm run db:deploy` runs in the entrypoint.
- Backup + restore documented; daily `pg_dump` + `rsync` cron schedules listed in `COOLIFY.md`.
- `npm run perf:explain` runbook for index validation on staging.

### Phase 10 — UI/UX Upgrade Alignment (approved docs scope)
- Preserve stack: Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Tailwind CSS.
- Follow `UI_UX_GUIDE.md` for onboarding, login, dashboard, attendance, employees, leave, KPI, profile, and reports screens.
- Keep brand colors and existing logo unchanged; use yellow as primary accent, red only for danger/rejection/late states.
- Use mobile-first rounded cards and bottom navigation for employee flows, with responsive admin dashboards for desktop.
- Preserve backend RBAC, GPS, geofence, private selfie storage, and audit requirements as non-negotiable security gates.
- Confirm attendance UI has realtime camera selfie only: no upload button, no gallery picker, no `<input type="file">`, no `accept="image/*"` fallback.

## 3. Workstream summaries (delivered)

### Realtime selfie attendance
- Browser camera with WebP/JPEG fallback, ≤ 720×720, quality 0.75, target ≤ 300 KB.
- Backend: MIME signature + 1 MB hard cap, server-generated path
  `attendance-selfies/<year>/<month>/<employeeId>/<attendanceId>-{checkin|checkout}.<ext>`.
- PostgreSQL stores only path + size + MIME + timestamp.
- Audit on every check-in / check-out (success or rejection).
- Migration `0007_realtime_attendance_selfie.sql`, `0008_attendance_selfie_metadata.sql`.

### Protected selfie access
- Endpoints: `GET /api/attendances/:id/selfie/check-in` and `.../check-out`.
- RBAC: employee-self, supervisor-team, admin/superadmin all.
- Path traversal blocked at filename + segment level; storage path resolver
  re-checks containment under `UPLOAD_DIR` before reading.
- Audit log writes `SELFIE_VIEW` for non-owners and `INVALID_SELFIE_ACCESS`
  for malformed attempts.
- Migration `0009_attendance_selfie_path.sql` adds `*_path` columns and
  backfills from existing `*_url` columns.

### Hardened GPS / geo-fence
- `validateGpsAttendance` covers lat/lon presence + range, accuracy ≤
  `GPS_MAX_ACCURACY_METERS`, optional `gpsTimestamp` ≤
  `GPS_TIMESTAMP_MAX_AGE_SECONDS`, work-location existence + active flag,
  Haversine distance vs radius, reject-vs-pending behaviour controlled by
  `REJECT_OUTSIDE_GEOFENCE`.
- Pending entries integrate with `AttendanceException` + admin review page;
  approval flips `check_in_geo_status` to `APPROVED_MANUAL`, rejection to
  `REJECTED`. Both write audit + notification rows.
- Migration `0011_attendance_geo_status.sql` adds the geo-status columns
  and the `geo_validation_metadata` JSON column.

### Attendance reports + export
- Single shared query module powers list + summary + CSV.
- CSV columns match `REPORTS.md` exactly. Selfie binaries never exported;
  only YES/NO flags.
- Export requires both `from` and `to`; capped by
  `ATTENDANCE_EXPORT_MAX_ROWS`; writes audit row with serialized filters,
  scope, row count, truncation flag.
- Indexes: composite `(employeeId, checkInTime DESC)`,
  `(status, checkInTime DESC)`, `Employee_division_idx` (migration `0010`).

### Live admin surfaces
- `/dashboard/locations` is now backed by the live API with debounced
  `?search=` (case-insensitive `ilike` on name + address) and
  active/inactive filter.
- `/dashboard/employees` debounces 300 ms before firing `?search=` against
  `/api/employees`, which filters case-insensitively on `fullName`, `nip`, and
  `email`.
- `/dashboard/attendance` includes the `MyExceptionPanel` so employees can
  file `MANUAL_ADJUSTMENT`, `MISSING_CHECKOUT`, `LATE_CORRECTION`, or
  `OUTSIDE_GEOFENCE` exceptions and watch the review status.

### Reference repo research (research-only)
- `REFERENCE_REPO_ANALYSIS.md` documents what was extracted from
  `ikhsan3adi/absensi-karyawan-gps-barcode` and `josephines1/o-present`. No
  code was copied.

## 4. Deferred / next

### P1 — pick when planned
- Employee XLSX import with Zod dry-run preview + per-row errors +
  audit-logged commit.
- Optional `pg_trgm` index on `Employee.fullName` / `Employee.nip` if search
  load grows.

### P2 — phase 2 work, defer
- QR / barcode attendance.
- Face matching, liveness, anti-fake GPS detection.
- WhatsApp notifications.
- Payroll integration / production-inventory sync.
- Native mobile app.

### Tech debt
- Two parallel attendance / leave / KPI service trees (`src/services/...`
  and `features/...`) still exist. Consolidating to one removes drift risk.

## 5. Working rules for new agents

1. Read `prd.md` first.
2. Then read `AGENTS.md` for selfie / brand / secret rules.
3. Then read this plan to see what's already done.
4. Update this plan in the same commit as the change.
5. Move historical / dated docs into `docs/_archive/`. Top-level docs only
   describe the current state.
