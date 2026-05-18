# Frontend / Backend Sync Audit — 2026-05-18

Scope: dashboard pages and API routes used directly by those pages. The goal is to keep frontend fetch handling and backend JSON responses aligned with the standard response envelope from `docs/prd.md` and `src/utils/response.ts`.

## Baseline evidence

- Frontend scan found dashboard pages calling announcements, overtime, payroll, documents, reports, attendance, leave, users, employees, locations, notifications, and KPI APIs.
- Most mature modules already returned `{ success, data, message, error }` via `@/utils/response`.
- Announcements, overtime, and payroll route groups returned raw `{ data }` and `{ error }` envelopes. Those still worked for some pages using `response.ok`, but were inconsistent with project API contract and other frontend modules that check `payload.success`.

## Fixed contract drift

| Area | Frontend page | Backend route group | Before | After |
| --- | --- | --- | --- | --- |
| Announcements | `app/dashboard/announcements/page.tsx`, `app/dashboard/announcements/[id]/page.tsx` | `app/api/announcements/**/route.ts` | Raw `NextResponse.json({ data })` / `{ error }` | `successResponse`, `errorResponse`, `unauthorizedResponse`, `forbiddenResponse`, `validationErrorResponse` |
| Overtime | `app/dashboard/overtime/page.tsx` | `app/api/overtime/rates/route.ts`, `app/api/overtime/requests/**/route.ts` | Raw `{ data }`, raw auth/validation errors | Standard response helpers with preserved `data` key and HTTP status |
| Payroll | `app/dashboard/payroll/page.tsx`, `app/dashboard/payroll/[id]/page.tsx`, `app/dashboard/payroll/structures/page.tsx` | `app/api/payroll/runs/**/route.ts`, `app/api/payroll/structures/**/route.ts` | Raw `{ data }`, raw auth/not-found errors, ad-hoc delete success | Standard response helpers with `{ success: true, data }` and `{ success: false, error, message }` |

## Guard added

`tests/api/frontend-backend-contract.test.ts` lists frontend-used dashboard JSON routes that must use `@/utils/response` and must not return raw `{ data }` / `{ error }` from `NextResponse.json`.

RED result before fix: 13/13 routes failed the contract test.
GREEN result after fix: 13/13 routes passed.

## Notes

- `/api/health`, realtime, and offline sync endpoints were not normalized because they have specialized response contracts or are not dashboard JSON CRUD endpoints.
- CSV report endpoints keep CSV responses for `format=csv`; JSON paths already use `successResponse`.
- No database schema or RBAC weakening was required.
