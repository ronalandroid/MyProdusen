# AGENTS.md — MyProdusen Web App

## 0. Prime Directive

You are working on **MyProdusen Web App** for **Produsen Dimsum Medan**.

This project is an internal HRIS-style web app for:
- employee management
- NIP auto-generation
- GPS + selfie attendance
- geo-tagging
- geo-fencing
- work location management
- shift management
- leave/sick/permission requests
- KPI management
- dashboards
- reports/export
- audit logs
- notifications
- PostgreSQL database
- VPS + Coolify deployment

Work like a senior fullstack engineer, software architect, security reviewer, DevOps engineer, and UI/UX designer with 15+ years of experience.

Do not act randomly.
Do not guess.
Do not change product direction.
Do not change UI/UX tone without explicit instruction.

---

## 1. Source of Truth

Always read `/docs` before doing any work.

Canonical docs:

```txt
/docs/prd.md
/docs/AGENTS.md
/docs/IMPLEMENTATION_PLAN.md
/docs/PARALLEL_AGENTS_PLAN.md
/docs/FINAL_CHECKLIST.md
/docs/COMPETITOR_RESEARCH.md
```

Rules:

1. `/docs` is the source of truth.
2. Before creating, changing, or adding any feature, read `/docs/prd.md`.
3. Before changing architecture, read `/docs/IMPLEMENTATION_PLAN.md`.
4. Before using agents/subagents, read `/docs/PARALLEL_AGENTS_PLAN.md`.
5. Before final review, read `/docs/FINAL_CHECKLIST.md`.
6. If a markdown document must be added, put it inside `/docs`.
7. Do not create random `.md` files in root unless explicitly requested.
8. If root docs already exist, sync or move them into `/docs`.
9. Do not let documentation become scattered.
10. Documentation must stay professional, clean, and consistent.

---

## 2. Documentation Rule

Any new documentation must go here:

```txt
/docs
```

Allowed root markdown files:

```txt
README.md
AGENTS.md
```

All other planning/product/technical docs must be inside `/docs`.

Examples:

```txt
/docs/prd.md
/docs/API.md
/docs/DATABASE.md
/docs/RBAC.md
/docs/SECURITY.md
/docs/DEPLOYMENT.md
/docs/COOLIFY.md
/docs/TESTING.md
/docs/CHANGELOG.md
```

When adding a feature:
1. Check docs first.
2. Update docs if needed.
3. Then code.
4. Then update checklist.

Never code a major feature without documentation alignment.

---

## 3. Skill Usage Rule

Use available Codex skills when useful.

### Required project skill behavior

If available, use:

```txt
superpowers
```

for:
- managing agents/subagents
- breaking work into safe parallel tasks
- preventing overlapping edits
- planning waves
- coordinating implementation
- doing final review

If available, use:

```txt
ui ux promax
```

for:
- improving UI/UX quality
- refining layout
- improving accessibility
- improving visual hierarchy
- improving dashboard clarity
- improving forms, tables, empty states, and error states

Important:

1. Skills must not override `/docs`.
2. Skills must not change product scope.
3. Skills must not change brand style, tone, colors, or logo unless explicitly requested.
4. If a skill is not available, continue using the rules in this file manually.
5. If using a skill creates conflict with `/docs`, `/docs` wins.

---

## 4. Brand, Logo, Style, and UI/UX Lock

Do not change the existing UI/UX style, tone, theme, or logo unless explicitly requested.

Preserve:

- product name
- logo
- brand colors
- UI tone
- spacing rhythm
- typography direction
- dashboard style
- component style
- interaction pattern
- existing design system

Brand colors:

```txt
Primary Yellow: #FDC704
Accent Red:    #B51B19
Black:         #000000
Soft Gray:     #E5E3E6
```

UI/UX direction:

- clean
- minimal
- professional
- modern internal dashboard
- not AI-looking
- easy for non-technical staff
- mobile responsive
- WCAG-friendly
- accessible contrast
- clear labels
- clear errors
- clear loading states
- clear empty states

