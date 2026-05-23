# AGENTS.md — MyProdusen AI Agent Operating Manual

> Source of truth: `/docs/prd/README.md` defines product scope and final decisions. Current production roles are exactly `SUPERADMIN`, `LEADER`, and `EMPLOYEE`. `ADMIN_HR` and `SUPERVISOR` may exist only as historical database values and must not be exposed in production UI, seed accounts, tests, or new route access.

## 0. Mission

Build **MyProdusen Web App** for **Produsen Dimsum Medan** as a production-grade internal HRIS covering employees, NIP, attendance, geo-fencing, shifts, leave, KPI, dashboards, reports, audit logs, notifications, PostgreSQL, Docker, VPS, and Coolify.

Operate like a senior fullstack engineer, architect, security reviewer, DevOps engineer, and UI/UX reviewer. Do not guess, change product direction, alter brand tone, or add scope without documentation alignment.

## 1. Source of Truth Order

Read documentation before changing anything.

Required first reads:

```txt
/docs/prd/README.md
/docs/database/README.md            if exists
/docs/ui-ux-guide/README.md         if exists
/docs/security/README.md            if exists
/docs/final-checklist/README.md     if exists
```

Decision hierarchy:

1. `/docs/prd/README.md` — product scope, roles, business rules, acceptance criteria.
2. `/docs/database/README.md` — database model, migrations, Drizzle rules.
3. `/docs/ui-ux-guide/README.md` — approved UI/UX patterns, brand lock, responsive rules.
4. `/docs/security/README.md` — auth, RBAC, upload, logging, production hardening.
5. `/docs/architecture/README.md` — system architecture and execution order.
6. `/docs/final-checklist/README.md` — release readiness.
7. `/docs/operations/README.md` — runbook, backup, restore, rollback.
8. Existing code patterns — implementation style when docs are silent.

If docs conflict, stop and report conflict unless user gives clear instruction to resolve it. Do not silently override `/docs/prd/README.md`.

## 2. Documentation Discipline

Allowed root markdown files:

```txt
README.md
AGENTS.md
```

All other project docs must live in `/docs`.

Update docs when scope changes:

- Code behavior changes → update relevant `/docs` file.
- Database changes → update `/docs/database/README.md`.
- UI changes → update `/docs/ui-ux-guide/README.md`.
- Security changes → update `/docs/security/README.md`.
- Deploy changes → update `/docs/deployment/README.md`.
- Operations, backup, restore, rollback changes → update `/docs/operations/README.md`.
- Tests, fixes, investigations → update `/docs/testing-qa/README.md` and `/docs/changelog/README.md`.

Do not create random planning, status, audit, or report markdown outside `/docs`.

## 3. Locked Product Decisions

### Roles

Production user-facing roles are locked to the three-role model:

```txt
SUPERADMIN
LEADER
EMPLOYEE
```

Rules:

- `SUPERADMIN` has full system access, role/permission control, audit log access, settings, reports, approvals, payroll, and audit logs.
- `EMPLOYEE` can access own dashboard, attendance, leave, KPI, payroll, notifications, and profile.
- Employees must never access another employee's private data.
- `ADMIN_HR` and `SUPERVISOR` must not be used for production UI, seed accounts, tests, or new route access.
- Inactive users must not log in.
- Backend must enforce every permission.

### Database and ORM

Project uses:

```txt
Drizzle ORM
PostgreSQL
Drizzle SQL migrations
npm run db:deploy
```

Required paths, files, and commands:

```txt
/drizzle
/drizzle/migrations
drizzle.config.ts
Drizzle SQL migrations
npm run db:deploy
```

Database rules:

- Use additive Drizzle migrations.
- Never reset production database.
- Never run destructive migrations without explicit approval.
- Keep historical attendance, employee, KPI, audit, and upload metadata.
- Use deactivation or soft delete where history exists.
- Add indexes for dashboard, report, auth, attendance, KPI, and audit queries.

## 4. Tech Stack Lock

Use existing stack unless docs explicitly change it:

```txt
Next.js App Router
TypeScript
Tailwind CSS
Drizzle ORM
PostgreSQL
Docker
Coolify
VPS
Persistent upload storage
```

Do not add heavy dependencies without clear benefit. Before adding any package, check existing utilities, runtime cost, security impact, and documentation impact.

## 5. Frontend-Backend-Database Sync Rule

Every feature must be wired end-to-end:

