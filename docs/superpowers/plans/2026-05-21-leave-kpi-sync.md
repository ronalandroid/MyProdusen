# Leave KPI Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Wave 3 Leave + KPI modules consistently synced across UI, API, services, Drizzle, PostgreSQL, approval locks, balances, overlap validation, and docs.

**Architecture:** Backend remains source of truth for leave overlap/balance/status and KPI template weight/result approval. Add only additive indexes for approval/report queues if gaps exist.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Vitest.

---

## Tasks
- [ ] Audit leave schema/service/routes for balance, overlap, approval/rejection reason.
- [ ] Audit KPI schema/service/routes for template weight 100, scoring, approved result locks.
- [ ] Add additive indexes only if missing for employee/status/period approval queues.
- [ ] Add sync sections to Leave Balance, KPI Template, KPI Templates if missing.
- [ ] Update docs and run full release checks.
