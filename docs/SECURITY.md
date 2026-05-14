# Security Guide

## Required Production Controls
- `JWT_SECRET` must exist and be at least 32 characters in production.
- `.env` must never be committed.
- Passwords must be hashed with bcrypt.
- Protected APIs must use backend authorization checks.
- Dashboard pages need server-side/session protection.
- Disabled users must lose access after auth revalidation.

## RBAC Rules
- Superadmin: full access.
- Admin HR: HR operations, but cannot create or promote Superadmin.
- Supervisor: team-only read/approval/input where applicable.
- Employee: own data only.

## Attendance Security
- Backend validates GPS radius, GPS accuracy, active employee, active location, and check-in/check-out state.
- Selfie uploads must be validated for MIME, size, extension, and storage path.
- Store durable file path, not raw unbounded base64 in production.
- Manual adjustment must require Admin HR/Superadmin and reason.

## Audit Requirements
- Write audit logs for login, employee changes, location/shift changes, attendance adjustment, leave approval/rejection, KPI changes, exports, and role changes.
- Audit logs are Superadmin-only.
- Never delete audit logs without retention policy approval.
