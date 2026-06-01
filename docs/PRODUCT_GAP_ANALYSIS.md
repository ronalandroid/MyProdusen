# Product Gap Analysis — MyProdusen HRIS

**Project:** MyProdusen HRIS Web App  
**Company:** Produsen Dimsum Medan  
**Updated:** 2026-06-01  
**Status:** Productization guide, not production signoff

## Operating Plan

### Current state audit

MyProdusen already includes core HRIS modules for employee operations: authentication, profile completion, three production roles, GPS/selfie attendance, work locations, shifts, leave, KPI production, payroll/payslip, performance score, chicken streak, notifications, audit logs, PDF reports, PWA, CDN cache checks, and Coolify/VPS deployment runbooks.

### Files involved

Canonical product references:

- `README.md`
- `AGENTS.md`
- `docs/prd.md`
- `docs/UI_UX_GUIDE.md`
- `docs/DATABASE.md`
- `docs/SECURITY.md`
- `docs/TESTING_QA.md`
- `docs/FINAL_CHECKLIST.md`
- `docs/GO_LIVE_STEPS.md`
- `docs/manual-real-device-uat.md`
- `docs/CHANGELOG.md`

### Risk assessment

- High risk: broad dashboard rewrite, RBAC shortcuts, payroll policy changes, destructive migrations, camera/GPS changes without real-device UAT.
- Medium risk: authenticated staging E2E without stable fixture accounts.
- Low risk: documentation, additive tests, no-store/private assertions, UI copy/accessibility polish.

### Test plan

Required before redeploy:

```bash
npm run lint
npm run test
npm run build
npm run release:check
npm run e2e:public
BASE_URL=https://myprodusen.online npm run verify:live-routes
npm run verify:cdn
```

Required after redeploy and fixture setup:

```bash
E2E_BASE_URL=https://myprodusen.online npx playwright test tests/e2e/staging-smoke.spec.ts --project=desktop-1440 --workers=1
E2E_BASE_URL=https://myprodusen.online npx playwright test tests/e2e/leader-staging.spec.ts --project=desktop-1440 --workers=1
E2E_BASE_URL=https://myprodusen.online npx playwright test tests/e2e/employee-staging.spec.ts --project=desktop-1440 --workers=1
```

### Rollback plan

- Code rollback: `git revert <release_commit>` then redeploy previous known-good commit.
- DB rollback: no destructive migrations allowed. For additive migrations, deploy code that ignores new columns/tables if rollback needed.
- Runtime rollback: Coolify redeploy previous image/commit, then run live route and CDN verification.

---

## Research Findings

Public HRIS benchmarks such as Mekari Talenta, Zoho People, BambooHR, Personio, and Gusto converge on these patterns:

- Mobile-first employee self-service.
- Attendance as daily primary action.
- GPS/location validation for distributed teams.
- Shift and schedule awareness.
- Leave and overtime approvals.
- Payroll/payslip privacy.
- Role-specific dashboards.
- Auditability for sensitive HR/payroll changes.
- Reporting and export for HR operations.

MyProdusen should use those patterns as product benchmarks only. Do not copy external branding, protected layouts, screenshots, icons, or marketing wording.

---

## Talenta-Style Benchmark to MyProdusen Mapping

| Area | Benchmark Pattern | MyProdusen Direction | Priority | Status |
| --- | --- | --- | --- | --- |
| Core HR database | Central employee record | Employee/user management with division, position, team, shift, location | High | Keep/finalize |
| ESS mobile | Employee can self-serve routine HR actions | Own attendance, leave, KPI, payroll, profile, notifications | High | Keep/finalize |
| Attendance | Mobile check-in/out with validation | Map-first GPS/geofence then selfie | Critical | Implemented, needs real-device UAT |
| Shift schedule | Work schedule tied to attendance | Shift setup and shift-aware attendance card | High | Keep/finalize |
| Leave/cuti | Request, approval, balance | Employee request, approval, balance/history | High | Keep/finalize |
| Overtime | Approval and payroll input | Overtime approval and payroll integration | Medium | Keep/finalize |
| Payroll | Payslip and payroll runs | Superadmin all, employee/leader own only | High | Keep/finalize |
| KPI/performance | Reviews and score overview | Leader input production, 30/50/20 score, raise estimate | High | Keep/finalize |
| Analytics | HR reports/dashboard | Superadmin executive dashboard and PDF report | Medium | Keep/finalize |
| Audit logs | Sensitive action tracking | Audit routes and sensitive-action logs | High | Keep/finalize |
| Recruitment | ATS/job portal | Not needed for factory operations MVP | Low | Postpone |
| Complex tax/BPJS | Enterprise payroll compliance | Owner/HR policy required before automation | Low | Postpone |
| Bank disbursement | Payment integration | Avoid until payroll policy approved | Low | Postpone |
| 360 review | Enterprise performance review | Not needed for current production flow | Low | Postpone |
| Multi-company | Enterprise structure | Not needed for Produsen Dimsum Medan single operation | Low | Postpone |

