# SRC — MyProdusen

**Project:** MyProdusen Employee Management System  
**Status:** Active  
**Last Updated:** 2026-05-15

## 1. Technical Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM
- PostgreSQL
- Redis
- IndexedDB via Dexie
- Docker / Coolify deployment

## 2. Core System Requirements

### Authentication
- Use secure password hashing.
- Use httpOnly cookie session/JWT storage.
- Enforce role-based backend authorization.
- Apply login/register rate limiting.
- Reject inactive users.

### Authorization
- Backend must enforce RBAC.
- Supervisor can only access assigned team data.
- Employee can only access own data.
- Frontend guards are UX only, not security.

### Database
- PostgreSQL is source of truth.
- Migrations must be committed and safe.
- Do not reset production database.
- Historical data uses soft delete/deactivation when required.
- Attendance must prevent duplicate check-in per employee per day.

### Cache
- Redis caches repeat reads.
- Cache must be invalidated after mutations.
- Cache failure must not break core app; fallback to DB.
- Health check should expose Redis/cache status.

### Resilience
- Retry transient failures with exponential backoff + jitter.
- Use circuit breaker for unstable dependencies.
- Rate limiting must work across app instances via Redis.

### Offline Sync
- Browser stores offline writes in IndexedDB.
- Sync queue handles pending create/update/delete operations.
- Attendance and leave support offline-first flow.
- Sync retries failures and preserves unsynced data.
- Conflicts use last-write-wins, server-wins, client-wins, or manual resolution.

### Attendance
- Check-in/out requires GPS latitude, longitude, accuracy, selfie, timestamp.
- Backend validates geofence and assigned work location.
- GPS accuracy threshold must be enforced.
- Manual adjustment requires reason and audit log.

### Uploads
- Validate file type and size.
- Store file path/object key, not raw large data string where possible.
- Upload storage must be persistent in production.

### API
- Validate request body with Zod.
- Return consistent success/error shape.
- Avoid leaking secrets or stack traces.
- Important mutations should write audit log.

### UI
- Mobile-friendly.
- Accessible contrast.
- Clear Indonesian user-facing messages where possible.
- Show loading, offline, pending sync, and error states.

## 3. Performance Targets

- Cached reads: under 50ms target.
- Uncached reads: under 200ms target.
- Cache hit rate target: above 90% for repeated reads.
- Sync 100 queued operations under 5 seconds target.
- App should handle traffic spikes without hammering DB.

## 4. Deployment Requirements

- Production requires strong `JWT_SECRET`.
- Production requires PostgreSQL, Redis, and persistent upload storage.
- Run migrations before production start.
- Configure `/api/health` monitoring.
- Backups required for PostgreSQL and uploads.

## 5. Documentation Rules

- All documentation markdown lives in `docs/`.
- Root `AGENTS.md` is only root markdown exception.
- Update `docs/INDEX.md` when docs change.
