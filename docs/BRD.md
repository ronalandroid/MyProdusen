# BRD — MyProdusen

**Project:** MyProdusen Employee Management System  
**Client:** Produsen Dimsum Medan  
**Status:** Active  
**Last Updated:** 2026-05-15

## 1. Business Goal

MyProdusen replaces manual attendance, KPI, leave, and HR reporting with one secure web app.

Main goals:
- Reduce fake/manual attendance.
- Speed up HR reports.
- Give management real-time visibility.
- Track employee KPI fairly.
- Keep audit trail for important actions.

## 2. Users

| User | Needs |
|---|---|
| Superadmin / Owner | Global dashboard, reports, audit, full control |
| Admin HR | Manage employees, shifts, locations, attendance, leave |
| Supervisor | Monitor team, approve leave, input KPI |
| Employee | Check-in/out, request leave, view personal KPI |

## 3. Business Requirements

### Authentication & Access
- Users login securely.
- Roles control visible pages and backend permissions.
- Inactive users cannot login.
- Superadmin has full access.

### Employee Management
- HR can create and update employee profiles.
- Employees have NIP, role, supervisor, shift, and work location.
- Employee data is deactivated, not hard deleted.

### Attendance
- Employee can check-in and check-out with GPS and selfie.
- Backend validates geofence radius and GPS accuracy.
- System prevents duplicate daily check-in.
- Offline attendance is stored locally and synced later.

### Work Location & Shift
- HR manages work locations and geofence radius.
- HR manages shift start/end times.
- Attendance uses assigned location and shift.

### Leave
- Employee can submit leave/sick/permission request.
- Supervisor/Admin HR can approve or reject.
- Offline leave requests are queued and synced later.

### KPI
- HR/Superadmin creates KPI templates.
- Supervisor inputs KPI results for team.
- Employees can view personal KPI.

### Reports & Dashboard
- Dashboard shows attendance, employee, leave, and KPI summary.
- Reports can be filtered and exported.
- Repeat reads should use cache to reduce database load.

### Audit & Compliance
- Important actions create audit logs.
- Manual attendance adjustment requires reason.
- Audit logs help resolve disputes.

## 4. Offline/Online Requirement

The app must support unstable internet:
- Critical user actions are saved to IndexedDB first.
- Pending operations are synced when online.
- Conflicts are detected and resolved by rule or manual review.
- No pending offline data should be silently deleted.

## 5. Performance Requirement

The app must survive many users accessing together:
- Redis cache repeat reads.
- Redis rate limiting protects auth/API endpoints.
- Retry uses exponential backoff with jitter.
- Circuit breaker prevents cascading failures.

## 6. Success Criteria

- Attendance works with GPS + selfie.
- Leave approval workflow works.
- KPI workflow works.
- Reports and dashboard use real data.
- Offline attendance/leave can sync online.
- TypeScript build passes.
- Critical security is backend-enforced.

## 7. Out of Scope for MVP

- Face recognition.
- Liveness detection.
- WhatsApp notification.
- Payroll integration.
- Native mobile app.
- Multi-tenant SaaS.
