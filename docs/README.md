# MyProdusen — Documentation

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


**Project:** Employee Management System for Produsen Dimsum Medan
**Stack:** Next.js (App Router), TypeScript, Drizzle ORM, PostgreSQL, Tailwind CSS, Docker, VPS + Coolify
**Status:** Production-ready (verified by lint + 206 tests + production build).

> The canonical product brief is `prd.md`. Everything else is implementation,
> deployment, security, or workflow detail.

## Where to start

| If you want to... | Read |
| ----------------- | ---- |
| Understand the product scope | [prd.md](./prd.md) |
| See the doc map | [INDEX.md](./INDEX.md) |
| Set up locally | [INSTALLATION.md](./INSTALLATION.md) → [QUICK_START.md](./QUICK_START.md) |
| Understand the code layout | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Add or change a database table | [DATABASE.md](./DATABASE.md) |
| Touch attendance/selfie/GPS code | [SECURITY.md](./SECURITY.md) + [AGENTS.md](./AGENTS.md) |
| Build or change a report | [REPORTS.md](./REPORTS.md) |
| Run the test suite | [TESTING.md](./TESTING.md) |
| Match the live UI to the design boards | [references/README.md](./references/README.md) |
| Deploy to Coolify | [DEPLOYMENT.md](./DEPLOYMENT.md) → [COOLIFY.md](./COOLIFY.md) |
| Plan the next sprint | [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) |
| Cut a release | [FINAL_CHECKLIST.md](./FINAL_CHECKLIST.md) |
| Compare to external attendance projects | [REFERENCE_REPO_ANALYSIS.md](./REFERENCE_REPO_ANALYSIS.md) |

## Doc rules (short version)

1. New product/architecture docs live in `/docs/`. The only Markdown allowed at
   the repo root is `README.md` and `AGENTS.md`.
2. Do not create dated "PHASE_X_COMPLETE" memorial docs at the top level.
   Keep status updates inline in `IMPLEMENTATION_PLAN.md`.
3. Treat `prd.md` as the highest source of truth. Anything that contradicts it
   loses.
4. When you change behaviour, update the matching doc in the same commit.
5. Use Indonesian only inside user-facing strings; documentation stays in
   English so it travels well across teams.

## Brand guardrails

- Yellow `#FFC107`, red `#E53935`, black `#111111`, soft gray `#F5F5F5`.
- No design-system swap, no Bootstrap/Tabler, no jQuery.
- No Prisma, no Eloquent, no Laravel migrations. Drizzle only.
- No public uploads folder. All selfies live behind authenticated API routes.

## Archived docs

Historical / restructure / phase memorial markdown files have been removed.
Keep current status in canonical docs only.
