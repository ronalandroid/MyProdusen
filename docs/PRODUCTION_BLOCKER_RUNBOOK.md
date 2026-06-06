# MyProdusen Production Blocker Runbook

Last updated: 2026-06-02

This runbook turns current audit blockers into executable, evidence-based checks. Do not mark production signoff complete without attached evidence.

## 1. Deployment gate

After latest `main` is pushed:

1. Open Coolify → MyProdusen → Redeploy latest main.
2. Wait until app is healthy.
3. Run live checks:

```bash
BASE_URL=https://myprodusen.online npm run verify:live-routes
npm run verify:cdn
E2E_BASE_URL=https://myprodusen.online npm run e2e:public
```

Expected:
- live routes pass
- CDN private endpoints are `no-store` / dynamic
- public E2E passes 20/20

## 2. Authenticated E2E provisioning

Run inside deployed app container only after redeploy:

```bash
cd /app
npm run release:runtime
npm run seed:work-location
npm run seed:leader-teams
npm run setup:uat-leader-flow
npm run verify:uat-leader-flow
npm run verify:uat-auth
```

Then set E2E env values in local/CI secret store, never in git:

```text
E2E_SUPERADMIN_EMAIL=[REDACTED]
E2E_SUPERADMIN_PASSWORD=[REDACTED]
E2E_LEADER_EMAIL=[REDACTED]
E2E_LEADER_PASSWORD=[REDACTED]
E2E_EMPLOYEE_EMAIL=[REDACTED]
E2E_EMPLOYEE_PASSWORD=[REDACTED]
```

Run:

```bash
E2E_BASE_URL=https://myprodusen.online npm run e2e:staging
E2E_BASE_URL=https://myprodusen.online npm run e2e:leader
E2E_BASE_URL=https://myprodusen.online npm run e2e:employee
```

Evidence to attach:
- command output
- role names only, no passwords
- timestamp
- commit SHA deployed

## 3. Real-device GPS + selfie UAT

Use real production/staging HTTPS domain. Browser emulation is not enough.

Official location:

```text
Produsen Dimsum Medan
Latitude: 3.6009125
Longitude: 98.6964954
Radius: 150m
```

### Android Chrome

- [ ] login as employee
- [ ] Clock In inside radius with GPS permission allowed
- [ ] realtime selfie camera opens
- [ ] submit succeeds
- [ ] Clock Out inside radius with GPS + selfie succeeds
- [ ] outside-radius attempt is rejected with Indonesian message
- [ ] camera denied shows Indonesian help text
- [ ] GPS denied shows Indonesian help text

### iPhone Safari

- [ ] login as employee
- [ ] Clock In inside radius with GPS permission allowed
- [ ] realtime selfie camera opens
- [ ] submit succeeds
- [ ] Clock Out inside radius with GPS + selfie succeeds
- [ ] outside-radius attempt is rejected with Indonesian message
- [ ] camera denied shows Indonesian help text
- [ ] GPS denied shows Indonesian help text

Evidence to attach:
- screenshots for success and rejection states
- device model + browser version
- approximate distance/location context
- attendance row ID or timestamp, no selfie file leaked publicly

## 4. Payroll policy owner approval

Owner/HR must approve before payroll use. Suggested signoff text:

```text
Saya menyetujui konfigurasi awal payroll MyProdusen:
- gross = baseSalary + kpiBonus + holidayBonus + manualAdditions
- late 1–15 minutes deducts Rp5.000
- late 16–30 minutes deducts Rp10.000
- late >30 minutes uses half-day pay factor 0.5
- holiday work multiplier default 2x, configurable by Superadmin
- KPI production bonus follows configured payroll rule
- policy can be revised before payroll close/payment

Nama:
Jabatan:
Tanggal:
Tanda tangan:
```

Evidence to attach:
- signed PDF/photo
- approved effective date
- payroll rule IDs/config snapshot

## 5. Backup/restore drill

Do not run restore against production. Use staging clone only.

Preferred helper:

```bash
bash scripts/backup-restore-drill.sh
```

Required evidence:
- dump created successfully
- restore target is staging, not production
- `npm run db:deploy` passes on restored staging DB
- login + attendance smoke pass on restored staging app

## 6. Signoff classification

`READY FOR PRODUCTION SIGNOFF` requires all items below:

- [ ] latest commit redeployed
- [ ] production `release:runtime` passed
- [ ] production `db:deploy` passed
- [ ] public E2E passed
- [ ] authenticated Superadmin E2E passed
- [ ] authenticated Leader E2E passed
- [ ] authenticated Employee E2E passed
- [ ] Android real-device GPS+selfie passed
- [ ] iPhone real-device GPS+selfie passed
- [ ] outside-radius rejection passed
- [ ] protected avatar/selfie/PDF verified live
- [ ] payroll policy approved by owner/HR
- [ ] backup/restore drill passed
- [ ] TestSprite passed or owner accepted unavailable
- [ ] no critical security issue

---

## Frontend UI/UX v4 update

Current frontend UI/UX baseline:
- Design language: Strava-inspired, metric-first, mobile-first.
- Brand accent: `#FFC107` yellow.
- Fonts: Poppins for UI/headings, JetBrains Mono for stats and numeric values.
- Surfaces: soft gray page bands with white cards.
- Radius: 8px default radius.
- Navigation: white desktop sidebar with yellow active left border; mobile bottom nav with yellow active state.
- Shared primitives restyled globally through `app/globals.css`: `.btn`, `.input`, `.card`, `.table`, `.badge`, `.nav-item`, `.stat-card`, `.alert`.
- Employee Beranda includes Strava-style stat strip: Hadir, Streak, Skor.

Validation status:
- `npm run lint` passed after UI/UX v4 update.
- `npm run build` passed after UI/UX v4 update.

When updating this document, keep workflow/security/data rules unchanged and only align frontend descriptions with v4 UI/UX language.