Color usage:

- Yellow = brand accent and primary CTA.
- Red = danger, rejection, late status, critical warning.
- Black = primary text and strong contrast.
- Gray = background, border, card surface, neutral state.
- Do not overuse yellow.
- Do not overuse red.
- Do not make the UI noisy.

Before changing UI:
1. Read `/docs/prd.md`.
2. Check existing components.
3. Reuse current design pattern.
4. Improve without changing tone.
5. Preserve logo and brand identity.

---

## 5. Max Agent Rule

Use maximum **5 agents** only.

Never create more than 5 agents.

Allowed agents:

### Agent 1 — Docs + Product + Competitor Research

Scope:
- finalize `/docs/prd.md`
- maintain `/docs/COMPETITOR_RESEARCH.md`
- maintain `/docs/AGENTS.md`
- maintain `/docs/IMPLEMENTATION_PLAN.md`
- maintain `/docs/PARALLEL_AGENTS_PLAN.md`
- maintain `/docs/FINAL_CHECKLIST.md`
- ensure docs are clean, professional, and not conflicting

### Agent 2 — Architecture + Database + Auth/RBAC

Scope:
- repo architecture
- folder structure
- Prisma/PostgreSQL schema
- migrations
- roles
- permissions
- auth
- backend guards
- security foundation

### Agent 3 — Employee + NIP + Location + Attendance

Scope:
- employee management
- NIP auto-generation
- division/position/supervisor relation
- work location
- geo-fencing
- GPS + selfie attendance
- shift attendance rules
- attendance audit trail

### Agent 4 — KPI + Leave + Dashboard + Reports

Scope:
- leave/sick/permission workflow
- KPI template
- KPI assignment
- KPI scoring
- dashboard
- reports
- export
- notifications

### Agent 5 — UI/UX + Testing + Security + Deployment

Scope:
- UI/UX polish
- design system consistency
- accessibility
- testing
- security review
- Docker
- Coolify
- VPS deployment
- backup/restore
- final MVP readiness review

---

## 6. Parallel Work Rule

Use parallel agents only when safe.

Rules:

1. Docs first.
2. Database before feature.
3. Auth before protected feature.
4. Work location before GPS attendance.
5. Attendance before dashboard/report.
6. KPI before KPI dashboard.
7. Audit log must exist before final sensitive modules.
8. Do not let agents edit the same file at the same time.
9. Merge one agent result at a time.
10. Run checks after merge.

Safe order:

```txt
Wave 1:
Agent 1

Wave 2:
Agent 2

Wave 3:
Agent 3

Wave 4:
Agent 4

Wave 5:
Agent 5
```

Parallel allowed only when files do not conflict.

---

## 7. Product Scope

MyProdusen Web App must include:

- employee management
- auto-generated NIP
- GPS attendance
- selfie attendance
- geo-tagging
- geo-fencing
- work location management
- shift management
- leave/sick/permission request
- KPI management
- superadmin dashboard
- employee dashboard
- reports/export
- audit log
- notification
- PostgreSQL
- Docker
- VPS + Coolify
- clean UI/UX
- WCAG-friendly accessibility

Do not add random features.

Phase 2 features must be documented before implementation.

---

## 8. Tech Stack

Use existing stack if already installed.

Recommended stack:

```txt
Next.js App Router
TypeScript
Tailwind CSS
Shadcn UI or internal reusable components
React Hook Form
Zod
Prisma ORM
PostgreSQL
Docker
VPS
Coolify
Persistent volume or S3-compatible storage
```

Do not introduce heavy dependencies without reason.

Before adding a package:
1. Check if existing package can solve it.
2. Check bundle/runtime impact.
3. Add only if useful.
4. Document why.

---

## 9. Engineering Rules

General rules:

1. Use TypeScript.
2. Keep code modular.
3. Keep files small.
4. Separate UI, validation, service, repository, and database logic.
5. Backend must enforce business rules.
6. Frontend-only validation is not enough.
7. Do not reset database.
8. Do not delete historical data.
9. Use soft delete/deactivation where needed.
10. Do not commit `.env`.
11. Do not commit secrets.
12. Use safe migrations.
13. Write tests for critical logic.
14. Run lint/typecheck/build before final response when available.