---

## Current Capability

### Production roles

- `SUPERADMIN`: company-wide control center.
- `LEADER`: own employee features plus assigned team operational views.
- `EMPLOYEE`: own self-service only.

### Attendance

Final target:

```text
Dashboard
→ Clock In / Clock Out
→ Validasi Lokasi
→ Lanjutkan
→ Selfie
→ Catatan opsional
→ Kirim Absensi
→ History/report sync
```

Backend must remain final validator for GPS, geofence, selfie, ownership, and role eligibility.

### Payroll

- Superadmin sees and manages all payroll.
- Employee sees own payroll only.
- Leader sees own payroll only.
- Leader cannot see team member payroll amount.

### KPI and score

Final formula:

```text
Kehadiran 30%
KPI Produksi 50%
Penilaian Perilaku Kerja 20%
```

Raise projection:

```text
score / 10
```

Displayed as estimate only, final approval by company/Superadmin.

---

## Keep

- Employee database.
- Activation and profile completion.
- Role-specific UX.
- GPS/geofence + selfie attendance.
- Map-first clock flow.
- Shift/location.
- Leave/cuti.
- Overtime.
- KPI production by Leader.
- Payroll/payslip.
- Performance score and raise projection.
- Work start date/duration.
- Chicken attendance streak.
- Notifications.
- Audit logs.
- Executive PDF.
- PWA/mobile-first.
- Cloudflare/CDN safe cache.
- Coolify/Contabo deployment.
- PostgreSQL/Drizzle migrations.

## Add / Finalize Now

- Real-device UAT for GPS/camera on Android and iPhone.
- Authenticated staging E2E with Superadmin/Leader/Employee fixtures.
- Protected avatar/selfie live authorization verification.
- Owner-approved payroll policy document.
- Backup/restore drill evidence.

## Postpone

- Recruitment.
- Reimbursement.
- Complex tax/BPJS automation.
- Bank disbursement.
- Succession planning.
- 360 review.
- Multi-company.
- Marketplace integrations.

## Remove / Avoid

- Copied external UI/branding/assets.
- Enterprise bloat unrelated to factory HR operations.
- Payroll exposure to Leaders for team members.
- Background GPS tracking.
- Raw biometric template storage.
- Public/private media caching.
- Debug UI in production.

---

## Role UX Map

### Superadmin

Control center only:

- Overview dashboard.
- Users/employees.
- Assignment setup.
- Work locations/geofence.
- Shifts.
- Attendance monitoring.
- Corrections and leave approvals.
- KPI setup/review.
- Payroll setup/approval/paid status.
- Performance score overview.
- Executive PDF.
- Notifications.
- Audit logs.

Superadmin must not use employee selfie clock flow.

### Leader

Production supervisor:

- Own attendance.
- Own payroll only.
- Own score only.
- Assigned team only.
- Team attendance summary.
- Team KPI input/overview.
- No team payroll amount.
- No Superadmin settings.
- No self-scoring or outside-team KPI input.

### Employee

Self-service:

- Greeting dashboard.
- Clock In / Clock Out.
- Attendance history.
- Leave request.
- Own KPI.
- Own payslip.
- Own score/raise projection.
- Chicken streak.
- Profile/avatar.
- Work duration.
- Notifications.

---

## Release Checklist

### Local gate

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run release:check`

### Public/live gate

- [ ] `npm run e2e:public`
- [ ] `BASE_URL=https://myprodusen.online npm run verify:live-routes`
- [ ] `npm run verify:cdn`

### Authenticated UAT gate

- [ ] Superadmin staging E2E.
- [ ] Leader staging E2E.
- [ ] Employee staging E2E.
- [ ] Payroll privacy check.
- [ ] Protected avatar/selfie check.

### Real-device UAT gate

- [ ] Android Clock In map.
- [ ] Android selfie submit.
- [ ] Android Clock Out.
- [ ] iPhone Clock In map.
- [ ] iPhone selfie submit.
- [ ] iPhone Clock Out.
- [ ] Outside radius rejection.
- [ ] Manual correction.
- [ ] Superadmin report sync.

### Production signoff gate

Do not sign off production until:

- latest commit redeployed
- production `db:deploy` passed
- public E2E passed
- authenticated E2E passed
- real-device GPS+selfie passed
- protected media verified live
- payroll policy approved
- backup/restore drill passed
- TestSprite passed or owner accepted unavailable
