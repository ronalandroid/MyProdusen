# UI Production Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make login, dashboard home, and mobile shell production-grade without broad feature refactor.

**Architecture:** Keep scope surgical. Improve global tokens/layout CSS, replace overloaded nav behavior, and upgrade login/dashboard markup semantics while preserving existing API wiring. Avoid fake production data where backend is missing.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind, CSS variables, lucide-react.

---

### Task 1: Layout And Tokens

**Files:**
- Modify: `app/globals.css`
- Modify: `components/layout/Sidebar.tsx`

- [ ] Darken semantic text/status tokens for WCAG-friendly UI.
- [ ] Add focus-visible styles for nav, buttons, inputs, and cards.
- [ ] Make bottom nav show primary mobile items only; keep full desktop sidebar scrollable.
- [ ] Add viewport-safe content padding and remove cramped mobile layout risks.

### Task 2: Login Production UX

**Files:**
- Modify: `app/login/page.tsx`

- [ ] Replace raw inline mobile-only page with responsive auth shell.
- [ ] Add accessible labels, `aria-invalid`, password toggle label, and visible error panel.
- [ ] Remove fake/dead SSO path from primary flow.
- [ ] Improve loading/disabled states and mobile/desktop visual hierarchy.

### Task 3: Dashboard Production UX

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] Replace clickable `div`s with `button` or `Link`.
- [ ] Show API error/empty state instead of silent zero-only UI.
- [ ] Remove fake KPI/weekly attendance claims; show unavailable state until real data exists.
- [ ] Make attendance CTA and today status primary.

### Task 4: Verification

**Commands:**
- Run: `npm run lint`
- Run: `npm run build`

- [ ] Fix only UI-scope issues introduced by this pass.
- [ ] Report any unrelated existing failures separately.
