# AGENT.md — MyProdusen Web App

> **Important naming note:** This file is named `AGENT.md` based on the project request. For Codex auto-discovery, it is recommended to also copy or rename this file to `AGENTS.md` in the repository root.

---

## 1. Source of Truth

Always read these files before coding:

1. `prd.md`
2. `AGENT.md` or `AGENTS.md`

`prd.md` is the main source of truth for:

- Product requirements
- Business rules
- Technical requirements
- UI/UX direction
- Security requirements
- Deployment requirements
- Database requirements
- Testing requirements

Do not change product scope unless explicitly requested.

If the PRD and current code conflict, report the conflict first before making risky changes.

---

## 2. Project Identity

**Product name:** MyProdusen Web App  
**Client/business:** Produsen Dimsum Medan  
**Product type:** Internal company web application  
**Deployment target:** VPS + Coolify  
**Primary database:** PostgreSQL  

### Main Purpose

MyProdusen Web App is used to manage:

- Employee attendance
- GPS + selfie check-in/check-out
- Geo-tagging
- Geo-fencing
- Employee data
- Auto-generated NIP
- KPI management
- Shift management
- Leave, sick, and permission requests
- Reports
- Superadmin dashboard
- Audit logs
- Notifications
- Production-ready deployment on VPS + Coolify

---

## 3. Recommended Tech Stack

Use this stack unless the existing project already uses a different stack that should be preserved.

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn UI or clean reusable internal components
- React Hook Form
- Zod validation
- TanStack Query when useful
- Recharts or lightweight chart library for dashboard charts

### Backend

- Next.js API Routes / Server Actions, or existing backend convention
- TypeScript
- Prisma ORM
- PostgreSQL
- Service/repository pattern for complex business logic

### Database

- PostgreSQL for production
- Prisma migrations
- Safe migrations only
- Never reset production database
- SQLite only allowed for local temporary testing if already used by the project

### Deployment

- VPS
- Coolify
- Docker
- PostgreSQL service
- Persistent volume or S3-compatible storage for selfie uploads
- Healthcheck endpoint recommended

### Storage

Use one of these:

1. Local persistent volume for VPS/Coolify MVP
2. S3-compatible object storage for scalable production

Selfie attendance files must survive deployment restart.

---

## 4. UI/UX Rules

The UI must be:

- Clean
- Minimal
- Professional
- Responsive
- Easy for non-technical employees
- Suitable for internal business dashboard
- Accessible with WCAG 2.2 AA mindset

### Brand Colors

Use these colors consistently:

- Primary yellow: `#FDC704`
- Accent red: `#B51B19`
- Black: `#000000`
- Soft gray: `#E5E3E6`

### Color Usage

- Yellow is for brand accent and primary CTA.
- Red is for danger, rejection, critical alert, late status, and warning states.
- Black is for text and strong contrast.
- Soft gray is for backgrounds, borders, cards, and neutral surfaces.
- Do not overuse yellow or red.
- Always check contrast and readability.
- Avoid placing yellow text on white background if contrast is poor.
- Use black text on yellow buttons where appropriate.

### UI Components

Prefer reusable components:

- AppShell
- Sidebar
- Topbar
- PageHeader
- StatCard
- DataTable
- EmptyState
- LoadingState
- ErrorState
- ConfirmDialog
- StatusBadge
- FormField
- FilterBar
- ExportButton
- DateRangePicker
- RoleBadge
- AttendanceStatusBadge
- KpiScoreBadge

### Page State Rules

Every page must handle:

- Loading state
- Empty state
- Error state
- Success state
- Unauthorized state when needed

### Accessibility Rules

- Use semantic HTML.
- Use accessible labels for form fields.
- Ensure keyboard navigation works.
- Use visible focus states.
- Do not rely only on color to communicate status.
- Use icons plus labels for critical status.
- Dialogs/modals must be keyboard accessible.
- Tables must have clear headers.

---

## 5. Engineering Rules

Use professional, scalable, maintainable code.

### General Rules

