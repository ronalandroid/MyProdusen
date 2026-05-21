import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardFiles = [
  'app/dashboard/page.tsx',
  'app/dashboard/attendance/page.tsx',
  'app/dashboard/attendance/exceptions/page.tsx',
  'app/dashboard/audit/page.tsx',
  'app/dashboard/employees/page.tsx',
  'app/dashboard/kpi/page.tsx',
  'app/dashboard/kpi/template/page.tsx',
  'app/dashboard/leave/page.tsx',
  'app/dashboard/leave/balance/page.tsx',
  'app/dashboard/locations/page.tsx',
  'app/dashboard/notifications/page.tsx',
  'app/dashboard/self-service/page.tsx',
  'app/dashboard/payroll/page.tsx',
  'app/dashboard/payroll/me/page.tsx',
  'app/dashboard/payroll/structures/page.tsx',
  'app/dashboard/reports/page.tsx',
  'app/dashboard/reports/attendance/page.tsx',
  'app/dashboard/reports/pdf/page.tsx',
  'app/dashboard/shifts/page.tsx',
  'app/dashboard/users/page.tsx',
];

const forbiddenSnippets = [
  'className="sync-strip',
  'className="api-pill',
  'Frontend</span>',
  'Drizzle</span>',
  'PostgreSQL</span>',
  'Employee Self-Service',
  'Logout tersedia di menu Akun',
  'Kontrol penuh, operasional tertata',
];

describe('production dashboard UI cleanup', () => {
  it('does not render engineering pipeline/debug labels in dashboard pages', () => {
    for (const file of dashboardFiles) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      for (const snippet of forbiddenSnippets) {
        expect(source, `${file} must not include ${snippet}`).not.toContain(snippet);
      }
    }
  });
});
