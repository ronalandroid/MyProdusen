import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

/**
 * Locks the CSRF origin-check (withApiHandler) onto the admin-only mutation
 * routes (issue #18 / audit M8). Every route here is SUPERADMIN-gated:
 *  - the cookie-auth desktop browser sends a matching Origin → check passes;
 *  - the mobile employee app (LEADER/EMPLOYEE) can't reach them (role check),
 *    so wrapping them has no mobile impact.
 * Regressing the wrap would silently drop CSRF protection, so assert it at the
 * source level. Employee-self-service routes (check-in/out, leave submit, kpi
 * entry) are intentionally NOT here — they need the prod mobile-Origin
 * confirmation first.
 */
const ADMIN_MUTATION_ROUTES = [
  // Payroll run lifecycle (PAYROLL_MUTATE / APPROVE / PAY — all SUPERADMIN)
  'app/api/payroll/runs/[id]/calculate/route.ts',
  'app/api/payroll/runs/[id]/approve/route.ts',
  'app/api/payroll/runs/[id]/paid/route.ts',
  'app/api/payroll/runs/[id]/unpaid/route.ts',
  // Attendance admin actions (ATTENDANCE_MANUAL_ADJUST — SUPERADMIN)
  'app/api/attendance/[id]/adjust/route.ts',
  'app/api/attendance/exceptions/[id]/review/route.ts',
  'app/api/attendance/exceptions/bulk-review/route.ts',
  // Leave approval (LEAVE_APPROVE / LEAVE_REJECT — SUPERADMIN)
  'app/api/leave/[id]/approve/route.ts',
  'app/api/leave/[id]/reject/route.ts',
  // KPI admin: templates CRUD, assignment, result approval — all SUPERADMIN
  // (KPI_TEMPLATE_CREATE/UPDATE/DELETE, KPI_ASSIGN, KPI_APPROVE). KPI feeds
  // payroll bonuses, so a forged mutation here could manipulate pay.
  'app/api/kpi/templates/route.ts',
  'app/api/kpi/templates/[id]/route.ts',
  'app/api/kpi/templates/[id]/items/[itemId]/route.ts',
  'app/api/kpi/assignments/route.ts',
  'app/api/kpi/results/[id]/approve/route.ts',
  // Payroll config: structures CRUD, rules, period lock/unlock — all
  // SUPERADMIN (assertPayrollAccess('mutate') / PAYROLL_MUTATE / PAYROLL_READ,
  // all SUPERADMIN-only). These directly control pay computation.
  'app/api/payroll/structures/route.ts',
  'app/api/payroll/structures/[id]/route.ts',
  'app/api/payroll/rules/route.ts',
  'app/api/payroll/periods/[id]/lock/route.ts',
  'app/api/payroll/periods/[id]/unlock/route.ts',
  // Pay-affecting config: overtime rates + TBM payroll (rules, assignments,
  // divisions, positions) — all SUPERADMIN (role !== 'SUPERADMIN' guards).
  // The TBM routes alias `export const PATCH = POST`, so wrapping POST covers
  // PATCH too.
  'app/api/overtime/rates/route.ts',
  'app/api/payroll/tbm/rules/route.ts',
  'app/api/payroll/tbm/assignments/route.ts',
  'app/api/payroll/tbm/divisions/route.ts',
  'app/api/payroll/tbm/positions/route.ts',
  // THR generation (SUPERADMIN payroll mutate)
  'app/api/payroll/thr/route.ts',
];

describe('admin mutation routes enforce CSRF origin-check', () => {
  it.each(ADMIN_MUTATION_ROUTES)('%s wraps its mutation handler in withApiHandler', (path) => {
    const source = readFileSync(path, 'utf8');
    expect(source).toContain('withApiHandler');
    // The mutation export must be the wrapped form, not a bare handler that
    // skips the origin pre-check.
    expect(source).toMatch(/export const (POST|PATCH|PUT|DELETE) = withApiHandler/);
    expect(source).not.toMatch(/export async function (POST|PATCH|PUT|DELETE)/);
  });
});
