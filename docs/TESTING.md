# Testing Guide

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


MyProdusen uses **Vitest** for unit, integration, and database-constraint
tests. The canonical pre-deploy gate is `npm run release:check`.

## Commands

| Command | Purpose |
| ------- | ------- |
| `npm run lint` | Strict TypeScript check (`tsc --noEmit`). Acts as the typecheck gate. |
| `npm run test` | Full test suite. |
| `npm run build` | Production build smoke test. |
| `npm run release:check` | Local pre-deploy gate: lint + tests + build + migration-coverage + reference contract. |
| `npm run release:check:full` | Same as above plus production env preflight. Run on the deploy target. |
| `npm run release:env` | Production env preflight only. |
| `npm run release:migrations` | Migration-coverage check only. |
| `npm run release:references` | Design-reference contract check only. |
| `npm run perf:explain` | `EXPLAIN ANALYZE` the dashboard / report / search queries against `$DATABASE_URL`. Run on staging. |

There is no separate `typecheck` script — `lint` already does it.

## Test layout

```
tests/
├── setup.ts                                 # Vitest bootstrap (loads .env, normalises DATABASE_URL)
├── helpers/test-utils.ts                    # Reusable fixture builders
├── api/
│   ├── attendance.test.ts                   # Check-in/out, geofence, missing selfie
│   ├── attendance-selfie-protected.test.ts  # /api/attendances/:id/selfie/{check-in|check-out}
│   ├── attendance-report.test.ts            # /api/reports/attendance + summary + CSV
│   ├── work-location-search.test.ts         # ?search= ilike on name + address
│   └── ...
├── attendance/
│   ├── exception-policy.test.ts             # OUTSIDE_GEOFENCE / BAD_GPS_ACCURACY policy
│   ├── gps-validation.test.ts               # 10 cases: lat/lon/accuracy/range/timestamp
│   └── selfie-storage.test.ts               # MIME, size, traversal, base64-rejection
├── db/
│   └── constraints.test.ts                  # One attendance per employee per day
├── rbac/
│   └── ...                                  # Cross-employee / cross-team scope checks
├── kpi/  leave/  payroll/  reports/  ui/    # Domain-specific tests
└── offline/                                  # Sync queue tests
```

## What the suite covers

- **GPS hardening**: missing fields, out-of-range lat/lon, accuracy cap, stale
  timestamps, inactive locations, reject vs pending behaviour.
- **Selfie storage**: structured key path, MIME signature, oversized rejection,
  traversal-safe storage path resolver, base64-never-in-DB.
- **Protected selfie access**: owner allowed, peer denied, SUPERADMIN allowed,
  unauthenticated 401, unknown ID 404, traversal 404.
- **Attendance reports**: RBAC scoping (self/team/all), filter parity with
  CSV, format=csv requires date range, audit log entry on export, row cap
  honours `ATTENDANCE_EXPORT_MAX_ROWS`.
- **Work-location search**: case-insensitive name + address match.
- **DB constraints**: unique per-day attendance index.
- **RBAC + permissions + NIP + leave + KPI + payroll period locks** all
  exercised via dedicated test files.

## Writing new tests

1. Use `tests/helpers/test-utils.ts` to seed users, employees, locations, and
   shifts. Always clean up via the returned IDs.
2. Use `createMockRequest()` instead of constructing raw `Request` objects so
   FormData/JSON encoding stays consistent.
3. For DB-touching tests, scope assertions by employee/division to avoid
   cross-test pollution from the shared dev DB.
4. New unit tests can import via `@/lib/...`, `@/services/...`, etc. For
   `src/server/...` imports, use a relative path from the test file (the
   Vitest alias map omits that prefix).
5. Run `npm run lint && npm run test` before committing.

## Performance smoke test

`npm run perf:explain` prints `EXPLAIN ANALYZE` for the canonical queries
(report month range, single-employee window, outside-geo, employee `ilike`,
work-location `ilike`, audit log by user). Look for index usage on
`Attendance_employeeId_checkInTime_idx`, `Attendance_status_checkInTime_idx`,
`Employee_division_idx`, and the geo-status indexes added in `0011`.
