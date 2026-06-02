# MyProdusen Web App

Internal HRIS web app for Produsen Dimsum Medan. Mobile-first attendance, employee operations, leave, KPI, payroll where enabled, reports, audit logs, notifications, PostgreSQL, Docker, VPS, and Coolify.

## Current Decisions

- Stack: Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL.
- Roles: `SUPERADMIN`, `LEADER`, `EMPLOYEE`.
- Deployment: VPS + Coolify + Docker + persistent `/app/uploads` volume.
- Database: Drizzle SQL migrations via `npm run db:deploy`.
- Payroll: active when implementation is enabled and documented; employee sees own data only, Superadmin manages payroll.

## Quick Start

```bash
npm install
cp .env.example .env
npm run db:deploy
npm run dev
```

Open `http://localhost:3000`.

Local seed login emails are `admin@myprodusen.com`, `employee1@myprodusen.com`, and `employee2@myprodusen.com`. Passwords come from `SEED_SUPERADMIN_PASSWORD` and `SEED_EMPLOYEE_PASSWORD`; never commit or document real passwords.

## Verification

```bash
npm run lint
npm run test
npm run build
npm run release:check
```

Optional live checks:

```bash
npm run e2e:public
npm run e2e:staging
BASE_URL=https://myprodusen.online npm run verify:live-routes
```

## Documentation Map

- Product: [`docs/prd.md`](docs/prd.md)
- Product gap analysis: [`docs/PRODUCT_GAP_ANALYSIS.md`](docs/PRODUCT_GAP_ANALYSIS.md)
- Design: [`docs/DESIGN.md`](docs/DESIGN.md)
- Database: [`docs/DATABASE.md`](docs/DATABASE.md)
- Security: [`docs/SECURITY.md`](docs/SECURITY.md)
- UI/UX: [`docs/UI_UX_GUIDE.md`](docs/UI_UX_GUIDE.md)
- Go-live: [`docs/GO_LIVE_STEPS.md`](docs/GO_LIVE_STEPS.md)
- Testing: [`docs/TESTING_QA.md`](docs/TESTING_QA.md)
- Release: [`docs/FINAL_CHECKLIST.md`](docs/FINAL_CHECKLIST.md)
- Test fixes: [`docs/TEST_FIX_REPORT.md`](docs/TEST_FIX_REPORT.md)
- History: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)
- Design references: [`docs/references/README.md`](docs/references/README.md)

Root markdown is limited to `README.md` and `AGENTS.md`. Other docs live in `/docs`.

## Safety

Never commit `.env`, secrets, database dumps, upload archives, private selfies, payroll exports, or destructive migrations. Backend RBAC is mandatory; frontend visibility is never the security source of truth.

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
