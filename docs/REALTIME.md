# Realtime — MyProdusen

## Goal

Provide lightweight realtime updates for live notifications, attendance updates, sync status, and dashboard refresh without requiring a separate WebSocket server.

## Transport

MyProdusen uses Server-Sent Events (SSE):

```txt
Browser EventSource
  → GET /api/realtime
  → authenticated Next.js route
  → Redis subscribe myprodusen:realtime
  → scoped events streamed to user
```

SSE is chosen because it works with Next.js App Router, Docker, and Coolify without a separate server process.

## Files

- `app/api/realtime/route.ts` — authenticated SSE endpoint
- `lib/realtime/events.ts` — event types, scopes, filtering
- `lib/realtime/publisher.ts` — Redis pub/sub publisher with fallback
- `src/hooks/useRealtime.ts` — client hook for EventSource subscriptions

## Event Shape

```ts
interface RealtimeEvent<TPayload = unknown> {
  id: string;
  type: 'notification.created' | 'notification.read' | 'attendance.updated' | 'dashboard.updated' | 'sync.updated' | 'heartbeat';
  scope: 'user' | 'role' | 'global';
  target?: string;
  payload: TPayload;
  createdAt: string;
}
```

## Security

- `/api/realtime` requires authentication.
- User-scoped events only stream to matching `userId`.
- Role-scoped events only stream to matching role.
- Event payloads must not include secrets or private files.

## Redis Fallback

If Redis is not configured or temporarily unavailable:

- SSE returns a connected event and heartbeat.
- Publish calls log a safe warning and return `false`.
- UI can continue using normal fetch/poll refresh.
- App startup and health do not fail solely due to realtime Redis issues.

## Client Usage

```ts
const { connected, lastEvent } = useRealtime({
  eventTypes: ['notification.created', 'notification.read'],
  onEvent: () => refreshNotifications(),
});
```

Browser `EventSource` handles reconnection automatically. Components should still keep manual refresh buttons for fallback.

## Future Improvements

- Add attendance event publish after check-in/check-out.
- Add dashboard event publish after attendance, leave, KPI, and payroll mutations.
- Add persistent event log if offline clients need replay.
- Add Redis-backed worker process only if report/email/payroll jobs become too slow for request lifecycle.
