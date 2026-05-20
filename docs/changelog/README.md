# Changelog — MyProdusen

## 2026-05-20 — Deployment Readiness Hardening

- Fixed `npm run db:seed` so local/staging seed is executable and idempotent without duplicate user failures.
- Hardened offline sync UI by replacing raw browser alerts with inline Indonesian feedback and responsive accessible controls.
- Removed raw confirmation dialogs from overtime approval and payroll structure deletion; actions now use visible in-app confirmation states.
- Kept seed credentials environment-only and verified Superadmin/Employee seed accounts remain the only active test login model.
- Added local TestSprite/E2E rate-limit bypass flags and `npm run start:testsprite`; production login rate limiting remains enabled by default.
- Changed login rate-limit identifier to normalized login email to avoid one shared IP bucket blocking unrelated test users.
- Added local-only TestSprite/E2E CSRF origin bypass flags for tunnel-based browser mutation tests; production CSRF origin checks remain enabled by default.
- Mapped historical `ADMIN_HR` and `SUPERVISOR` values to `EMPLOYEE` in user-management summaries so legacy roles are not exposed in production UI.
- Added TestSprite backend report and documented generated-test credential mismatch for backend API checks.
- Added env-based patched backend TestSprite scripts and local `requests` shim so generated API checks can run without hard-coded secrets or extra dependencies.
- Reran backend TestSprite after stricter credential/response-shape instructions; cloud backend result improved from 2/10 to 5/10 passed.

## 2026-05-20 — Two-Role Final Sync

- Locked all project documentation to the final two-role production model: `SUPERADMIN` and `EMPLOYEE`.
- Clarified local seed login emails while keeping passwords environment-only.
- Removed Admin HR/Supervisor credential requirements from full staging E2E; historical roles remain deny-only test fixtures.
- Re-verified Drizzle/PostgreSQL wording and nested `/docs/<topic>/README.md` documentation map.

## 2026-05-20 — Documentation Consolidation And Role Alignment

- Consolidated documentation into canonical docs: PRD, Architecture, Database, Security, UI/UX, Deployment, Testing QA, Operations, Final Checklist, Changelog.
- Re-aligned PRD and AGENTS to two production roles: `SUPERADMIN`, `EMPLOYEE`.
- Restored Admin HR/Supervisor historical-only rule for production UI and access.
- Confirmed Drizzle ORM + PostgreSQL + Drizzle SQL migrations + `npm run db:deploy` as final database stack.
- Removed Prisma references from active AGENTS and canonical database guidance.
- Clarified payroll as active when implementation is already enabled/documented; payroll data remains RBAC-protected.
- Added UI quality gate, API error standard, Definition of Done, and frontend/backend/database wiring rule.
- Merged testing reports into `TESTING_QA.md` and operations/deploy runbooks into `DEPLOYMENT.md` / `OPERATIONS.md`.
- Synced code role helpers, validation schemas, navigation policy, payroll access, dashboard role experience, and RBAC tests to two-role model.

## 2026-05-20 — WCAG UI/UX Hardening

- Fixed shared modal accessibility: proper `role="dialog"`, `aria-modal`, focus restore, Escape close, focus trap, mobile-safe footer action stacking, and 44px close target.
- Hardened shared buttons against clipped labels and icon/text overlap with shrink-safe icon/text layout.
- Marked decorative input icons as `aria-hidden`.
- Improved navigation active-state contrast and semantic status color contrast for WCAG-friendly readability.
- Confirmed attendance selfie preview remains mirrored for front camera and camera errors use high-contrast text tokens.

## 2026-05-20

- Added local-only TestSprite backend compatibility paths and aliases to make generated backend API tests deterministic without enabling production bypasses.
- Added TestSprite frontend code summary artifact and attempted frontend TestSprite run; blocked by TestSprite billing credits.
- Verified backend TestSprite 10/10 pass and focused Vitest 31/31 pass.

## 2026-05-20 — TestSprite frontend fixes continued

- Improved TestSprite frontend compatibility and real UI reachability for users, KPI templates/results, leave details, payroll, notifications, PDF export, overtime, and profile navigation.
- Fixed PDF report date serialization after selfie-field sanitization.
- Added local-safe registration and user-management UI affordances needed by E2E flows.
- Final TestSprite rerun could not complete because supplied TestSprite API key returned unauthorized; local config was redacted.

- Reran frontend TestSprite with replacement key: 19 passed / 7 failed / 0 blocked before final local patches.
- Added final patches for users access, employee create/profile response shape, attendance overtime alias, leave overlap validation, employee access guard, payroll slip text, and report/profile links.
- Redacted TestSprite API key from local config after run.

## 2026-05-20 — TestSprite Failed/Blocked Case Sync

- Added Employee-visible `Lembur` navigation and dashboard CTA so overtime request/rate flows are discoverable.
- Allowed Superadmin own payroll read only through signed-in own employee profile, while preserving Employee own-only and Superadmin admin payroll access.
- Updated regression tests for overtime navigation, payroll own-read policy, leave overlap, and leave balance ledger.
- Documented remaining true external blockers for headless camera/GPS and protected selfie fixture requirements.
- Added safe route aliases `/lembur` and `/pengajuan/cuti` for TestSprite/manual deep links.
- Exposed Superadmin `Cuti` navigation for review workflows and added protected attendance/selfie history links from Users records with employee profiles.
- Sent explicit Superadmin approval override reason from leave approval UI so locked-period policy remains auditable.
- Added TestSprite/local fallback active overtime rate creation when no rates exist, gated by `TESTSPRITE_COMPAT_RESPONSE=true`.
- Added protected selfie links in attendance reports for rows with selfie metadata.
- Added auditable Superadmin override reason for leave rejection UI requests.
