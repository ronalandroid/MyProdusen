# Uptime monitoring & alerting

If the VPS or the app dies, the team should be told within minutes — not find
out from employees who cannot clock in. Two layers cover this:

1. **Built-in (already active, zero signup)** — the
   `.github/workflows/uptime-monitor.yml` GitHub Action probes `/api/health`
   every ~10 minutes. On failure it opens a GitHub issue labelled `uptime`
   (notifying repo watchers) and fails the run; when health recovers it
   comments and auto-closes the issue. Nothing to configure — it runs from
   this repo. Caveat: GitHub's cron can lag under load and pauses after 60
   days of repo inactivity, and the alert is only as loud as your GitHub
   notification settings.
2. **External (recommended, louder + faster)** — UptimeRobot or Better Stack
   below, for 1–5 minute checks with e-mail/Telegram/phone alerts. Needs a
   free account.

Run both: the built-in monitor is a dependable free baseline, the external one
adds fast, loud paging.

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

## Single-VPS recovery (no redundancy — mitigate with speed)

MyProdusen runs on one VPS with no hot standby, so availability rests on
**fast detection + fast restart**, not failover. The monitors above give
detection; this is the restart drill:

1. **App down, VPS up** (health times out or 5xx): Coolify dashboard →
   `myprodusen-web-app` → **Restart** (seconds). If it won't start, **Redeploy**
   the last good image. The DB and uploads survive — they are separate volumes.
2. **VPS unreachable** (SSH + health both dead): reboot the VPS from the host
   provider's panel; Coolify autostarts the stack (`restart: unless-stopped`).
3. **Disk full** (`df -h` ~100%): the selfie folder grows unbounded — prune or
   offload old attendance selfies (see the backup/retention note in
   [backup-restore-drill.md](backup-restore-drill.md)), then restart.
4. **Data intact check** after any recovery: `/api/health` → `"status":"ok"`
   and a spot login. Nightly R2 backups mean worst-case data loss is ≤24h.

Recovery objective: **detect ≤10 min** (monitors), **restart ≤5 min** (steps
1–2). A permanent standby is out of scope until the workforce outgrows one VPS.
