# Uptime monitoring & alerting

MyProdusen has no external watcher today: if the VPS or the app dies, the team
finds out from employees who cannot clock in. This guide wires a free external
monitor to the health endpoint so a human is paged within minutes instead.

## What to monitor

`GET https://myprodusen.online/api/health`

- Healthy: **HTTP 200** with `"status":"ok"` in the JSON body
- Unhealthy: **HTTP 503** when the database, Redis, or disk check fails
  (`"status":"error"`); the body never leaks internals — safe to expose to a
  monitor
- The response also carries `version` and per-check `status` fields
  (database/redis/disk/memory) that help triage before SSH-ing in

Because the endpoint already turns dependency failures into a 503, a plain
HTTP monitor catches "app up but DB down" — but add the keyword match anyway
so a reverse-proxy error page that returns 200 can't fake health.

## Option A — UptimeRobot (free, recommended start)

1. Create an account at uptimerobot.com (free plan: 50 monitors, 5-minute
   interval).
2. **Add New Monitor** →
   - Monitor type: `HTTP(s) - Keyword`
   - URL: `https://myprodusen.online/api/health`
   - Keyword: `"status":"ok"` — alert when keyword **not exists**
   - Interval: 5 minutes (1 minute on paid)
3. Alert contacts: e-mail at minimum; add the Telegram integration for the
   ops group chat — attendance outages at 07:00 need something louder than
   e-mail.
4. Optional second monitor, type `HTTP(s)`, URL `https://myprodusen.online/`
   — catches TLS/DNS/proxy breakage even while the API is fine.

## Option B — Better Stack (nicer alerting)

Free plan: 10 monitors, 3-minute checks, built-in status page and on-call
calendar. Same configuration: expect `200`, required keyword `"status":"ok"`.
Prefer it if the team wants phone-call escalation later.

## Heartbeat for the backup job (optional but cheap)

Both providers offer "heartbeat" monitors (a URL the JOB must ping). Add the
ping as the last line of the backup scheduled task
(`scripts/backup-production-template.sh` caller):

```bash
curl -fsS -m 10 https://heartbeat.uptimerobot.com/<your-key> > /dev/null
```

If backups silently stop, the missed heartbeat pages you — this is the most
common silent failure in small deployments.

## What this does NOT cover

- **Error spikes while "up"** — Sentry already reports exceptions; keep its
  alert rules on.
- **Deploy verification** — the Coolify deploy flow plus
  `npm run verify:live-routes` covers that.
- **Certificate expiry** — Coolify/Let's Encrypt auto-renews; UptimeRobot's
  SSL-expiry reminder (free) is a belt-and-suspenders addition.

## When the pager fires

1. `curl -s https://myprodusen.online/api/health | jq .` — read which check is
   `error`.
2. Database/Redis error → check the Coolify service containers first
   (`postgres`, `redis`), then disk space (`df -h`).
3. Connection refused / timeout → app container or proxy down: Coolify
   dashboard → application → logs; redeploy last good image if needed.
4. Follow [PRODUCTION_BLOCKER_RUNBOOK.md](PRODUCTION_BLOCKER_RUNBOOK.md) for
   deeper incidents.
