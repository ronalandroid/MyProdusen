# AGENTS.md — MyProdusen Agent Rules

## Source of Truth
- Read `docs/prd.md` first before product or code changes.
- Read `docs/CURRENT_STATE.md` before estimating completeness.
- Read `docs/IMPLEMENTATION_PLAN.md` before choosing next work.
- Treat older summary docs as historical if they conflict with current-state docs.

## Non-Negotiable Rules
- Do not reset production database.
- Do not commit `.env`, secrets, uploads, or generated build output.
- Backend must enforce RBAC, ownership, team scope, geofence, and attendance rules.
- Frontend-only protection is not security.
- Database migrations must be safe, reviewed, and committed.
- Auth must be complete before protected features.
- Work location must be complete before attendance.
- Attendance must be complete before dashboard/report aggregation.

## Engineering Standard
- Next.js App Router, TypeScript, Tailwind, Prisma, PostgreSQL.
- Keep business logic in services and reusable server utilities.
- Validate input with Zod at API boundaries.
- Keep UI clean, mobile-friendly, accessible, and consistent with brand colors.
- Add tests for critical business logic before marking feature ready.

## Parallel Agent Workflow
- Maximum 5 agents at once.
- Agents must have separate file ownership.
- Merge one agent result at a time.
- Docs agent updates docs first; database/auth agent runs before feature agents.
- Every agent final output: summary, files changed, commands run, risks, next step.
