# Load testing — simultaneous attendance check-ins

The sharpest capacity question for MyProdusen is the shift-start rush: many
employees clocking in within a short window. `scripts/load-test-checkin.mjs`
seeds N distinct employees, mints a JWT for each, fires all N check-in POSTs
**at the same instant**, and reports latency percentiles + error rate, then
cleans up everything it created.

## Running it

Point it at a **production build** (`npm run start:prod`) or the staging stack
— never `next dev` (its numbers are meaningless) and never live production.

```bash
# 1. A running app with Postgres + Redis reachable. Locally:
REDIS_URL=redis://localhost:6399 PORT=3020 npm run start:prod &   # needs redis-server

# 2. Fire the burst (defaults: 200 concurrent, http://localhost:3000)
CONCURRENCY=200 BASE_URL=http://localhost:3020 npm run load:test
```

Env: `CONCURRENCY`, `BASE_URL`, `DATABASE_URL` (from `.env`), `JWT_SECRET`
(must match the running app so tokens verify), `LOADTEST_ORIGIN` (defaults to
`APP_URL` for the CSRF origin check).

The script exits non-zero if the error rate exceeds 2%.

## Baseline result (2026-07-11)

Local production build on an Apple-silicon dev machine, app + Postgres + Redis
all local (no network hop), 1×1-px selfie. **Absolute latency is optimistic vs
the production VPS**, but the error-rate / scaling shape is representative.

| Simultaneous check-ins | Success | p95 latency | Notes |
|---:|---:|---:|---|
| 100 | 100% | 553 ms | clean |
| 200 | 100% | 882 ms | clean, 0 errors |
| 300 | 100% | 1394 ms | clean |
| 400 | 77.8% | 1273 ms | 89 connection failures — accept-path saturates |

### Reading it

- **200 truly-simultaneous check-ins succeed 100% with zero errors.** The
  Postgres pool (`DB_MAX_CONNECTIONS`, default 10) is **not** a bottleneck —
  requests queue through it briefly and all complete.
- The clean ceiling on this hardware is ~300 at-once; at 400 the OS/Node
  connection-accept path starts refusing some of a literal same-microsecond
  burst (`fetch failed`, status 0) — not an application-logic failure.
- Real arrivals **stagger** over minutes; a 2–3 minute bell rush of 50–80 is
  far below the clean ceiling. Check-in and check-out happen ~8 h apart, so the
  "200 in + 200 out at once" worst case does not occur in practice.

### Caveats

- The production VPS is smaller than the test machine, so expect higher latency
  and a lower absolute ceiling. Re-run this against the **staging stack**
  (`docker-compose.staging.yml`, which bundles Redis + Postgres and the prod
  image) or in CI for a hardware-neutral number.
- Real selfies are ~200 KB (vs the 1×1 px used here). That adds **upload
  transfer time on the client's cellular link**, not server CPU — mitigated by
  client-side compression and the resilient retry/timeout submit.

## Follow-ups surfaced by this test

- Check-in hard-requires `REDIS_URL` (the rate-limiter's `getRedisClient()`
  throws when it is unset, unlike the idempotency lock which fails open).
  Production has Redis configured and healthy, so this is not a live risk, but
  worth knowing: never deploy the app without `REDIS_URL`.
- Consider raising `DB_MAX_CONNECTIONS` from 10 to ~20 for extra headroom
  during the shift-start window (Postgres default `max_connections` is 100).