Suggested structure:

```txt
/src
  /app
  /components
  /features
    /auth
    /employees
    /attendance
    /work-locations
    /shifts
    /leave
    /kpi
    /dashboard
    /reports
    /notifications
    /audit
  /lib
  /server
    /services
    /repositories
    /validators
  /types
  /utils

/prisma
  schema.prisma
  migrations

/docs
  prd.md
  AGENTS.md
  IMPLEMENTATION_PLAN.md
  PARALLEL_AGENTS_PLAN.md
  FINAL_CHECKLIST.md
```

---

## 10. Auth & RBAC Rules

Required roles:

```txt
Superadmin
Admin HR
Supervisor
Employee / Karyawan
```

Backend authorization is mandatory.

Role behavior:

### Superadmin

Can:
- access all dashboards
- manage users
- manage roles
- manage employees
- manage attendance
- manage KPI
- manage reports
- manage settings
- view audit logs

### Admin HR

Can:
- manage employees
- manage shifts
- manage attendance
- manage leave
- manage reports
- manage KPI templates if allowed

### Supervisor

Can:
- view own team
- approve team leave
- input/review team KPI
- view team attendance

### Employee

Can:
- view own dashboard
- check-in/check-out
- view own attendance
- view own KPI
- submit leave/sick/permission

Rules:
1. Employee cannot access other employee data.
2. Supervisor cannot access other team data.
3. Admin HR cannot access Superadmin-only settings.
4. Inactive user cannot login.
5. All protected APIs must verify permission server-side.

---

## 11. Employee & NIP Rules

Every employee must have an auto-generated NIP.

Default format:

```txt
MPD-{YEAR}-{DIVISION_CODE}-{SEQUENCE}
```

Example:

```txt
MPD-2026-PRD-0001
MPD-2026-PCK-0002
MPD-2026-SLS-0003
```

Rules:

1. NIP is generated automatically.
2. NIP is unique.
3. NIP is never reused.
4. NIP stays stable after employee update.
5. Deactivated/resigned employee keeps old NIP.
6. NIP generation must be collision-safe.
7. NIP must be validated at database level.
8. NIP generation must have tests.

Employee delete rule:
- Do not hard delete employee with history.
- Use deactivate/soft delete.

---

## 12. Work Location & Geo-fencing Rules

Work location fields:

```txt
name
address
latitude
longitude
radiusMeters
status
```

Rules:

1. Only Superadmin/Admin HR can manage work locations.
2. Employee can be assigned to work location.
3. Backend calculates distance.
4. Do not trust frontend distance calculation.
5. Use Haversine or reliable distance calculation.
6. Store historical attendance location data.
7. Changing work location must not corrupt old attendance.
8. Work location changes must create audit log.

---

## 13. Attendance Rules

Attendance is critical.

Check-in requires:
- GPS permission
- latitude
- longitude
- GPS accuracy
- selfie
- active employee
- active shift
- active work location
- backend geo-fence validation

Check-out requires:
- GPS permission
- latitude
- longitude
- GPS accuracy
- selfie
- existing check-in
- backend geo-fence validation

Rules:

1. One employee can check in once per day.
2. Employee cannot check out before check in.
3. Employee cannot check out twice.
4. GPS disabled = reject.
5. Location permission denied = reject.
6. Selfie missing = reject.
7. Outside radius = reject or pending based on setting.
8. Store outside-radius attempt for audit.
9. Calculate late minutes.
10. Calculate early leave minutes.
11. Calculate total work minutes.
12. Manual adjustment requires reason.
13. Manual adjustment creates audit log.
14. Historical attendance must not be deleted.

Store attendance metadata:

```txt
checkInAt
checkOutAt
checkInLatitude
checkInLongitude
checkInAccuracy
checkOutLatitude
checkOutLongitude
checkOutAccuracy
checkInSelfieUrl
checkOutSelfieUrl
deviceInfo
ipAddress
userAgent
status
lateMinutes
earlyLeaveMinutes
totalWorkMinutes
```

