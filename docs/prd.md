# PRD — MyProdusen HRIS Web App

**Project:** MyProdusen HRIS & Employee Operations Web App<br>
**Client:** Produsen Dimsum Medan<br>
**Group:** TBM Group<br>
**Platform:** Mobile-first web app, desktop optimized for Superadmin<br>
**Production:** VPS + Coolify + Docker + PostgreSQL<br>
**Status:** Canonical PRD, final sync<br>
**Last Updated:** 2026-06-01

---

## 1. Product Summary

MyProdusen is internal HRIS and employee operations app for Produsen Dimsum Medan. It digitizes employee identity, attendance, leave/permission/sick workflow, KPI, payroll visibility, notifications, reports, and audit-ready HR operations.

Primary goals:
- Replace paper attendance and spreadsheet recaps.
- Centralize employee/user data.
- Enforce GPS + geofence + realtime selfie attendance.
- Give Superadmin full operational control and reports.
- Give Leader team-scoped KPI and employee oversight.
- Give Employee self-service HRIS from phone.
- Preserve production safety: no destructive database action, no public private files, no fake pass.

---

## 2. Roles and Access

Production roles only:

| Role | Scope |
| --- | --- |
| `SUPERADMIN` | Full system management: users, employees, role/placement, locations, shifts, attendance reports, payroll, KPI, leave, audit, settings. |
| `LEADER` | Employee self-service plus team-scoped KPI/team views for assigned members only. |
| `EMPLOYEE` | Own dashboard, attendance, leave/sick/permission, KPI, payroll, notifications, profile. |

Rules:
- `ADMIN_HR` and `SUPERVISOR` are historical database values only. Do not expose in production UI or grant new access.
- Public register always creates inactive `EMPLOYEE`.
- Superadmin assigns role, team, division, position, shift, location.
- Employee sees own data only.
- Leader sees assigned team only.
- Protected API must enforce server-side RBAC.
- Inactive users cannot login.

---

## 3. Brand and UX Direction

Required style:
- MyProdusen yellow/cream visual language.
- Mascot/logo preserved.
- Rounded cards, warm gradients, mobile-first tone.
- Bahasa Indonesia primary UI.
- Clear empty, loading, error, success, and disabled states.
- 44px+ mobile tap targets.
- No broad redesign without product approval.

---

## 4. Core Modules

### 4.1 Public, Auth, and Activation

Requirements:
- Landing page with MyProdusen brand and CTA.
- Login by username/email + password.
- Public register creates inactive `EMPLOYEE` only.
- Account activation email via Resend.
- Activation link `/activate-account?token=...`.
- Forgot password and reset password.
- Password policy enforced server-side.
- Auth/session cookies secure in production.

### 4.2 Dashboard

Dashboard depends on role:
- Superadmin: operational metrics, reports, approvals, data management.
- Leader: self-service plus team overview/KPI.
- Employee: attendance card, personal status, leave/payroll/KPI/notification shortcuts.

Employee/Leader Beranda must show clear attendance card with:
- Clock In button.
- Clock Out button.
- Today status.
- Shift/location context.
- History summary.

### 4.3 Attendance

Attendance is critical production flow.

Required current flow:
1. User opens Beranda.
2. User sees attendance card with `Clock In` and `Clock Out`.
3. User taps button.
4. First screen is realtime map/location validation.
5. Screen title: `Validasi Lokasi`.
6. Show map-style UI or Google Maps-compatible map with:
   - current user location,
   - office/work location,
   - radius circle,
   - distance to office,
   - GPS accuracy,
   - inside/outside radius status.
7. If inside radius, user taps `Lanjutkan`.
8. Selfie screen opens after location step only.
9. Selfie camera uses realtime camera, no manual gallery upload.
10. User taps `Ambil Foto`.
11. User can retake photo.
12. Optional `Catatan (opsional)` available.
13. User submits `Kirim Clock In` or `Kirim Clock Out`.
14. Backend validates selfie, GPS, accuracy, timestamp, geofence, role, and active state.
15. Superadmin reports/history update from persisted attendance data.