- Use TypeScript.
- Keep code modular.
- Do not create huge files.
- Separate UI, validation, business logic, database access, and utilities.
- Do not hardcode business rules only in the frontend.
- Backend must enforce all important validation and permissions.
- Do not remove existing working features unless required.
- Do not make destructive database changes.
- Do not commit real secrets.
- Do not commit `.env`.
- Use environment variables for secrets and runtime config.
- Add tests for critical business rules.
- Keep implementation aligned with `prd.md`.

### Suggested Structure

```txt
/src
  /app
  /components
    /ui
    /layout
    /forms
    /tables
    /dashboard
  /features
    /auth
    /employees
    /attendance
    /work-locations
    /shifts
    /leave
    /kpi
    /reports
    /dashboard
    /notifications
    /audit
  /lib
    auth.ts
    db.ts
    permissions.ts
    validations.ts
    logger.ts
    errors.ts
  /server
    /services
    /repositories
    /validators
    /middlewares
  /types
  /utils
/prisma
  schema.prisma
  migrations
  seed.ts
/docs
  prd.md
/tests
  /unit
  /integration
  /e2e
```

If the existing project structure is different, preserve the project convention and adapt carefully.

---

## 6. Auth & RBAC Rules

Required roles:

1. Superadmin
2. Admin HR
3. Supervisor
4. Employee / Karyawan

### Access Rules

#### Superadmin

Can:

- Full access
- Manage users
- Manage roles
- Manage employees
- Manage KPI
- Manage attendance
- Manage work locations
- Manage shifts
- Manage leave requests
- Manage reports
- Manage system settings
- View audit logs

#### Admin HR

Can:

- Manage employees
- Manage attendance
- Manage shift
- Manage leave requests
- Manage reports
- Manage work locations if allowed by PRD
- Manage KPI templates if allowed by PRD

Cannot:

- Change Superadmin-only system settings unless explicitly allowed
- Delete audit logs

#### Supervisor

Can:

- View own team
- View team attendance
- Approve/reject team leave requests
- Input/review team KPI
- View team KPI reports

Cannot:

- Access unrelated teams
- Manage global system settings
- Access Superadmin dashboard

#### Employee / Karyawan

Can:

- View own dashboard
- Check-in/check-out
- View own attendance
- View own KPI
- Submit leave/sick/permission request
- View own notifications

Cannot:

- View other employees' private data
- Edit own KPI score
- Approve own leave request
- Access admin dashboard

### Security Rule

Frontend route hiding is not enough.

All protected APIs and server actions must check authorization on the backend.

---

## 7. Employee & NIP Rules

Every employee must have an auto-generated NIP.

### NIP Requirements

- NIP must be generated automatically.
- NIP must be unique.
- NIP must never be reused.
- NIP must remain stable even if employee data changes.
- Deactivated/resigned employees keep their NIP.
- NIP generation must be safe from collision.
- NIP format should be configurable for future growth.

### Default NIP Format

```txt
MPD-{YEAR}-{DIVISION_CODE}-{SEQUENCE}
```

Example:

```txt
MPD-2026-PRD-0001
MPD-2026-PCK-0002
MPD-2026-SLS-0003
```

### Example Division Codes

```txt
PRD = Produksi
PCK = Packing
GDG = Gudang
SLS = Sales
ADM = Admin
FIN = Finance
MKT = Marketing
HRD = HR
```

### NIP Service Rules

Create a dedicated NIP generation service.

The service must:

- Read current year
- Read division code
- Get next sequence safely
- Generate unique NIP
- Validate uniqueness at database level
- Avoid race condition where possible
- Include tests

### Employee Business Rules

- Only Superadmin/Admin HR can create employees.
- Employee can only view own profile.
- Supervisor can view assigned team only.
- Deactivated employees must not be hard deleted.
- Historical attendance, KPI, and leave data must remain available.
- Employee status should support active, inactive, probation, contract, permanent, resigned.

---

## 8. Attendance Rules

Attendance is a critical module.

