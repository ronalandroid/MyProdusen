# Production Readiness Plan — MyProdusen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete remaining MVP gaps to reach production-ready 10/10 score: security hardening, frontend wiring, testing, deployment automation.

**Architecture:** Surgical fixes across auth/middleware, frontend API integration, test coverage for critical paths, and deployment validation. No architectural rewrites.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Docker, Coolify.

---

## Phase 1: Security Hardening (Critical)

### Task 1: httpOnly Cookie Auth

**Files:**
- Modify: `app/api/auth/login/route.ts`
- Modify: `lib/auth.ts`
- Modify: `lib/middleware.ts`
- Modify: `app/login/page.tsx`

- [ ] Replace JWT localStorage with httpOnly cookie in login response.
- [ ] Add root middleware to verify cookie and attach user to request context.
- [ ] Remove localStorage token usage from `app/login/page.tsx`.
- [ ] Test login → dashboard flow with cookie-based auth.

### Task 2: Rate Limiting

**Files:**
- Modify: `app/api/auth/login/route.ts`
- Modify: `lib/rate-limit/index.ts`

- [ ] Add Redis-backed rate limiter (5 attempts per 15 min per IP).
- [ ] Return 429 with retry-after header on limit exceeded.
- [ ] Add rate limit bypass for test/dev environments.

### Task 3: Password Policy

**Files:**
- Modify: `lib/validations/auth.ts`
- Modify: `app/api/auth/register/route.ts`
- Modify: `app/api/auth/change-password/route.ts`

- [ ] Enforce min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special.
- [ ] Return clear validation errors to frontend.
- [ ] Update register and change-password flows.

### Task 4: Attendance Uniqueness

**Files:**
- Create: `drizzle/migrations/0003_attendance_unique_constraint.sql`
- Modify: `drizzle/schema.ts`

- [ ] Add unique constraint on (employeeId, date) for attendance.
- [ ] Generate migration with `drizzle-kit generate`.
- [ ] Test duplicate check-in rejection.

---

## Phase 2: Frontend Wiring

### Task 5: Employees Page

**Files:**
- Modify: `app/dashboard/employees/page.tsx`

- [ ] Wire GET /api/employees for list.
- [ ] Wire POST /api/employees for create.
- [ ] Wire PATCH /api/employees/[id] for edit.
- [ ] Add loading, error, empty states.

### Task 6: Leave Page

**Files:**
- Modify: `app/dashboard/leave/page.tsx`

- [ ] Wire GET /api/leave for list.
- [ ] Wire POST /api/leave for create request.
- [ ] Wire POST /api/leave/[id]/approve for supervisor approval.
- [ ] Add role-based UI (employee vs supervisor).

### Task 7: Attendance Page

**Files:**
- Modify: `app/dashboard/attendance/page.tsx`

- [ ] Wire geolocation + selfie upload to check-in/check-out.
- [ ] Add upload service for selfie storage (local or S3).
- [ ] Show today status and history list.
- [ ] Add geofence validation feedback.

### Task 8: KPI Page

**Files:**
- Modify: `app/dashboard/kpi/page.tsx`

- [ ] Wire GET /api/kpi/employee/[id] for employee view.
- [ ] Wire GET /api/kpi/results for supervisor view.
- [ ] Wire POST /api/kpi/results for scoring.
- [ ] Add role-based UI.

### Task 9: Reports Page

**Files:**
- Modify: `app/dashboard/reports/page.tsx`

- [ ] Wire GET /api/reports/attendance with date filters.
- [ ] Wire GET /api/reports/leave with status filters.
- [ ] Add CSV export download links.
- [ ] Add date range picker.

---

## Phase 3: Testing

### Task 10: Auth Tests

**Files:**
- Create: `tests/api/auth.integration.test.ts`

- [ ] Test login success with valid credentials.
- [ ] Test login failure with invalid credentials.
- [ ] Test rate limit after 5 failed attempts.
- [ ] Test password policy enforcement.

### Task 11: RBAC Tests

**Files:**
- Create: `tests/rbac/authorization.integration.test.ts`

- [ ] Test Karyawan cannot access Admin HR routes.
- [ ] Test Supervisor can approve leave for team only.
- [ ] Test Admin HR cannot create Superadmin.

### Task 12: Attendance Tests

**Files:**
- Create: `tests/api/attendance.integration.test.ts`

- [ ] Test check-in within geofence succeeds.
- [ ] Test check-in outside geofence fails.
- [ ] Test duplicate check-in same day fails.
- [ ] Test check-out before check-in fails.

### Task 13: Unit Tests

**Files:**
- Create: `tests/unit/geofencing.test.ts`
- Create: `tests/unit/kpi-scoring.test.ts`

- [ ] Test geofence distance calculation.
- [ ] Test KPI score aggregation logic.

---

## Phase 4: Deployment Automation

### Task 14: Migration Deploy

**Files:**
- Create: `scripts/migrate-deploy.sh`
- Modify: `Dockerfile`

- [ ] Add `drizzle-kit migrate` to Docker entrypoint.
- [ ] Add migration rollback script.
- [ ] Document migration workflow in `docs/DEPLOYMENT.md`.

### Task 15: Backup Automation

**Files:**
- Create: `scripts/backup-db.sh`
- Create: `scripts/restore-db.sh`

- [ ] Add pg_dump daily backup cron.
- [ ] Add S3/local backup retention (7 days).
- [ ] Document restore process.

### Task 16: Coolify Validation

**Files:**
- Modify: `docs/COOLIFY_DEPLOYMENT.md`

- [ ] Deploy to Coolify staging.
- [ ] Validate env vars, persistent volume, migrations.
- [ ] Test backup/restore on staging.
- [ ] Document production deploy checklist.

---

## Phase 5: Final Polish

### Task 17: Audit Log Integration

**Files:**
- Modify: `app/api/employees/route.ts`
- Modify: `app/api/leave/[id]/approve/route.ts`
- Modify: `features/audit/audit.service.ts`

- [ ] Add audit log writes for employee create/update/delete.
- [ ] Add audit log writes for leave approve/reject.
- [ ] Wire audit page to GET /api/audit.

### Task 18: Notification Stub

**Files:**
- Create: `features/notifications/notification.service.ts`
- Create: `app/api/notifications/route.ts`

- [ ] Add in-app notification model (user, message, read status).
- [ ] Add POST /api/notifications for create.
- [ ] Add GET /api/notifications for list.
- [ ] Wire bell icon in dashboard header.

### Task 19: Production Checklist

**Files:**
- Modify: `docs/PRODUCTION_CHECKLIST.md`

- [ ] Verify all env vars documented.
- [ ] Verify seed script not used in production.
- [ ] Verify HTTPS enforced.
- [ ] Verify CORS configured.
- [ ] Verify error logging enabled.

### Task 20: Final Verification

**Commands:**
- Run: `npm run lint`
- Run: `npm run build`
- Run: `npm test`
- Run: `docker build -t myprodusen:test .`
- Run: `docker compose up -d`

- [ ] All lint/build/test pass.
- [ ] Docker image builds successfully.
- [ ] Local Docker stack runs and serves app.
- [ ] Smoke test: login, check-in, leave request, report export.