Current routes:
- `/dashboard/attendance/clock?type=clock-in`
- `/dashboard/attendance/clock?type=clock-out`
- `/dashboard/attendance/capture` redirects to map-first clock route.

Hard requirements:
- No attendance without selfie.
- No attendance without GPS.
- No gallery picker/manual selfie upload.
- No Superadmin normal employee attendance submit.
- No frontend-only geofence trust.
- Outside radius normal submit blocked; manual correction requires Superadmin approval/audit.
- Private selfie route protected.
- Attendance API responses no-store/private.

### 4.4 Work Location, Shift, and Geofence

Requirements:
- Superadmin manages work locations.
- Location has latitude, longitude, radius.
- Employee has default work location and shift.
- Attendance records distance, accuracy, status, device metadata, timestamp.
- Work location changes do not mutate historical records.

### 4.5 Leave, Sick, Permission

Requirements:
- Employee submits leave/sick/permission.
- Leader/Superadmin approval workflow per policy.
- Balance tracking for leave.
- Status: pending, approved, rejected.
- Attachment support where needed.
- Audit trail for approvals.

### 4.6 KPI and Performance

Requirements:
- KPI templates/targets managed by Superadmin.
- Leader can input/assess KPI only for assigned team members.
- Employee can view own KPI and performance history.
- Performance score can include attendance, KPI, and behavior/culture score.
- Gamification/badges optional but production-safe.
- No employee mutation of own KPI.

### 4.7 Payroll

Requirements:
- Employee can view own payroll/slip.
- Superadmin manages payroll periods, structure, rules, and reports.
- Payroll respects attendance policy and period lock.
- Payroll data protected; no public cache.
- Historical payroll data must not be destructively reset.

### 4.8 Notifications and Email

Requirements:
- In-app notifications for account, approval, attendance/payroll/KPI events as needed.
- Email templates use MyProdusen brand.
- Email logs/audit for delivery-sensitive flows.

### 4.9 Reports and Export

Requirements:
- Superadmin reports for attendance, employee, leave, KPI, payroll.
- Export/PDF endpoints protected.
- No sensitive report route public.
- Report routes must use no-store/private cache.

### 4.10 Audit and Security

Requirements:
- Audit sensitive operations.
- Validate env before production start.
- Private uploads stored in persistent volume.
- No public direct access to private selfies/attachments.
- Rate-limit sensitive auth flows.
- No secrets in repository.
- No destructive production DB actions.

---

## 5. Data and Deployment

Database:
- PostgreSQL production database.
- Drizzle SQL migrations.
- Deploy migrations through `npm run db:deploy` or approved deploy runner.
- No production reset.
- No hard delete for records with history.

Storage:
- Persistent upload volume for selfie/attachments.
- Private file serving through protected routes.

Deployment:
- Next.js standalone Docker build.
- Coolify/VPS production target.
- `/api/health` required.
- CDN/static assets may cache immutable files.
- Auth/API/private routes must be no-store/private.

---

## 6. Current Release Gates

Required before redeploy:

```bash
git diff --check
npm run lint
npm run test
npm run build
npm run release:check
npm run e2e:public
BASE_URL=https://myprodusen.online npm run verify:live-routes
npm run verify:cdn
```

Authenticated E2E when credentials available:

```bash
E2E_BASE_URL=https://myprodusen.online npx playwright test tests/e2e/leader-staging.spec.ts --project=desktop-1440 --workers=1 --reporter=list
E2E_BASE_URL=https://myprodusen.online npx playwright test tests/e2e/employee-staging.spec.ts --project=desktop-1440 --workers=1 --reporter=list
E2E_BASE_URL=https://myprodusen.online npx playwright test tests/e2e/staging-smoke.spec.ts --project=desktop-1440 --workers=1 --reporter=list
```

Real device UAT required for GPS/camera:
- Android Chrome.
- iPhone Safari.
- Inside radius Clock In.
- Inside radius Clock Out.
- Outside radius block/manual correction.
- Camera permission denied handling.
- Location permission denied handling.
- Superadmin report/history verification.

---

## 7. Source of Truth Docs

