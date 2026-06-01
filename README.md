# MyProdusen Web App

Internal HRIS web app for Produsen Dimsum Medan. Mobile-first attendance, employee operations, leave, KPI, payroll where enabled, reports, audit logs, notifications, PostgreSQL, Docker, VPS, and Coolify.

## Current Decisions

- Stack: Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL.
- Roles: `SUPERADMIN`, `EMPLOYEE`.
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
