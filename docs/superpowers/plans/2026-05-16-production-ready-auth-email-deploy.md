# Production Ready Auth Email Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MyProdusen usable on Coolify with stable build, Superadmin bootstrap, role management, Resend email hooks, and mobile-first auth/dashboard UX.

**Architecture:** First restore build/test health by fixing broken imports and service/API mismatches. Then add env-driven bootstrap and email service without committing secrets. Finally update docs/env/deployment and run verification.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Vitest, Docker, Resend HTTP API.

---

## Files
- Modify `features/payroll/payroll-period.service.ts` to use existing audit service or local no-op fallback compatible with current repo.
- Modify `app/api/payroll/periods/*.ts` route handlers to match actual service methods.
- Modify `features/overtime/overtime.service.ts` typo causing typecheck failure.
- Add/modify auth registration, forgot-password, role APIs after inspecting existing patterns.
- Add `lib/email/resend.ts` and email templates for auth events.
- Update `.env.example`, `docs/DEPLOYMENT.md`, `docs/COOLIFY_DEPLOYMENT.md`, and create `docs/FINAL_CHECKLIST.md`.
- Improve responsive auth/dashboard/user pages only where needed.

## Tasks
- [ ] Run current checks and capture failures.
- [ ] Fix build/type import failures.
- [ ] Add tests for bootstrap/email helper where feasible.
- [ ] Add Superadmin bootstrap using env values.
- [ ] Add Resend email notification helper and wire auth flows.
- [ ] Add/repair user role management route guarded by Superadmin.
- [ ] Update deployment docs and env sample.
- [ ] Run `npm run lint`, `npm run test`, `npm run build` and fix blocking errors.

## Verification
- `npm run lint` exits 0.
- `npm run test` exits 0.
- `npm run build` exits 0.
- Docs mention Coolify env keys and no real secret values.