Keep these project docs:
- `README.md` — setup and project overview.
- `AGENTS.md` — agent/project operating rules.
- `docs/prd.md` — canonical product requirements.
- `docs/SECURITY.md` — security model.
- `docs/DATABASE.md` — database/migration notes.
- `docs/DESIGN.md` — design principles.
- `docs/UI_UX_GUIDE.md` — UI/UX details.
- `docs/TESTING_QA.md` — QA strategy.
- `docs/FINAL_CHECKLIST.md` — release checklist.
- `docs/GO_LIVE_STEPS.md` — deploy/go-live steps.
- `docs/CHANGELOG.md` — product change log.
- `docs/manual-real-device-uat.md` — manual device UAT.
- `docs/ANDROID_REAL_DEVICE_TEST.md` — Android-specific UAT.
- `docs/TEST_FIX_REPORT.md` — recent fix/test report.

All old PRD fragments, duplicate folder READMEs, temporary rewrite summaries, and historical implementation plans are non-canonical and removed from active docs.

---

## 8. Non-Negotiables

- No fake pass.
- No destructive DB action.
- No broad redesign.
- Preserve MyProdusen yellow/cream style, mascot, rounded cards, mobile-first tone.
- Production code changes require tests first unless user explicitly exempts docs/config.
- Attendance map/location step must appear before selfie.
- Backend remains final authority for RBAC, GPS, geofence, selfie, and reports.
---

## 9. Talenta-style professional HRIS UX principles

Benchmark direction uses public HRIS/SaaS patterns only; do not copy proprietary Mekari Talenta assets. MyProdusen keeps yellow/cream brand, mascot, rounded cards, and mobile-first tone.

Principles:
- Today-first dashboard: show attendance status, shift, approvals, leave balance, payroll cycle, KPI progress, and exceptions before secondary content.
- Role-specific navigation: Superadmin gets operational control, Leader gets team/action inbox, Employee gets self-service.
- Admin flows as checklist: payroll, KPI review, leave approval, and attendance correction show step, status, validation, and next action.
- Tables on desktop, cards on mobile.
- Use status chips consistently for present, late, pending, approved, rejected, paid, unpaid, reviewed, and critical states.
- Use approval timeline for leave, correction, payroll, and KPI review history.
- Surface policy before failure: leave balance, geofence radius, payroll lock, KPI deadline, required attachment.
- payroll checklist must show period, input validation, preview, approval, publish, and payslip visibility.
- Use professional Bahasa Indonesia microcopy: clear action verbs, no raw backend terms, no confusing historical roles.
- Empty/error/loading states must explain next step.

## Professional Gamification System

### Purpose
Gamification exists to help employees understand attendance, production KPI, behavior score, and annual raise projection in a motivating but professional way. MyProdusen remains a professional HRIS first; fun motivation is secondary and must support factory/team productivity.

### Formula
Total score is 100 points:

- Attendance / Kehadiran: 30%.
- Production KPI: 50%.
- Behavior / Perilaku Kerja: 20%.

Every new employee starts at 100. Score changes must come from real attendance, KPI, and behavior/culture score data only.

### Annual Raise Projection
Default projection:

- Score 100 = up to 10% raise projection.
- Score 60 = up to 6% raise projection.
- Formula: `score / 10`.

Projection is an estimate only and must wait for Superadmin/company owner evaluation and approval. It must not be presented as guaranteed salary change.

### Required Gamification UI Components
Keep gamification focused on these elements only:

1. Main score card.
2. Attendance streak calendar.
3. Raise projection/progress card.
4. Achievement badges, maximum 3–5 visible.
5. Simple motivational copy.

Avoid too many badges, noisy animation, excessive colors, game-like clutter, childish UI, fake numbers, payroll privacy leaks, and generic AI-dashboard appearance.

### Attendance Streak Calendar
Monthly view states:

- Attended day = active chicken marker.
- Today = highlighted ring.
- Leave day = soft leave indicator.
- Holiday/off day = grey/neutral marker.
- Absent day = muted warning.
- Future day = empty/neutral.

### Achievement Badges
Recommended badges:

