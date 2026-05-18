import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const frontendUsedJsonRoutes = [
  'app/api/announcements/route.ts',
  'app/api/announcements/[id]/route.ts',
  'app/api/announcements/[id]/comments/route.ts',
  'app/api/overtime/rates/route.ts',
  'app/api/overtime/requests/route.ts',
  'app/api/overtime/requests/[id]/approve/route.ts',
  'app/api/overtime/requests/[id]/reject/route.ts',
  'app/api/payroll/runs/route.ts',
  'app/api/payroll/runs/[id]/route.ts',
  'app/api/payroll/runs/[id]/calculate/route.ts',
  'app/api/payroll/runs/[id]/approve/route.ts',
  'app/api/payroll/structures/route.ts',
  'app/api/payroll/structures/[id]/route.ts',
];

describe('frontend/backend API contract', () => {
  it.each(frontendUsedJsonRoutes)('%s uses the standard JSON response envelope', (routePath) => {
    const source = readFileSync(routePath, 'utf8');

    expect(source).toMatch(/@\/utils\/response/);
    expect(source).not.toMatch(/NextResponse\.json\(\s*\{\s*data:/);
    expect(source).not.toMatch(/NextResponse\.json\(\s*\{\s*error:/);
  });
});
