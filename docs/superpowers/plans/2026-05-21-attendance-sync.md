# Attendance Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Wave 2 attendance modules consistently synced across UI, API, service, Drizzle, PostgreSQL, protected selfie access, geo-fence checks, audit logging, and docs.

**Architecture:** Keep attendance decision logic in backend services and route handlers. Add only additive indexes or safe metadata helpers where audit finds gaps. Frontend may show GPS/selfie status but must not decide attendance validity.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Vitest.

---

## Files

- Inspect/modify: `drizzle/schema.ts`, `drizzle/migrations/*attendance*.sql`.
- Inspect/modify: `src/services/attendance/attendance.service.ts`.
- Inspect/modify: `app/api/attendance/*/route.ts`, `app/api/attendances/[attendanceId]/selfie/*/route.ts`.
- Inspect/modify: `app/dashboard/attendance/page.tsx`, `app/dashboard/attendance/exceptions/page.tsx`, `app/dashboard/reports/attendance/page.tsx`.
- Add tests only for discovered behavior gaps.
- Update docs: `docs/database/README.md`, `docs/security/README.md`, `docs/testing-qa/README.md`, `docs/changelog/README.md`.

## Tasks

- [ ] Audit attendance schema indexes and uniqueness.
- [ ] Audit check-in/check-out service validation for active employee, active shift, active location, GPS accuracy, selfie, one check-in/out per day.
- [ ] Audit protected selfie endpoints for ownership/RBAC and no-store headers.
- [ ] Add additive DB indexes only if missing for today/history/report/exceptions queries.
- [ ] Patch UI sync sections for attendance exceptions/report if missing.
- [ ] Update docs.
- [ ] Run `npm run lint`, `npm run test`, `npm run build`, `npm run release:check`.

## Safety

- No hard deletes.
- No reset migrations.
- No frontend-only authorization.
- Private selfie access remains protected.