```txt
UI -> API/server action -> service -> Drizzle -> PostgreSQL -> response -> UI state
```

A feature is incomplete if any layer is mocked, disconnected, frontend-only, or writes data without read-back verification. Backend remains source of truth for auth, RBAC, validation, geo-fencing, attendance timing, KPI scoring, report filters, uploads, and audit logging.

## 6. UI/UX Lock

Do not change product name, logo, brand colors, UI tone, spacing rhythm, typography direction, dashboard style, component style, or interaction patterns unless explicitly requested.

Brand colors:

```txt
Primary Yellow: #FFC107
Accent Red:    #E53935
Black:         #111111
Soft Gray:     #F5F5F5
Success Green: #22C55E
```

UI direction:

- Clean, minimal, professional internal dashboard.
- Easy for non-technical staff.
- Mobile responsive and WCAG-friendly.
- Clear labels, errors, loading states, empty states, and success feedback.
- Not noisy, not AI-looking, no unnecessary animation.

Every UI change must pass:

- No clipped button text.
- No overlapping icon/text.
- No horizontal overflow.
- No dead buttons.
- Tap target minimum `44px`.
- Modal responsive on mobile and desktop.
- Forms preserve user input after validation errors.
- Async actions show loading state.
- Success and error feedback visible.
- Colors and tone match MyProdusen guide.
- Mobile `360px` / `390px` and desktop `1440px` checked when UI changes.

## 7. Security and Safety Rules

Mandatory backend rules:

- Validate all input server-side.
- Enforce auth and RBAC server-side.
- Return consistent safe errors; never expose stack traces to users.
- Never trust frontend GPS, distance, file metadata, role, user ID, or employee ID.
- Add audit log for sensitive actions.
- Use `no-store` for protected data.
- Never expose private upload/selfie files publicly.
- Never commit `.env`, secrets, dumps, upload archives, credentials, tokens, or private exports.

Sensitive actions requiring audit log include login, logout, failed login where feasible, user changes, role changes, employee changes, NIP generation, location changes, shift changes, attendance check-in/out, geo-fence rejection/pending, manual attendance adjustment, leave approval/rejection, KPI create/update/approval, report export, protected selfie access, and deployment-sensitive admin actions.

## 8. Production Debugging and Observability

Production behavior:

- No raw JavaScript errors shown to users.
- Add safe error boundaries for user-facing failures.
- Show human-readable Indonesian error messages.
- Log technical details server-side only.
- Redact secrets, tokens, passwords, cookies, PII where possible, and private file paths.
- `/api/health` must not leak secrets, database URLs, upload paths, private filenames, or provider keys.
- `/api/version` may expose only safe metadata such as app name, status, version, git SHA, build time, and environment label.
- Protected data must use `Cache-Control: no-store` or equivalent private no-cache behavior.
- Private uploads and selfies must be served only through protected endpoints with ownership/RBAC checks.

Debugging process:

1. Reproduce or identify failing path.
2. Check client state, server logs, request payload, response code, and database state.
3. Find root cause before patching.
4. Fix smallest safe surface.
5. Add or update tests for critical logic.
6. Document production-impacting fix in relevant `/docs` file.

## 9. Business Rules That Must Not Regress

- NIP generated automatically as `MPD-{YEAR}-{DIVISION_CODE}-{SEQUENCE}`.
- NIP unique, stable, never reused after deactivation.
- Attendance requires active employee, active shift, active work location, GPS, accuracy, selfie, and backend geo-fence validation.
- One check-in and one check-out per employee per day.
- Check-out before check-in is rejected.
- Leave/sick/permission starts pending; rejection requires reason; overlap is rejected.
- KPI template total weight must be `100`.
- Employee can view own KPI only and cannot edit own score.
- Approved KPI cannot be edited without authorized reason and audit log.
- Exports respect filters, permissions, and audit logging.
- Historical attendance, KPI, employee, upload, and audit data must not be hard-deleted.

## 10. Agent and Skill Rules

Use available Codex skills when useful, especially Superpowers for planning, review, debugging, verification, and safe coordination. Use UI/UX skill for UI quality reviews. Skills cannot override `/docs` or this file.

Maximum agents:

```txt
5 agents total
```

Allowed agent scopes:

1. Docs + Product + Reference Analysis.
2. Architecture + Database + Auth/RBAC.
3. Employee + NIP + Location + Attendance.
4. KPI + Leave + Dashboard + Reports.
5. UI/UX + Testing + Security + Deployment.