### Required Attendance Features

Check-in requires:

- GPS permission
- Latitude
- Longitude
- GPS accuracy
- Selfie
- Valid work location
- Backend geo-fence validation

Check-out requires:

- GPS permission
- Latitude
- Longitude
- GPS accuracy
- Selfie
- Valid work location
- Backend geo-fence validation

### Geo-tagging / Geo-fencing Rules

- Work location must have latitude and longitude.
- Work location must have radius in meters.
- Backend must calculate distance between user location and work location.
- Do not trust frontend distance calculation.
- If GPS is disabled, attendance must fail.
- If location permission is denied, attendance must fail.
- If selfie is missing, attendance must fail.
- If location is outside allowed radius, attendance must be rejected or marked pending based on system setting.
- Store outside-radius attempts for audit.

### Recommended Defaults

```txt
DEFAULT_GEOFENCE_RADIUS_METERS=100
GPS_MAX_ACCURACY_METERS=100
```

These defaults can be changed through environment variables or system settings.

### Attendance Business Rules

- One employee can only check in once per day.
- Employee cannot check out before check in.
- Employee cannot check out twice.
- Late status is calculated from shift start time and tolerance.
- Early leave is calculated from shift end time.
- Total work minutes must be calculated.
- Manual adjustment requires reason.
- Manual adjustment must create audit log.
- Historical attendance data must not be deleted.

### Attendance Data to Store

Store these fields when available:

- Check-in timestamp
- Check-out timestamp
- Check-in latitude
- Check-in longitude
- Check-in GPS accuracy
- Check-out latitude
- Check-out longitude
- Check-out GPS accuracy
- Check-in selfie URL
- Check-out selfie URL
- Device info
- IP address
- User agent
- Attendance status
- Late minutes
- Early leave minutes
- Total work minutes
- Check-in method
- Check-out method
- Work location reference

---

## 9. Work Location Rules

Work location is used for geo-fencing.

### Required Fields

- Name
- Address
- Latitude
- Longitude
- Radius in meters
- Status

### Rules

- Only Superadmin/Admin HR can manage work locations.
- Work locations can be assigned to employees.
- Work location changes must not corrupt historical attendance.
- Historical attendance should keep location metadata at the time of attendance.
- All work location create/update/deactivate actions must be audited.

### Geo-fencing Calculation

Use Haversine formula or a reliable geospatial calculation to calculate distance between:

1. Employee current GPS coordinate
2. Assigned work location coordinate

Backend must determine whether the employee is inside or outside radius.

---

## 10. Shift Rules

Shift must support:

- Name
- Start time
- End time
- Late tolerance minutes
- Check-in open minutes before shift
- Check-out close minutes after shift
- Status

### Rules

- Employee can have assigned shift.
- Attendance calculation must use active shift.
- Shift changes must not corrupt historical attendance.
- Historical attendance should keep shift reference or shift snapshot where needed.
- Admin HR/Superadmin can manage shift.

---

## 11. Leave / Sick / Permission Rules

Employees can submit:

- Leave request
- Sick request
- Permission request

### Required Fields

- Type
- Start date
- End date
- Reason
- Attachment optional
- Status
- Approved by
- Approved at
- Rejection reason when rejected

### Rules

- Request starts as pending.
- Supervisor/Admin HR can approve or reject.
- Rejection requires reason.
- Approved request affects attendance status.
- Overlapping active requests must be rejected.
- Approval/rejection must create notification.
- Approval/rejection must create audit log.
- Employee cannot approve own request.

---

## 12. KPI Rules

KPI module must support:

- KPI template
- KPI template item
- KPI assignment
- KPI result
- KPI approval
- KPI history

### KPI Template Fields

- Name
- Division
- Position
- Period type
- Status
- Created by

### KPI Item Fields

- Name
- Description
- Target value
- Actual value
- Unit
- Weight
- Scoring method
- Notes
- Order index

### Scoring Methods

Supported scoring methods:

```txt
higher_is_better
lower_is_better
boolean
```

