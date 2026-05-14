# Current State — MyProdusen

Last updated: 2026-05-15.

## Verified Status
- Project builds after TypeScript fixes.
- `npm run lint` now runs `tsc --noEmit` as a typecheck gate.
- Prisma schema targets PostgreSQL and validates.
- API routes exist for auth, employees, attendance, work locations, shifts, and leave.
- Dashboard pages exist but are mostly static/mock UI and not fully wired to APIs.
- No automated test suite exists yet.
- Docker/Coolify foundation now exists but needs production validation.

## Implemented API Routes
- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/profile`
- `POST /api/auth/change-password`
- `GET/POST /api/employees`
- `GET/PATCH/DELETE /api/employees/[id]`
- `GET/POST /api/work-locations`
- `GET/PATCH/DELETE /api/work-locations/[id]`
- `GET/POST /api/shifts`
- `GET/PATCH/DELETE /api/shifts/[id]`
- `GET /api/attendance`
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET/POST /api/leave`
- `GET/PATCH/DELETE /api/leave/[id]`
- `POST /api/leave/[id]/approve`
- `POST /api/leave/[id]/reject`

## Missing or Partial Backend
- KPI API routes and service are missing.
- Report/export API routes are missing.
- Audit log write service and audit API are missing.
- Notification API/service is missing.
- Payroll backend is not in MVP backend scope yet.
- `/api/attendance/today` is documented historically but not implemented.
- Attendance manual adjustment service exists but has no API route.

## Security Gaps
- `requireAuth` verifies JWT but does not refresh role/isActive from database yet.
- Dashboard pages do not have root Next middleware protection yet.
- Supervisor row-level scoping needs hardening for employees, attendance, and leave.
- Register role hierarchy must prevent Admin HR from creating Superadmin.
- Login rate limiting is not implemented.
- Password policy is still weak.
- Selfie upload validation and durable storage path are not production-ready.

## Database Gaps
- `prisma/migrations` should be generated and committed before production deploy.
- Attendance needs a DB-level uniqueness strategy for one check-in per employee per day.
- Soft-delete/history requirements need consistent modeling across entities.
- Seed script contains demo credentials and must not be used as production bootstrap.

## Frontend Gaps
- Login page currently needs full API/token/session integration.
- Dashboard, employees, attendance, leave, KPI, reports, audit, payroll, and profile pages need real data wiring.
- Attendance page needs browser geolocation, camera/selfie capture, current status, and history integration.
- UI must keep WCAG-friendly contrast and avoid overusing yellow/red.

## Deployment Gaps
- Dockerfile and compose exist for baseline local/Coolify testing.
- Coolify env vars, persistent upload volume, migrations, backup/restore, and rollback still need real server validation.