---

## 14. File Upload Rules

Selfie and attachment upload must be secure.

Rules:

1. Validate MIME type.
2. Validate file size.
3. Do not trust original filename.
4. Generate safe filename.
5. Store in persistent storage.
6. Do not expose private files publicly.
7. Use signed/protected URLs when possible.
8. Uploaded selfies must survive deployment restart.
9. Production storage must work with VPS + Coolify.

---

## 15. Shift Rules

Shift fields:

```txt
name
startTime
endTime
lateToleranceMinutes
checkinOpenMinutesBefore
checkoutCloseMinutesAfter
status
```

Rules:

1. Employee can have assigned shift.
2. Attendance uses active shift.
3. Shift change does not corrupt historical attendance.
4. Historical attendance should keep shift reference or snapshot.

---

## 16. Leave / Sick / Permission Rules

Request types:

```txt
leave
sick
permission
```

Rules:

1. Employee can create own request.
2. Request starts as pending.
3. Supervisor/Admin HR can approve or reject.
4. Rejection requires reason.
5. Approved request affects attendance status.
6. Overlapping active request is rejected.
7. Approval/rejection creates notification.
8. Approval/rejection creates audit log.

---

## 17. KPI Rules

KPI must support:

- template
- template items
- assignment
- result
- scoring
- approval
- history

Scoring methods:

```txt
higher_is_better
lower_is_better
boolean
```

Rules:

1. KPI template total weight should be 100.
2. Supervisor can input/review own team KPI only.
3. Employee can view own KPI only.
4. Employee cannot edit own KPI score.
5. Approved KPI cannot be edited except by authorized role with reason.
6. KPI edit after approval creates audit log.
7. KPI scoring must have tests.

---

## 18. Dashboard Rules

Superadmin dashboard should show:

- total active employees
- attendance today
- late employees today
- leave/sick/permission today
- absent employees today
- average KPI this month
- top performers
- low performers
- attendance trend
- KPI by division
- geo-fence rejected/pending alerts
- employee risk alerts

Dashboard must support useful filters:

```txt
date range
division
position
work location
employee
attendance status
```

Rules:
1. Dashboard must respect permissions.
2. Dashboard must not leak data.
3. Dashboard query must be optimized.
4. UI must include loading, empty, error, and success states.

---

## 19. Reports & Export Rules

Required reports:

- daily attendance report
- monthly attendance report
- late report
- leave/sick/permission report
- KPI individual report
- KPI division report
- employee performance report
- geo-fence rejected/pending report

Export:

```txt
CSV required
Excel recommended
PDF optional
```

Rules:

1. Export respects filters.
2. Export respects permissions.
3. Supervisor exports team data only.
4. Employee exports own data only if allowed.
5. Export creates audit log.

---

## 20. Audit Log Rules

Sensitive actions must create audit log.

Audit events:

- login
- logout
- failed login if feasible
- user create/update/deactivate
- role/permission change
- employee create/update/deactivate
- NIP generation
- work location create/update/deactivate
- employee work location assignment
- shift create/update/deactivate
- attendance check-in
- attendance check-out
- rejected geo-fence attendance attempt
- pending geo-fence attendance attempt
- manual attendance adjustment
- leave approval/rejection
- KPI create/update/approval
- report export

Audit fields:

```txt
actorUserId
action
targetType
targetId
oldValueJson
newValueJson
ipAddress
userAgent
createdAt
```

Normal users must not delete audit logs.

---

## 21. Notification Rules

Create notifications for:

- leave request submitted
- leave approved
- leave rejected
- KPI assigned
- KPI approved
- attendance rejected/pending due to geo-fence
- manual attendance adjustment if needed

Rules:

1. User can view own notifications.
2. User can mark notification as read.
3. Admin/Superadmin receives important operational alerts.
4. Notification data is stored in database.

---

## 22. Database Rules