### KPI Scoring Rules

For `higher_is_better`:

```txt
score = min((actual / target) * weight, weight)
```

For `lower_is_better`:

```txt
score = min((target / actual) * weight, weight)
```

For `boolean`:

```txt
score = actual == target ? weight : 0
```

### KPI Business Rules

- KPI template total weight should ideally equal 100.
- Supervisor can input/review KPI for own team only.
- Employee can view own KPI only.
- Employee cannot edit own KPI score.
- Approved KPI cannot be edited except by authorized role with reason.
- KPI edit after approval must create audit log.

---

## 13. Dashboard Rules

### Superadmin Dashboard

Must show:

- Total active employees
- Attendance today
- Late employees today
- Leave/sick/permission today
- Absent employees today
- Average KPI this month
- Top performers
- Low performers
- Attendance trend
- KPI by division
- Geo-fence rejected/pending alerts
- Employee risk alerts

### Employee Dashboard

Must show:

- Today attendance status
- Check-in/check-out button
- Current shift
- Own attendance history
- Own KPI summary
- Own leave request status
- Notifications

### Supervisor Dashboard

Must show:

- Team attendance today
- Team late employees
- Pending leave approvals
- Team KPI status
- Team low performer alerts

### Admin HR Dashboard

Must show:

- Employee summary
- Attendance summary
- Leave summary
- Shift summary
- Reports shortcut

### Filters

Support filters where useful:

- Date range
- Division
- Position
- Work location
- Employee
- Attendance status

Dashboard queries must be optimized and must not expose unauthorized data.

---

## 14. Report & Export Rules

Required reports:

- Daily attendance report
- Monthly attendance report
- Late report
- Leave/sick/permission report
- KPI individual report
- KPI division report
- Employee performance report
- Geo-fence rejected/pending report

### Export

- CSV required
- Excel recommended
- PDF optional

### Rules

- Export must respect filters.
- Export must respect user permissions.
- Supervisor can only export team data.
- Employee can only view/export own data if allowed.
- Every export action must create audit log.

---

## 15. Audit Log Rules

All sensitive actions must create audit log.

### Audit Events

Record:

- Login
- Logout
- Failed login if feasible
- User create/update/deactivate
- Role or permission change
- Employee create/update/deactivate
- NIP generation
- Work location create/update/deactivate
- Employee work location assignment
- Shift create/update/deactivate
- Attendance check-in
- Attendance check-out
- Rejected geo-fence attendance attempt
- Pending geo-fence attendance attempt
- Manual attendance adjustment
- Leave request approval/rejection
- KPI create/update/approval
- Report export

### Audit Fields

Use:

- actorUserId
- action
- targetType
- targetId
- oldValueJson
- newValueJson
- ipAddress
- userAgent
- createdAt

Normal users must not be able to delete audit logs.

---

## 16. Notification Rules

Create notifications for:

- Leave request submitted
- Leave approved
- Leave rejected
- KPI assigned
- KPI approved
- Attendance rejected/pending due to geo-fence
- Manual attendance adjustment if needed

### Rules

- User can view own notifications.
- User can mark notification as read.
- Admin/Superadmin can receive important operational alerts.
- Notification data must be stored in database.

---

## 17. File Upload Rules

Selfie attendance and attachments must be handled securely.

### Rules

- Validate file type.
- Validate file size.
- Do not trust original filename.
- Generate safe filename.
- Store in persistent volume or S3-compatible storage.
- Do not expose private employee files publicly.
- Use signed/protected URLs if object storage supports it.
- Uploaded selfie must survive deployment restart.

### Allowed File Types

For selfie attendance:

```txt
image/jpeg
image/png
image/webp
```

For leave/sick attachments:

```txt
image/jpeg
image/png
image/webp
application/pdf
```

---

## 18. Database Rules

Use PostgreSQL for production.

### General Rules

