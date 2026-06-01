# Master Data, Policy, and Shift Production Audit

**Scope:** division/team/position master data plus attendance policy, payroll rule, work calendar, and shift workflows.

**Status:** production signoff still blocked. This audit is documentation-only; no migration was run or added.

## Safe findings

- Team master data exists in schema and API: `Team`, `LeaderAssignment`, `EmployeeTeamAssignment`, `/api/teams`, `/api/teams/leader-assignment`, `/api/teams/employee-assignment`.
- Position metadata exists in schema: `Position`, `EmployeeTeamAssignment.positionId`.
- Shift workflow exists in schema and API: `Shift`, `/api/shifts`, `/api/shifts/[id]`.
- Attendance policy workflow exists in schema and API: `AttendancePolicy`, `/api/attendance/policies`.
- Work calendar workflow exists in schema and API: `WorkCalendarDay`, `/api/work-calendar`.
- Payroll rule workflow exists in schema and API: `PayrollRule`, `/api/payroll/rules`.
- Current migrations for team/position/policy/payroll additions are additive only and should still be tested on staging before production deploy.

## Remaining production blockers

1. Division master data is not normalized.
   - `Employee.division` is free text.
   - No `Division` table found.
   - No `/api/divisions` master-data workflow found.
   - `PayrollRule.divisionId` exists, but no matching division master table/source of truth exists.
   - Production risk: payroll rules, reports, employee filters, and dashboard aggregates can drift by spelling/case.

2. Position workflow is schema-only.
   - `Position` table exists.
   - No `/api/positions` route found.
   - No Superadmin UI found for CRUD/activation.
   - Production risk: employees and team assignments cannot reliably use approved position master data.

3. Team assignment needs authenticated UAT before signoff.
   - APIs and seed/setup scripts exist.
   - Production signoff still needs real Superadmin-created leader, active team, leader assignment, employee assignment, and leader-scoped access verification.
   - Required command: `npm run setup:uat-leader-flow` on staging/target only after env review, then `npm run verify:uat-leader-flow`.

4. Shift assignment enforcement must be verified on real attendance devices.
   - Employee has `defaultShiftId` and attendance has `shiftId`.
   - Docs state production attendance should require assigned employee shift and show clear Indonesian error when missing.
   - Production signoff still needs real-device GPS+selfie check-in/check-out with assigned shift and missing-shift negative test.

5. Policy/payroll workflows need owner approval before payroll use.
   - Attendance late tiers, half-day factor, holiday multiplier, payroll realtime sync, and payroll rules are configurable.
   - Business/legal owner must approve values before live payroll calculation.
   - Audit log and notification checks for approve/reject/paid/unpaid remain required.

6. Work calendar needs year-specific operational data.
   - `WorkCalendarDay` table/API exist.
   - Production needs approved holidays/special workdays for operating year.
   - Payroll holiday multiplier must be checked against approved calendar entries.

## No-migration recommendation

Do not add destructive or normalizing division migrations until production data owner approves mapping from existing free-text `Employee.division` values to canonical divisions.

Safe next fixes:

1. Add source tests for missing Division/Position API blockers.
2. Add staging UAT checklist covering division spelling, team assignment, position selection, shift-required attendance, attendance policy, payroll rule, and work calendar.
3. Only after data mapping approval, add additive `Division` table/API and optional backfill plan.

## Verification commands

```bash
npm run lint
npm run test -- tests/production/master-data-policy-shift-audit.test.ts
npm run release:migrations
npm run release:references
```
