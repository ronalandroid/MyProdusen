import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getNavigationForRole, getPrimaryNavigationForRole } from '@/lib/navigation/role-navigation';

const sidebarSource = readFileSync('components/layout/Sidebar.tsx', 'utf8');

describe('responsive primary navigation policy', () => {
  it('keeps Superadmin mobile nav to five items', () => {
    expect(getPrimaryNavigationForRole('SUPERADMIN').map((item) => item.name)).toEqual([
      'Beranda',
      'Cabang',
      'Approval',
      'Pengguna',
      'Akun',
    ]);
  });

  it('keeps Employee mobile nav to five items', () => {
    expect(getPrimaryNavigationForRole('EMPLOYEE').map((item) => item.name)).toEqual([
      'Beranda',
      'Absensi',
      'Cuti',
      'KPI',
      'Akun',
    ]);
  });

  it('uses a distinct professional account-management icon for Pengguna', () => {
    expect(sidebarSource).toContain('UserCog');
    expect(sidebarSource).toContain("'/dashboard/users': UserCog");
    expect(sidebarSource).toContain("'/dashboard': Home");
  });

  it('hides non-core modules from main navigation by default', () => {
    for (const role of ['SUPERADMIN', 'LEADER', 'EMPLOYEE'] as const) {
      const keys = getNavigationForRole(role).map((item) => item.key);
      expect(keys).not.toContain('overtime');
      expect(keys).not.toContain('documents');
      expect(keys).toContain('payroll');
      expect(keys).toContain('notifications');
    }
  });
});