- Use Prisma migrations.
- Never reset production DB.
- Never run destructive migration without explicit approval.
- Use indexes for dashboard/report-heavy fields.
- Use soft delete/deactivation for employee/user historical data.
- Keep `createdAt` and `updatedAt` fields.
- Add `deletedAt` only where soft delete is needed.
- Use unique constraints for critical unique data like NIP and email.

### Important Indexes

Add indexes for:

- Employee NIP
- Employee division
- Employee status
- Attendance employeeId
- Attendance date
- Attendance status
- WorkLocation status
- KpiAssignment employeeId
- KpiAssignment periodStart
- KpiAssignment periodEnd
- KpiResult employeeId
- AuditLog actorUserId
- AuditLog createdAt

### Recommended Core Models

Implement or align with these models where applicable:

1. User
2. Role
3. Permission
4. RolePermission
5. Employee
6. Division
7. Position
8. WorkLocation
9. EmployeeWorkLocation
10. Shift
11. EmployeeShift
12. Attendance
13. AttendanceAdjustment
14. LeaveRequest
15. KpiTemplate
16. KpiTemplateItem
17. KpiAssignment
18. KpiResult
19. KpiResultItem
20. Notification
21. AuditLog
22. AppSetting

---

## 19. VPS + Coolify Deployment Rules

Production target:

- VPS
- Coolify
- Docker
- PostgreSQL
- Persistent storage

### Required Files

Add or update:

- `Dockerfile`
- `docker-compose.yml` if useful
- `.env.example`
- deployment guide
- backup/restore guide

### Required Environment Variables

Document these in `.env.example`:

```env
DATABASE_URL=
AUTH_SECRET=
APP_URL=
NODE_ENV=production

STORAGE_DRIVER=local
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=5242880

GPS_MAX_ACCURACY_METERS=100
DEFAULT_GEOFENCE_RADIUS_METERS=100

SUPERADMIN_EMAIL=
SUPERADMIN_PASSWORD=
```

### Deployment Rules

- Never commit real `.env`.
- Production secrets must be configured in Coolify.
- Uploaded selfie files must use persistent storage.
- Database backups must be documented.
- Healthcheck endpoint is recommended.
- App must build and run in Docker.
- Migrations must be safe.
- Do not run `prisma migrate reset` in production.

### Backup Recommendation

Document PostgreSQL backup using:

```bash
pg_dump
```

Document restore using:

```bash
pg_restore
```

Or SQL restore depending on backup format.

---

## 20. Testing Rules

Add tests for critical business logic.

### Required Tests

#### NIP

- Generates correct format
- Generates unique NIP
- Sequence increments
- Division code included
- NIP not reused after deactivation

#### Geo-fencing

- Inside radius
- Outside radius
- Invalid coordinates
- Bad GPS accuracy

#### Attendance

- Successful check-in
- Reject double check-in
- Reject check-out before check-in
- Successful check-out
- Reject double check-out
- Late calculation
- Early leave calculation

#### RBAC

- Employee cannot access superadmin dashboard/API
- Supervisor cannot access other team data
- Inactive user cannot login
- Admin HR cannot access Superadmin-only settings

#### KPI

- `higher_is_better` score
- `lower_is_better` score
- `boolean` score
- Total score
- Approved KPI edit restriction

#### Leave

- Create request
- Reject overlap
- Approve request
- Reject request requires reason

### Required Checks Before Final Response

Run available checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If some commands do not exist, explain clearly.

---

## 21. Parallel Agent Workflow

Codex may use subagents only when explicitly requested by the user. When using subagents, keep each task small, isolated, and easy to review.

### Wave 1 — Foundation

#### Agent 1 — Foundation Architect

Responsibilities:

- Repo analysis
- Architecture
- Folder structure
- Shared utilities
- AGENT.md / AGENTS.md alignment
- Error handling pattern
- Documentation alignment

#### Agent 2 — Database Engineer

Responsibilities:

- Prisma schema
- Database models
- Indexes
- Seeds
- Safe migrations
- PostgreSQL readiness

#### Agent 3 — UI/UX Engineer

Responsibilities:

