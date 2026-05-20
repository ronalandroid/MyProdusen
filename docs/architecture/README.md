# Architecture — MyProdusen

> Canonical architecture, implementation, performance, reports, and reference-analysis guide.

> Role lock: production UI/login/access uses only `SUPERADMIN` and `EMPLOYEE`; `ADMIN_HR` and `SUPERVISOR` are historical database enum values only and must be denied in production access.

## Stack

- Next.js App Router.
- TypeScript.
- Tailwind CSS and internal UI components.
- Drizzle ORM.
- PostgreSQL.
- Docker on VPS + Coolify.
- Persistent private upload storage at `/app/uploads`.

Forbidden stack drift: Prisma, Laravel, jQuery, destructive DB reset workflows, and frontend-only authorization.

## Roles

Production roles:

```txt
SUPERADMIN
EMPLOYEE
```

Backend RBAC decides access. Frontend navigation is convenience only.

## Request Flow

```txt
UI -> API route/server action -> service -> repository/query -> Drizzle -> PostgreSQL -> response -> UI state
```

Rules:

- Route handlers stay thin.
- Services enforce business rules.
- Validators parse input before mutation.
- DB writes use Drizzle.
- Sensitive actions write audit logs.
- API returns safe Indonesian user errors.

## Feature Boundaries

- Auth: login, activation, reset password, sessions, inactive-user rejection.
- Employee: employee record, NIP, division/position/supervisor relation, deactivation.
- Attendance: GPS, accuracy, selfie, shift, work location, geo-fence, exceptions.
- Leave: leave/sick/permission workflow and approvals.
- KPI: template, assignment, scoring, approval, history.
- Payroll: active if enabled/documented; salary data RBAC-protected.
- Reports: CSV required, PDF where implemented, all exports audited.
- Notifications: persisted DB notifications plus best-effort realtime.
- Audit: immutable sensitive action trail.

## Performance Rules

- Dashboard/report queries need indexed filters.
- Exports need row caps.
- Public pages should avoid unnecessary hydration.
- Protected data uses `no-store`.
- Health/version endpoints must be fast and secret-free.

## Reference Repo Appendix

External reference repositories and screenshots are research inputs only. They do not override MyProdusen PRD, RBAC, brand, stack, or security rules.
