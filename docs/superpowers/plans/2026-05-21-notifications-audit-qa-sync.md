# Notifications Audit QA Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Wave 5 notifications, audit logs, realtime/read states, and QA/release hardening consistently synced across UI, API, services, Drizzle, PostgreSQL, and docs.

**Architecture:** Notifications remain per-user and backend-owned. Audit logs remain Superadmin-only and no-store. Add additive indexes where notification/audit queries need support.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Vitest.

---

## Tasks
- [ ] Audit notification routes/services/pages for read state, mark all, ownership.
- [ ] Audit audit route/page for Superadmin-only access and safe no-store behavior.
- [ ] Add additive indexes only if missing for notification unread lists and audit entity/action lookup.
- [ ] Add sync UI sections to notifications and audit pages if missing.
- [ ] Update docs and run full release checks.
