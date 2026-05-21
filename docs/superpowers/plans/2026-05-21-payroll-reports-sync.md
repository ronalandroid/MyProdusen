# Payroll Reports Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Wave 4 Payroll + Reports consistently synced across UI, API, services, Drizzle, PostgreSQL, protected payslips, exports, filters, no-store headers, audit logs, and docs.

**Architecture:** Keep payroll/report access decisions server-side. Add additive indexes where report/payroll queries need support. Keep employee payroll and payslip private.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Vitest.

---

## Tasks
- [ ] Audit payroll schema/services/routes for employee isolation, payslip access, export audit/no-store.
- [ ] Audit report routes for filters, RBAC, export audit/no-store.
- [ ] Add additive indexes only if missing for payroll periods/runs/items/reports.
- [ ] Add sync sections to payroll, payroll me, structures, report PDF if missing.
- [ ] Update docs and run full release checks.
