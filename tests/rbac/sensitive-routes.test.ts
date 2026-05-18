import { describe, expect, it } from 'vitest';
import { canAccessNavigationPath } from '@/lib/navigation/role-navigation';

describe('sensitive dashboard route access', () => {
  it('allows only Superadmin to open PDF report dashboard page', () => {
    expect(canAccessNavigationPath('SUPERADMIN', '/dashboard/reports/pdf')).toBe(true);
    expect(canAccessNavigationPath('ADMIN_HR', '/dashboard/reports/pdf')).toBe(false);
    expect(canAccessNavigationPath('SUPERVISOR', '/dashboard/reports/pdf')).toBe(false);
    expect(canAccessNavigationPath('EMPLOYEE', '/dashboard/reports/pdf')).toBe(false);
  });

  it('keeps child paths protected by nearest sensitive parent policy', () => {
    expect(canAccessNavigationPath('SUPERADMIN', '/dashboard/users/anything')).toBe(true);
    expect(canAccessNavigationPath('ADMIN_HR', '/dashboard/users/anything')).toBe(false);
    expect(canAccessNavigationPath('EMPLOYEE', '/dashboard/payroll/history')).toBe(true);
    expect(canAccessNavigationPath('SUPERVISOR', '/dashboard/payroll/history')).toBe(false);
  });
});
