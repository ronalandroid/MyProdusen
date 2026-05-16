# OOP Clean Architecture Design — MyProdusen

## Goal
Make MyProdusen more OOP-friendly, maintainable, pleasant to use, and production-safe without rewriting working business flows.

## Scope
This design migrates the application incrementally toward clean architecture:

- Route handlers behave like thin controllers.
- Service classes own business rules.
- Repository classes own Drizzle database access.
- Domain/application errors use `AppError`.
- UI improvements stay brand-safe and accessibility-focused.

This is not a full framework rewrite. Next.js App Router remains the web runtime.

## Non-Goals
- No KaffePOS changes.
- No database reset.
- No destructive migrations.
- No brand redesign.
- No risky rewrite of attendance, payroll, KPI, or leave approval in the first wave.

## Architecture

```txt
app/api/*/route.ts
  -> controller only: auth, parse, service call, response

src/server/repositories/*
  -> database access using Drizzle

features/*/*.service.ts or src/services/*
  -> business rules, extends BaseService where safe

lib/core/*
  -> AppError, Result, BaseService, route handler wrapper
```

## First Wave Modules

### Notifications
Low risk. Already has realtime support and several routes already migrated.

Target:
- Create `NotificationRepository`.
- Make `NotificationService` use repository injection.
- Move direct DB queries out of notification routes.
- Keep realtime publishing in route/service boundary where already stable.

### Shifts
Medium-low risk. CRUD module with simple permission checks.

Target:
- Create `ShiftRepository`.
- Create/upgrade `ShiftService`.
- Refactor shift routes to `withApiHandler`.
- Preserve existing API response shape.

## Error Handling
- User-caused errors use `AppError.validation`, `AppError.notFound`, `AppError.forbidden`, or `AppError.unauthorized`.
- Unknown errors are logged safely by `withApiHandler`.
- No secrets are logged.

## UI Pleasure
Small UI improvements only:
- Better loading state.
- Better empty state.
- Better error state.
- Better button accessibility.
- Preserve brand colors and current dashboard style.

## Validation
Each wave must pass:

```bash
npm run lint
npm run test
npm run build
```

## Risk Controls
- Migrate only small, low-risk modules per commit.
- Keep route response shape stable.
- Do not touch production env values.
- Do not touch upload storage behavior.
- Do not touch KaffePOS.