Parallel work is allowed only when files do not overlap. Safe wave order is docs, database/auth, employee/location/attendance, KPI/leave/dashboard/reports, then UI/testing/security/deployment. Merge one result at a time and run checks after merge.

## 11. Engineering Rules

- Keep scope tight and aligned with PRD.
- Prefer small, typed, modular code.
- Separate UI, validation, service, repository, and database concerns.
- Reuse existing components and patterns.
- Fix root causes, not symptoms.
- Do not remove working behavior without reason.
- Do not hard-code secrets or environment-specific URLs.
- Do not introduce frontend-only authorization.
- Do not leave buttons, forms, routes, or menu items disconnected.
- Do not add random features outside PRD.

Recommended structure:

```txt
/src/app
/src/components
/src/features
/src/lib
/src/server/services
/src/server/repositories
/src/server/validators
/src/types
/src/utils
/drizzle/migrations
/docs
```

## 12. Testing and Verification

Required critical test coverage:

- NIP format, uniqueness, sequence increment, division code, no reuse after deactivation.
- Geo-fencing inside radius, outside radius, invalid coordinates, bad GPS accuracy.
- Attendance check-in, double check-in rejection, check-out before check-in rejection, check-out, double check-out rejection, late and early leave calculations.
- RBAC employee isolation, Superadmin access, inactive user login rejection, and no production exposure for `ADMIN_HR` / `SUPERVISOR`.
- KPI scoring for higher-is-better, lower-is-better, boolean, total score, approved edit restriction.
- Leave create, overlap rejection, approval, rejection reason requirement.
- Upload MIME, size, safe filename, private access, persistent storage behavior.

Run available checks before final response for code changes:

```bash
npm run lint
npm run test
npm run build
npm run release:check
```

If a command does not exist, state that clearly. If only docs changed, run a focused reference check instead of pretending code tests were required.

## 13. Definition of Done

A task is **DONE** only when all applicable items are true:

- Required docs checked first.
- Scope clear and aligned with `/docs/prd/README.md`.
- UI follows `/docs/ui-ux-guide/README.md` when UI changes.
- Frontend action wired to backend.
- Backend validates input.
- Backend checks auth/RBAC.
- Database read/write is correct through Drizzle and PostgreSQL.
- Audit log added for sensitive action.
- Loading, error, empty, and success states exist.
- Mobile `360px` / `390px` and desktop `1440px` checked if UI changed.
- `npm run lint` passes when code changes.
- `npm run test` passes when code changes.
- `npm run build` passes when code changes.
- `npm run release:check` passes.
- Relevant docs updated.
- No secrets, private upload paths, or raw errors exposed.

Do not claim completion without verification evidence.

## 14. Standard Error Shape

Use existing backend pattern when present. Preferred shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable Indonesian message"
  }
}
```

Common codes:

```txt
AUTH_INVALID_CREDENTIALS
AUTH_USER_INACTIVE
AUTH_FORBIDDEN
EMPLOYEE_NOT_FOUND
NIP_GENERATION_FAILED
ATTENDANCE_ALREADY_CHECKED_IN
ATTENDANCE_NOT_CHECKED_IN
ATTENDANCE_ALREADY_CHECKED_OUT
ATTENDANCE_GPS_REQUIRED
ATTENDANCE_SELFIE_REQUIRED
ATTENDANCE_OUTSIDE_GEOFENCE
LEAVE_OVERLAP
KPI_TEMPLATE_INVALID_WEIGHT
KPI_RESULT_ALREADY_APPROVED
REPORT_EXPORT_FAILED
```

## 15. Final Response Format

After work, return:

```txt
Summary
Conflicts found
Fixes applied
Files changed
Commands run
How to test
Risks / limitations
Remaining decisions needed
```

For this repository, correctness, security, data integrity, documentation alignment, UI consistency, maintainability, scalability, and production readiness win in that order.


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

## Final Role And Assignment Model — 2026-05-24

Public registration must create `EMPLOYEE` only. Users must never self-select `LEADER`, `SUPERADMIN`, team/division, position/title, work location, or shift. Superadmin owns all promotion and work-identity assignment. Role (`SUPERADMIN`, `LEADER`, `EMPLOYEE`) is separate from team/division and position/title. Team/division values are configurable operational data; do not hardcode access logic to only Produksi/Kargo/Cetak. Preserve history and use safe additive migrations/upserts only.

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
