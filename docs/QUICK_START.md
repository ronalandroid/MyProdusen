# Quick Start

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


Get a working dev environment in five minutes. For deeper setup, read
[`INSTALLATION.md`](./INSTALLATION.md).

## Prerequisites

- Node.js 22+
- PostgreSQL 14+ running locally (or via Docker)
- npm 10+

## Five-minute path

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT_SECRET (≥32 chars in production).

# 3. Apply migrations
npm run db:deploy

# 4. (One-time) bootstrap a Superadmin
npm run bootstrap:superadmin

# 5. Start dev server
npm run dev
```

Open http://localhost:3000 and log in with the credentials emitted by
`bootstrap:superadmin` (or the `SUPERADMIN_*` env values you configured).

## Common commands

```bash
# Verification
npm run lint    # tsc --noEmit (acts as type-check)
npm run test    # vitest run
npm run build   # next build

# Database
npm run db:generate     # generate a new migration from schema diff
npm run db:deploy       # apply tracked migrations
npm run db:studio       # open Drizzle Studio

# Performance
npm run perf:explain    # EXPLAIN ANALYZE the dashboard / report / search queries
                        # against $DATABASE_URL (run on staging only)
```

## End-to-end smoke test

A 13-step manual scenario lives in [`FINAL_CHECKLIST.md`](./FINAL_CHECKLIST.md)
under "Final End-to-End Test Coverage". Use it before declaring a release ready.
