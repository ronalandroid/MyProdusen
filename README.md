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

- Product: [`docs/prd/README.md`](docs/prd/README.md)
- Architecture: [`docs/architecture/README.md`](docs/architecture/README.md)
- Database: [`docs/database/README.md`](docs/database/README.md)
- Security: [`docs/security/README.md`](docs/security/README.md)
- UI/UX: [`docs/ui-ux-guide/README.md`](docs/ui-ux-guide/README.md)
- Deployment: [`docs/deployment/README.md`](docs/deployment/README.md)
- Testing: [`docs/testing-qa/README.md`](docs/testing-qa/README.md)
- Operations: [`docs/operations/README.md`](docs/operations/README.md)
- Release: [`docs/final-checklist/README.md`](docs/final-checklist/README.md)
- History: [`docs/changelog/README.md`](docs/changelog/README.md)
- Design references: [`docs/references/README.md`](docs/references/README.md)

Root markdown is limited to `README.md` and `AGENTS.md`. Other docs live in `/docs`.

## Safety

Never commit `.env`, secrets, database dumps, upload archives, private selfies, payroll exports, or destructive migrations. Backend RBAC is mandatory; frontend visibility is never the security source of truth.
