# Parallel Agents Plan — Maximum 5 Agents

## Rules
- Maximum 5 agents at one time.
- Agents must not edit same files at same time.
- Docs first, database second, auth before protected features.
- Work location before attendance.
- Attendance before dashboard/report.
- Merge one agent result at a time.

## Agent 1 — Docs + Product
Owned files: `docs/**`, `AGENTS.md`, `README.md`.
- Keep PRD/current-state docs accurate.
- Update gap matrix, implementation plan, final checklist.
- Mark historical docs as stale if needed.

## Agent 2 — Architecture + Database + Auth/RBAC
Owned files: `prisma/**`, `lib/auth.ts`, `lib/middleware.ts`, `lib/permissions.ts`, root `middleware.ts`, auth routes.
- Add safe migrations.
- Harden JWT/session/RBAC/row-level policies.
- Add role hierarchy and active-user checks.

## Agent 3 — Employee + Location + Attendance
Owned files: employee/location/attendance API routes and services, attendance validation.
- Harden NIP uniqueness.
- Enforce location/shift assignments.
- Add attendance today/manual adjustment/upload flow.

## Agent 4 — KPI + Leave + Dashboard + Reports
Owned files: KPI/leave/dashboard/report features and routes.
- Add KPI service/routes.
- Harden leave team approval rules.
- Add dashboard aggregations and exports.

## Agent 5 — UI/UX + Testing + Security + Deployment
Owned files: components/UI pages/tests/Docker/deployment docs.
- Wire frontend flows.
- Add WCAG-friendly reusable components.
- Add tests, Docker/Coolify validation, backup/restore docs.