- UI theme
- Layout
- Reusable components
- WCAG-friendly design system
- Dashboard shell

### Wave 2 — Core System

#### Agent 4 — Auth & RBAC Engineer

Responsibilities:

- Login/logout/session
- Password hashing
- Role and permission guard
- Backend authorization
- Frontend route protection

#### Agent 5 — Employee & NIP Engineer

Responsibilities:

- Employee CRUD
- NIP generator
- Division/position relation
- Supervisor relation
- Employee deactivation

#### Agent 6 — Work Location & Geo-fencing Engineer

Responsibilities:

- Work location CRUD
- Employee location assignment
- Distance calculation
- Radius validation
- GPS accuracy validation

### Wave 3 — Business Features

#### Agent 7 — Attendance Engineer

Responsibilities:

- GPS + selfie check-in
- GPS + selfie check-out
- Geo-fence validation
- Attendance history
- Manual attendance adjustment

#### Agent 8 — Shift & Leave Engineer

Responsibilities:

- Shift management
- Employee shift assignment
- Leave/sick/permission workflow
- Approval/rejection
- Leave notifications

#### Agent 9 — KPI Engineer

Responsibilities:

- KPI template
- KPI assignment
- KPI result
- KPI scoring
- KPI approval
- KPI history

### Wave 4 — Monitoring & Reporting

#### Agent 10 — Dashboard Engineer

Responsibilities:

- Superadmin dashboard
- Employee dashboard
- HR dashboard
- Supervisor dashboard
- Dashboard filters

#### Agent 11 — Reports Engineer

Responsibilities:

- Attendance reports
- KPI reports
- Geo-fence reports
- CSV/Excel export
- Export audit log

#### Agent 12 — Audit & Notification Engineer

Responsibilities:

- Audit log service
- Notification service
- Notification UI
- Mark as read

### Wave 5 — Production

#### Agent 13 — QA Engineer

Responsibilities:

- Unit tests
- Integration tests
- Business rule tests
- Regression tests

#### Agent 14 — DevOps Engineer

Responsibilities:

- Dockerfile
- Docker Compose
- Coolify deployment
- `.env.example`
- Backup/restore docs

#### Agent 15 — Final Reviewer

Responsibilities:

- Security review
- PRD alignment review
- UI/UX review
- Database review
- Deployment review
- MVP readiness check

---

## 22. How Agents Must Work

### Before Coding

1. Read `prd.md`.
2. Read `AGENT.md` or `AGENTS.md`.
3. Inspect existing files.
4. Understand current stack.
5. Make minimal targeted changes.
6. Avoid unrelated changes.

### During Coding

1. Keep changes scoped.
2. Reuse existing patterns.
3. Add validation.
4. Add backend permission checks.
5. Add audit logs for sensitive actions.
6. Add tests for business logic.
7. Keep UI consistent.
8. Keep database migrations safe.

### After Coding

Return:

1. Summary
2. Files changed
3. Commands run
4. How to test
5. Risks or limitations
6. Suggested next task

---

## 23. Standard Error Response

Use consistent error responses where backend/API pattern allows:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

Example error codes:

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

## 24. Standard Success Response

Use consistent success responses where backend/API pattern allows:

```json
{
  "success": true,
  "data": {}
}
```

For list responses:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 25. Recommended Agent Prompts

Use these prompts when creating tasks for Codex agents.

---

### Prompt: Coordinator

