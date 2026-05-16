# Implementation Plan — MyProdusen

## Phase 1 — Stabilize Foundation
- Keep `npm run lint` and `npm run build` green.
- Commit root `AGENTS.md` and current-state docs.
- Generate and commit Prisma initial migration.
- Add health check and Docker baseline validation.

## Phase 2 — Auth + RBAC Hardening
- Remove production JWT fallback and require strong `JWT_SECRET`.
- Update auth middleware to fetch active user/role from database.
- Add root middleware for `/dashboard` protection.
- Enforce role hierarchy during user creation.
- Add login rate limiting and stronger password policy.

## Phase 3 — Database Safety
- Add attendance date uniqueness strategy.
- Add safe migration workflow docs.
- Split dev seed from production bootstrap.
- Add audit log service and write calls for mutations.

## Phase 4 — Core Feature Wiring
- Upgrade interim localStorage login token to safer httpOnly cookie/session when server middleware is added.
- Wire employee, location, shift, and leave pages to APIs.
- Continue row-level scoping hardening for remaining routes and add integration tests.

## Phase 5 — Attendance Production Flow
- Improve geolocation permission UX and user guidance.
- Add camera/selfie capture and validated upload storage.
- Add manual adjustment route and complete attendance UI edge states.
- Validate employee location/shift assignment before attendance.

## Phase 6 — KPI + Reports
- Add KPI service and `/api/kpi/*` routes.
- Add dashboard aggregation endpoints.
- Add CSV/Excel export endpoints for attendance, leave, KPI, and employee reports.

## Phase 7 — Notification + Audit UI
- Add notification service/API and unread/read status.
- Add audit log API and Superadmin audit page integration.
- Add retention policy docs.

## Phase 8 — Testing
- Unit tests: geofencing, date rules, NIP, permissions, KPI scoring.
- Integration tests: auth, RBAC, attendance geofence, leave approvals.
- Build gate: typecheck, test, build.

## Phase 9 — Docker + Coolify Release
- Validate Docker image locally.
- Configure Coolify envs and persistent `/app/uploads` volume.
- Run `prisma migrate deploy` in release process.
- Add backup/restore schedule.
- Final security and demo checklist.

## Realtime Selfie Attendance Update

- Replace manual file/gallery selfie flow with `navigator.mediaDevices.getUserMedia()` realtime camera capture.
- Submit attendance with `FormData` containing GPS fields and selfie blob.
- Validate selfie on backend before check-in/check-out.
- Store protected selfie URL/path and upload timestamp on attendance rows.
- Serve selfie proof only through authenticated/authorized API route.
