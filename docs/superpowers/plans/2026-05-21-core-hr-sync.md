# Core HR Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Wave 1 core HR modules (users, employees, NIP, work locations, shifts) consistently synced across UI, API, service, Drizzle, PostgreSQL, and docs.

**Architecture:** Keep route handlers thin and service/database logic authoritative. Add only non-destructive DB/index changes if audit finds a needed persistence gap. Keep production roles user-facing as `SUPERADMIN` and `EMPLOYEE` only.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Vitest.

---

## Files

- Modify: `app/dashboard/employees/page.tsx` — employee form/list sync messaging, role-safe labels, API-backed master data cards.
- Modify: `app/dashboard/users/page.tsx` — user activation/role sync messaging and legacy-role exposure guard if needed.
- Modify: `app/dashboard/locations/page.tsx` — work-location API/database sync messaging and validation hints.
- Modify: `app/dashboard/shifts/page.tsx` — shift API/database sync messaging and validation hints.
- Modify if tests expose gaps: `src/services/employees/employee.service.ts`, `src/services/work-locations/work-location.service.ts`, `src/services/shifts/shift.service.ts`.
- Create/modify tests only where behavior gaps are found.
- Modify docs: `docs/ui-ux-guide/README.md`, `docs/database/README.md`, `docs/testing-qa/README.md`, `docs/changelog/README.md`.

## Task 1: Audit Role Exposure

- [ ] Search UI/API/tests for `ADMIN_HR` and `SUPERVISOR` exposure outside historical schema.
- [ ] If exposed in production UI or route choices, write failing test or patch render/filter logic.
- [ ] Verify no production UI role selector shows legacy roles.

## Task 2: Employees/NIP Sync

- [ ] Confirm employee page uses `/api/employees`, `/api/users`, and service-generated NIP.
- [ ] Add UI sync section explaining `UI -> API -> service -> Drizzle -> PostgreSQL` and NIP format.
- [ ] If NIP behavior lacks test coverage, add focused Vitest coverage before code.

## Task 3: Users Sync

- [ ] Confirm user activation/role updates call backend endpoints.
- [ ] Add UI sync section explaining inactive user review, safe roles, and activation/deactivation backend source of truth.
- [ ] Patch legacy-role labels if exposed.

## Task 4: Work Locations Sync

- [ ] Confirm location CRUD calls `/api/work-locations` and service validates GPS/radius.
- [ ] Add UI sync section explaining active location, radius, geo-fence use by attendance, and audit/security rule.
- [ ] Add database indexes only if queries lack needed support and docs confirm additive migration is safe.

## Task 5: Shifts Sync

- [ ] Confirm shift CRUD calls `/api/shifts` and service enforces active shift fields.
- [ ] Add UI sync section explaining attendance dependency on active shift and backend validation.

## Task 6: Docs + Verification

- [ ] Update UI/database/testing/changelog docs for touched behavior.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run release:check`.

## Self-review

- Scope limited to Wave 1 core HR sync.
- No destructive migration allowed.
- No new production role beyond `SUPERADMIN` and `EMPLOYEE`.
- UI additions must be backend-route-backed, not mock.