```txt
You are a senior fullstack software engineer, technical architect, UI/UX designer, and security-focused developer.

Project name: MyProdusen Web App.

Your main source of truth is prd.md and AGENT.md/AGENTS.md in the repository root. Read them first before making any code changes.

Goal:
Build a professional, scalable web app for Produsen Dimsum Medan called MyProdusen Web App. The app manages employee KPI, attendance, GPS + selfie check-in/check-out, geo-tagging, geo-fencing, employee data, NIP auto-generation, leave requests, reports, and a superadmin dashboard.

Important:
- Do not invent features outside prd.md unless they are clearly marked as professional recommendation and do not break MVP scope.
- Do not remove any existing working feature unless required and explained.
- Do not reset or destroy database data.
- Always use safe migrations.
- All critical business rules must be enforced on the backend, not only frontend.
- Use clean, maintainable, scalable architecture.
- Prioritize MVP first.

First task:
1. Inspect the repository structure.
2. Read prd.md.
3. Read AGENT.md or AGENTS.md.
4. Identify the current stack and existing files.
5. Create a step-by-step implementation plan.
6. Break the work into independent tasks suitable for parallel Codex agents.
7. Do not implement all modules at once in this first task.
8. Output:
   - Current repo analysis
   - Recommended architecture
   - Parallel task list
   - Risks
   - Exact commands to install/run/test/build
```

---

### Prompt: Wave 1 Foundation

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Start Wave 1 foundation for MyProdusen Web App.

Responsibilities:
1. Analyze repository structure.
2. Confirm current tech stack.
3. Prepare scalable folder structure.
4. Add shared utilities if needed.
5. Add standard response/error patterns if backend exists.
6. Do not implement all business features yet.

Return:
- Summary
- Files changed
- Commands run
- How to test
- Risks/limitations
- Next recommended task
```

---

### Prompt: Database

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement PostgreSQL-ready Prisma schema for MyProdusen Web App.

Required:
- User, Role, Permission, RolePermission
- Employee, Division, Position
- WorkLocation, EmployeeWorkLocation
- Shift, EmployeeShift
- Attendance, AttendanceAdjustment
- LeaveRequest
- KpiTemplate, KpiTemplateItem, KpiAssignment, KpiResult, KpiResultItem
- Notification
- AuditLog
- AppSetting if needed

Rules:
- Employee NIP must be unique.
- Attendance must store GPS and selfie fields.
- WorkLocation must support geo-fencing.
- Use safe migrations only.
- Never reset production database.
- Add indexes for reports/dashboard.

Run available checks and return summary.
```

---

### Prompt: UI Foundation

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Build UI foundation for MyProdusen Web App.

Use theme colors:
- #FDC704
- #B51B19
- #000000
- #E5E3E6

Requirements:
- Clean minimal dashboard
- WCAG 2.2 AA mindset
- Reusable components
- Responsive layout
- Loading, empty, error, success states

Return files changed, commands run, and how to test.
```

---

### Prompt: Auth & RBAC

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement secure auth and RBAC.

Roles:
- Superadmin
- Admin HR
- Supervisor
- Employee

Rules:
- Backend must enforce permission.
- Inactive user cannot login.
- Add audit logs for sensitive auth actions.
- Add tests for permission checks.

Return summary, files changed, commands run, and how to test each role.
```

---

### Prompt: Employee + NIP

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement employee management and NIP generator.

NIP format:
MPD-{YEAR}-{DIVISION_CODE}-{SEQUENCE}

Rules:
- NIP is unique.
- NIP is automatic.
- NIP is never reused.
- Employee deactivation must not delete historical data.
- Add tests for NIP generation.
- Add audit logs for employee changes.

Return summary, NIP strategy, files changed, commands run, and how to test.
```

---

### Prompt: Work Location + Geo-fencing

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement work location and geo-fencing module.

Required:
- WorkLocation CRUD
- Employee location assignment
- Haversine/distance calculation
- Radius validation
- GPS accuracy validation

Rules:
- Backend must validate geo-fence.
- Work location changes must not corrupt historical attendance.
- Add audit logs.
- Add tests for inside/outside radius.

Return summary, files changed, commands run, and how to test.
```

---

### Prompt: GPS + Selfie Attendance

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement GPS + selfie check-in/check-out attendance.

Required:
- GPS required
- Selfie required
- Backend geo-fence validation
- Store latitude, longitude, accuracy, selfie URL, device info, timestamp
- Prevent double check-in
- Prevent check-out before check-in
- Prevent double check-out
- Calculate late minutes
- Calculate early leave
- Calculate total work minutes
- Manual adjustment requires reason and audit log

