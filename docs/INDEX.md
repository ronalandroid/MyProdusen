# Documentation Index

> **AI agent role source of truth:** MyProdusen production uses exactly two user-facing account roles: `SUPERADMIN` and `EMPLOYEE`. Legacy `ADMIN_HR` and `SUPERVISOR` references are historical only and must not be used for new UI/UX, docs, tests, or route access.


Current canonical docs only. Historical markdown archive has been removed to keep AI agents focused on current rules.

## Product & process

| File | Purpose |
| ---- | ------- |
| [prd.md](./prd.md) | Highest source of truth: scope, roles, MVP, phased features |
| [AGENTS.md](./AGENTS.md) | Working rules for any agent or contributor (selfie, brand, secrets) |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Phased roadmap, including completed workstreams |
| [FINAL_CHECKLIST.md](./FINAL_CHECKLIST.md) | Pre-release verification list |
| [REFERENCE_REPO_ANALYSIS.md](./REFERENCE_REPO_ANALYSIS.md) | What we learned from external attendance projects (research only) |

## Engineering

| File | Purpose |
| ---- | ------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack overview, request flow, OOP-friendly service pattern |
| [DATABASE.md](./DATABASE.md) | Drizzle schema and migration register |
| [SECURITY.md](./SECURITY.md) | RBAC rules, audit log scope, GPS + selfie hardening |
| [REPORTS.md](./REPORTS.md) | Attendance reports, exports, audit-logged CSV |
| [TESTING.md](./TESTING.md) | How to run tests and what is covered |
| [UI_UX_GUIDE.md](./UI_UX_GUIDE.md) | Brand tokens, mobile-first patterns, design board ↔ live module map, responsive audit log |
| [references/](./references/README.md) | Locked design source-of-truth: screenshots + per-screen checklist + email style guide |

## Setup & deployment

| File | Purpose |
| ---- | ------- |
| [INSTALLATION.md](./INSTALLATION.md) | Local installation steps |
| [QUICK_START.md](./QUICK_START.md) | Five-minute developer onboarding |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | VPS + Coolify rollout, env vars, backup/restore |
| [COOLIFY.md](./COOLIFY.md) | Coolify-specific config and persistent storage |
| [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) | Standalone backup, restore, and staging drill runbook |

## Archive

Historical / restructure / phase memorial markdown files have been removed.
Keep current status in canonical docs only.
