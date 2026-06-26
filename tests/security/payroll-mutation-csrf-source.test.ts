import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

/**
 * Locks the CSRF origin-check (withApiHandler) onto the admin-only payroll-run
 * mutation routes (issue #18 / audit M8). These are SUPERADMIN-gated desktop
 * actions: the cookie-auth browser sends a matching Origin (passes), and the
 * mobile employee app can't reach them (role check). Regressing the wrap would
 * silently drop CSRF protection, so assert it at the source level.
 */
const ADMIN_PAYROLL_MUTATION_ROUTES = [
  'app/api/payroll/runs/[id]/calculate/route.ts',
  'app/api/payroll/runs/[id]/approve/route.ts',
  'app/api/payroll/runs/[id]/paid/route.ts',
  'app/api/payroll/runs/[id]/unpaid/route.ts',
];

describe('admin payroll mutation routes enforce CSRF origin-check', () => {
  it.each(ADMIN_PAYROLL_MUTATION_ROUTES)('%s wraps its POST in withApiHandler', (path) => {
    const source = readFileSync(path, 'utf8');
    expect(source).toContain('withApiHandler');
    // The POST export must be the wrapped form, not a bare handler that skips
    // the origin pre-check.
    expect(source).toMatch(/export const POST = withApiHandler/);
    expect(source).not.toMatch(/export async function POST/);
  });
});