Security:
- Do not trust frontend location calculation.
- Validate upload file type and size.
- Store selfie securely.

Return summary, files changed, commands run, and how to test with mocked GPS.
```

---

### Prompt: Shift + Leave

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement shift management and leave/sick/permission workflow.

Rules:
- Shift changes must not corrupt historical attendance.
- Leave request starts pending.
- Approval/rejection must create notification.
- Rejection requires reason.
- Overlap requests must be rejected.
- Approval/rejection must create audit log.

Return summary, files changed, commands run, and how to test.
```

---

### Prompt: KPI

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement KPI management.

Required:
- KPI template
- KPI item
- KPI assignment
- KPI result
- KPI scoring
- KPI approval

Scoring:
- higher_is_better
- lower_is_better
- boolean

Rules:
- Employee cannot edit own KPI.
- Supervisor can only review team KPI.
- Approved KPI cannot be edited except by authorized role with reason.
- Add tests for KPI scoring.
- Add audit logs.

Return summary, files changed, commands run, and how to test.
```

---

### Prompt: Dashboard

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Build dashboards for MyProdusen Web App.

Required:
- Superadmin dashboard
- Employee dashboard
- HR dashboard
- Supervisor dashboard

Superadmin widgets:
- Total active employees
- Attendance today
- Late employees today
- Leave/sick/permission today
- Absent employees today
- Average KPI this month
- Top performers
- Low performers
- Attendance trend
- KPI by division
- Geo-fence rejected/pending alerts

Rules:
- Respect permissions.
- Optimize queries.
- Include loading, empty, error, and success states.

Return summary, files changed, commands run, and how to test.
```

---

### Prompt: Reports

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement reports and export.

Reports:
- Daily attendance
- Monthly attendance
- Late report
- Leave/sick/permission
- KPI individual
- KPI division
- Employee performance
- Geo-fence rejected/pending

Rules:
- Export must respect filters.
- Export must respect permissions.
- Export action must create audit log.
- CSV required.
- Excel recommended.

Return summary, files changed, commands run, and how to test.
```

---

### Prompt: Audit + Notification

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Implement audit log and notification system.

Rules:
- Sensitive actions must create audit log.
- Users can view own notifications.
- Users can mark notifications as read.
- Superadmin can view audit logs.
- Normal users cannot delete audit logs.

Return summary, files changed, commands run, and how to test.
```

---

### Prompt: DevOps VPS + Coolify

```txt
Read prd.md and AGENT.md/AGENTS.md first.

Task:
Prepare deployment for VPS + Coolify.

Required:
- Dockerfile
- docker-compose.yml if useful
- .env.example
- Healthcheck endpoint if missing
- PostgreSQL configuration
- Persistent upload storage
- Backup/restore guide
- Coolify deployment guide

Rules:
- Never commit real secrets.
- Selfie upload storage must persist after redeploy.
- Database migration must be safe.

Return summary, deployment steps, environment variables, files changed, commands run, and risks.
```

---

### Prompt: Final Review

```txt
Read prd.md, AGENT.md/AGENTS.md, and all changed files.

Task:
Perform final review for MyProdusen Web App.

Review:
- PRD alignment
- Auth/RBAC
- Employee/NIP
- GPS + selfie attendance
- Geo-fencing
- KPI scoring
- Leave workflow
- Audit coverage
- Reports/export
- UI/UX
- Accessibility
- Database indexes
- VPS + Coolify readiness
- Security
- Tests

Return:
- Executive summary
- Critical issues fixed
- Critical issues still open
- Security findings
- UX findings
- Database findings
- Deployment findings
- Test results
- MVP readiness recommendation
```

---

## 26. Final Rule

Build MyProdusen Web App like a professional internal company system.

Prioritize:

1. Correct business logic
2. Security
3. Data integrity
4. Clean UI/UX
5. Maintainability
6. Scalability
7. Production readiness

Do not rush features that can break attendance, payroll-related data, KPI score, or employee records.