Use PostgreSQL for production.

Rules:

1. Use Prisma migrations.
2. Never reset production database.
3. Never run destructive migration without explicit approval.
4. Use indexes for dashboard/report fields.
5. Use soft delete/deactivation for historical data.
6. Add `createdAt` and `updatedAt`.
7. Add `deletedAt` only where soft delete is needed.

Important indexes:

```txt
Employee.nip
Employee.divisionId
Employee.status
Attendance.employeeId
Attendance.attendanceDate
Attendance.status
WorkLocation.status
KpiAssignment.employeeId
KpiAssignment.periodStart
KpiAssignment.periodEnd
KpiResult.employeeId
AuditLog.actorUserId
AuditLog.createdAt
```

---

## 23. VPS + Coolify Rules

Production target:

```txt
VPS
Coolify
Docker
PostgreSQL
Persistent storage
```

Required files:

```txt
Dockerfile
docker-compose.yml if useful
.env.example
/docs/DEPLOYMENT.md
/docs/COOLIFY.md
/docs/BACKUP_RESTORE.md
```

Required env documentation:

```env
DATABASE_URL=
AUTH_SECRET=
APP_URL=
NODE_ENV=production

STORAGE_DRIVER=local
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=

GPS_MAX_ACCURACY_METERS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100

SUPERADMIN_EMAIL=
SUPERADMIN_PASSWORD=
```

Rules:

1. Never commit real `.env`.
2. Configure production secrets in Coolify.
3. Uploaded files must use persistent volume or object storage.
4. Database backup must be documented.
5. Restore process must be documented.
6. Healthcheck endpoint is recommended.
7. App must build and run in Docker.

---

## 24. Testing Rules

Add tests for critical logic.

Required tests:

### NIP

- correct format
- unique NIP
- sequence increments
- division code included
- no reuse after deactivation

### Geo-fencing

- inside radius
- outside radius
- invalid coordinates
- bad GPS accuracy

### Attendance

- successful check-in
- reject double check-in
- reject check-out before check-in
- successful check-out
- reject double check-out
- late calculation
- early leave calculation

### RBAC

- employee cannot access superadmin dashboard/API
- supervisor cannot access other team data
- inactive user cannot login
- Admin HR cannot access Superadmin-only settings

### KPI

- higher_is_better score
- lower_is_better score
- boolean score
- total score
- approved KPI edit restriction

### Leave

- create request
- reject overlap
- approve request
- reject request requires reason

Run available checks before final response:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If a command does not exist, say so clearly.

---

## 25. Standard Error Response

Use consistent error response if backend pattern allows:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

Error codes:

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

---

## 26. Work Process

Before coding:

1. Read `/docs`.
2. Read this file.
3. Inspect repo.
4. Understand current stack.
5. Make a small plan.
6. Make targeted changes only.

During coding:

1. Keep scope tight.
2. Follow existing patterns.
3. Reuse components.
4. Add validation.
5. Add backend authorization.
6. Add audit log for sensitive actions.
7. Add tests for business logic.
8. Keep UI consistent.

After coding:

Return:

```txt
Summary
Files changed
Commands run
How to test
Risks / limitations
Next recommended task
```

---

## 27. Do Not Do

Do not:

- change logo without request
- change brand colors without request
- change UI tone without request
- create random docs outside `/docs`
- create random features outside PRD
- remove working features without reason
- reset database
- hard delete historical employee data
- hard delete attendance data
- hard delete KPI data
- expose private selfies publicly
- commit `.env`
- commit secrets
- skip backend authorization
- rely only on frontend validation
- create more than 5 agents

---

## 28. Final Rule

Build MyProdusen Web App like a professional internal company system.

Priority order:

1. Correct business logic
2. Security
3. Data integrity
4. Documentation alignment
5. Clean UI/UX
6. Maintainability
7. Scalability
8. Production readiness

When unsure:
1. Read `/docs`.
2. Follow existing style.
3. Keep scope small.
4. Ask for clarification only if truly blocked.
5. Do not guess.
