# OOP Clean Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MyProdusen more OOP-friendly by moving low-risk notification and shift data access into repository/service classes while preserving working production behavior.

**Architecture:** API routes remain thin controllers. Repository classes own Drizzle database queries. Service classes own business workflow and throw `AppError` for safe user-facing failures.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Vitest, existing `lib/core` OOP helpers.

---

### Task 1: Notification Repository

**Files:**
- Create: `src/server/repositories/notifications.repository.ts`
- Modify: `features/notifications/notification.service.ts`
- Modify: `app/api/notifications/route.ts`
- Modify: `app/api/notifications/[id]/read/route.ts`

- [ ] Create repository with methods `listForUser`, `findForUser`, `markAsRead`, `markAllAsRead`, `deleteForUser`, `create`.
- [ ] Inject repository into notification service.
- [ ] Move direct DB query from route to service/repository.
- [ ] Keep realtime publish behavior stable.
- [ ] Run `npm run lint` and `npm run test`.

### Task 2: Shift Repository and Service

**Files:**
- Create: `src/server/repositories/shifts.repository.ts`
- Create or Modify: `features/shifts/shift.service.ts`
- Modify: `app/api/shifts/route.ts`
- Modify: `app/api/shifts/[id]/route.ts`

- [ ] Create repository with methods `list`, `findById`, `create`, `update`, `delete`.
- [ ] Create service extending `BaseService`.
- [ ] Convert shift route handlers to `withApiHandler`.
- [ ] Preserve permission checks and response shape.
- [ ] Run `npm run lint` and `npm run test`.

### Task 3: Final Verification

**Files:**
- Validate changed files only plus docs.

- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run secret scan.
- [ ] Commit and push if all pass.