- 7 hari hadir.
- 14 hari konsisten.
- 30 hari konsisten.
- Tepat waktu 7 hari.
- KPI target tercapai.

Do not add excessive badges. Badge visibility should remain compact and mobile-first.

### Role Access
Employee sees own score, own streak, own badges, and own raise projection only.

Leader sees own score/streak plus assigned team attendance and KPI summary only. Leader must not see team salary, payroll amount, or private payslip data.

Superadmin sees company performance overview, division/team/month filters where available, all employee score summaries, top performers, at-risk employees, behavior score input/review, and report export if already supported.

### Privacy and Data Integrity
Gamification must not expose payroll details to Leader or other employees. No fake score, mock attendance, or fake KPI is allowed in production. Private gamification endpoints must use authenticated RBAC and no-store/private cache where sensitive.

## MyProdusen MVP Finalization Scope — Produsen Dimsum Medan

MVP scope is intentionally limited to operational HRIS flows needed for daily use:

1. Absensi selfie + geotag/geofence.
2. Payroll/gajian sederhana.
3. KPI produksi sync.
4. Pengajuan cuti + saldo cuti.
5. Role-based dashboard for `SUPERADMIN`, `LEADER`, and `EMPLOYEE` only.

Postponed/non-MVP: recruitment, complex BPJS/tax automation, bank disbursement, 360 review, reimbursement, multi-company, enterprise workflow builder, and extra roles such as `ADMIN_HR` or `SUPERVISOR`.

### Attendance MVP

Employee/Leader dashboard flow: Clock In/Clock Out → GPS/map validation → distance/radius status → selfie capture → optional note → submit → attendance history refresh. Backend must require authenticated employee profile, assigned active shift, assigned active work location, GPS evidence, selfie evidence, geofence validation, protected selfie storage, and audit-sensitive action logging. Superadmin does not use normal attendance CTA.

### Payroll/Gajian MVP

Superadmin owns payroll setup, calculation review, period/status control, payslip/report access, and approval/payment state. Employee and Leader can see own payroll/payslip only. Leader cannot see assigned-team salary, payroll amount, payslip, or payroll export. Payroll breakdown should remain simple: base salary, KPI bonus if configured, attendance deduction, holiday multiplier if supported, and final amount.

### KPI Production MVP

Leader inputs production KPI only for assigned team members. Leader outside-team input is blocked. Leader self-KPI input stays blocked unless an explicit env/policy allows it. Employee sees own KPI read-only. Superadmin can see all KPI, configure target/rules where available, and filter by division/team/month where available.

### Leave/Cuti MVP

Employee and Leader can submit leave request with reason/date/duration, see status, and consume balance only through approved flow. Server blocks overlap and insufficient balance with `LEAVE_BALANCE_INSUFFICIENT`. Leave balance changes are append-only ledger events. Superadmin approves/rejects and may adjust balance through ledgered workflow.

### MVP Release Rule

No fake GPS, fake selfie, fake KPI, fake payroll, or fake leave balance may be marked pass. Real-device attendance and authenticated UAT remain required before production signoff.


## TBM Division & Payroll Master Data

MyProdusen supports configurable TBM master data for `Administrasi`, `Produksi`, `Packing`, and `BEGE`. Superadmin manages divisions, positions, payroll rules, and employee payroll placement from “Struktur Divisi & Gaji”. Defaults are editable seed data, not locked business constants.

Default payroll rules seed:
- Admin Training: Administrasi/Admin monthly training Rp2.000.000 and full Rp2.300.000.
- Produksi Harian: Produksi daily Rp60.000/day.
- Packing Harian: Packing daily Rp60.000/day.
- Produksi Cetak Perempuan: Produksi/Produksi Cetak daily Rp50.000/day.
- Adon Helper Laki-laki: Produksi/Adon Helper daily Rp60.000/day.
- BEGE Default: configurable daily default with custom amount.

Salary privacy: Superadmin can manage and report all salary rules. Employees can read only their own salary rule and payslip. Leaders can see attendance, KPI, score, and production progress only; leaders must not see team salary amounts. Employee-specific custom overrides beat division/position defaults. Training status resolves training salary until training ends, then full salary.
