# MyProdusen Architecture

## Stack

- Frontend: Next.js App Router, React, TypeScript
- UI: Tailwind CSS and reusable internal components
- Backend: Next.js API routes and server-side services
- Database: PostgreSQL with Drizzle ORM
- Realtime: Server-Sent Events over `/api/realtime`
- Cache, rate limit, pub/sub: Redis with safe fallback
- Deployment: GitHub → Coolify → Docker → Contabo VPS
- Runtime port: `0.0.0.0:3000`

## Feature Modules

Feature code is grouped around business domains:

- `features/auth` and `src/services/auth` — login, roles, permissions
- `features/employees` and `src/services/employees` — employee HR data and NIP logic
- `features/attendance` and `src/services/attendance` — GPS attendance, exceptions, audits
- `features/leave` and `src/services/leave` — leave, sick, permission, balances
- `features/payroll` and `src/services/payroll` — payroll periods, runs, structures
- `features/reimbursement` and `src/services/reimbursement` — expense claims
- `features/kpi` and `src/services/kpi` — KPI templates, assignments, results
- `features/notifications` and `app/api/notifications` — notifications and realtime hooks
- `app/api/reports` and `lib/reports` — CSV/report generation
- `lib/offline` and `app/api/sync` — offline sync support

## Request Flow

```txt
Client page/component
  → app/api/* route
  → requireAuth / permission checks
  → Zod validation or typed parser
  → service/repository logic
  → Drizzle query
  → successResponse / errorResponse
```

Backend authorization is mandatory. Client validation is only UX; API routes remain source of truth.

## Type Safety

- API inputs use Zod schemas or small parser helpers such as `lib/api/pagination.ts`.
- Shared response shape lives in `src/utils/response.ts`.
- Database access uses Drizzle schema exports from `lib/db.ts`.
- Large list endpoints should use pagination and selected columns, not unrestricted `select *`.

## Database Strategy

- PostgreSQL is production source of truth.
- Drizzle SQL migrations live in `drizzle/migrations`.
- Production startup runs `scripts/run-migrations.mjs` through `docker-entrypoint.sh`.
- `_myprodusen_migrations` tracks applied or baselined migration files.
- Existing data is never dropped automatically.
- Empty DB bootstrap is supported.

## Redis Strategy

Redis is used for:

- cache (`lib/cache/cache-manager.ts`)
- login/rate-limit helpers where existing code uses them
- realtime pub/sub for SSE fanout
- lightweight future job queue abstraction in `lib/jobs/queue.ts`

Redis failure must degrade gracefully for cache/realtime. Core DB-backed app requests should not fail solely because cache is unavailable.

## Realtime Strategy

- `/api/realtime` is an authenticated SSE endpoint.
- Redis pub/sub channel: `myprodusen:realtime`.
- Client hook: `src/hooks/useRealtime.ts`.
- Current event types: notifications, attendance, dashboard, sync, heartbeat.
- If Redis is unavailable, SSE stays connected with heartbeat and app falls back to normal fetch/poll behavior.

## Logging

- `lib/logger/index.ts` provides structured logs.
- Secret-like keys and connection URLs are redacted.
- Logs must not print `DATABASE_URL`, Redis password, `JWT_SECRET`, `NEXTAUTH_SECRET`, cookies, bearer tokens, or admin password.

## Performance Rules

- Use pagination for large lists.
- Use Redis cache only for non-sensitive, frequently read data with TTL.
- Prefer selected columns over full rows in list endpoints.
- Avoid N+1 queries in dashboard/report paths.
- Keep `/api/health` fast and public-safe.
