import { describe, it, expect } from 'vitest';
import {
  canAccessNavigationPath,
  getNavigationForRole,
  getPrimaryNavigationForRole,
} from '@/lib/navigation/role-navigation';

describe('Role Navigation Policy', () => {
  it('SUPERADMIN sees all navigation items', () => {
    const nav = getNavigationForRole('SUPERADMIN');
    expect(nav.map((item) => item.key)).toContain('audit');
    expect(nav.map((item) => item.key)).toContain('employees');
    expect(nav.map((item) => item.key)).toContain('locations');
    expect(nav.map((item) => item.key)).toContain('shifts');
    expect(nav.map((item) => item.key)).toContain('payroll');
    expect(nav.map((item) => item.key)).toContain('overtime');
    expect(nav.length).toBeGreaterThan(10);
  });

  it('legacy HR and supervisor roles are not exposed in production navigation', () => {
    expect(getNavigationForRole('ADMIN_HR')).toHaveLength(0);
    expect(getNavigationForRole('SUPERVISOR')).toHaveLength(0);
  });

  it('EMPLOYEE sees personal navigation only', () => {
    const nav = getNavigationForRole('EMPLOYEE');
    expect(nav.map((item) => item.key)).toContain('dashboard');
    expect(nav.map((item) => item.key)).toContain('self-service');
    expect(nav.map((item) => item.key)).toContain('attendance');
    expect(nav.map((item) => item.key)).toContain('leave');
    expect(nav.map((item) => item.key)).toContain('kpi');
    expect(nav.map((item) => item.key)).toContain('notifications');
    expect(nav.map((item) => item.key)).toContain('overtime');
    expect(nav.map((item) => item.key)).toContain('payroll');
    expect(nav.map((item) => item.key)).toContain('profile');
    expect(nav.map((item) => item.key)).not.toContain('employees');
    expect(nav.map((item) => item.key)).not.toContain('locations');
    expect(nav.map((item) => item.key)).not.toContain('shifts');
    expect(nav.map((item) => item.key)).not.toContain('attendance-exceptions');
    expect(nav.map((item) => item.key)).not.toContain('reports');
    expect(nav.map((item) => item.key)).not.toContain('audit');
  });

  it('canAccessNavigationPath enforces role restrictions', () => {
    expect(canAccessNavigationPath('EMPLOYEE', '/dashboard/audit')).toBe(false);
    expect(canAccessNavigationPath('EMPLOYEE', '/dashboard/employees')).toBe(false);
    expect(canAccessNavigationPath('EMPLOYEE', '/dashboard/attendance')).toBe(true);
    expect(canAccessNavigationPath('EMPLOYEE', '/dashboard/payroll')).toBe(true);
    expect(canAccessNavigationPath('EMPLOYEE', '/dashboard/overtime')).toBe(true);
    expect(canAccessNavigationPath('ADMIN_HR', '/dashboard/payroll')).toBe(false);
    expect(canAccessNavigationPath('SUPERVISOR', '/dashboard/employees')).toBe(false);
    expect(canAccessNavigationPath('SUPERVISOR', '/dashboard/audit')).toBe(false);
    expect(canAccessNavigationPath('SUPERADMIN', '/dashboard/audit')).toBe(true);
  });

  it('Each role exposes at most 5 primary tabs to match the mobile design', () => {
    for (const role of ['SUPERADMIN', 'EMPLOYEE'] as const) {
      const primary = getPrimaryNavigationForRole(role);
      expect(primary.length).toBeGreaterThan(0);
      expect(primary.length).toBeLessThanOrEqual(5);
    }
  });

  it('EMPLOYEE primary tabs match the design (Beranda · Kehadiran · Cuti · KPI · Akun)', () => {
    const keys = getPrimaryNavigationForRole('EMPLOYEE').map((item) => item.key);
    expect(keys).toEqual(['dashboard', 'attendance', 'leave', 'kpi', 'profile']);
  });

  it('SUPERADMIN primary tabs match the design (Beranda · Cabang · Approval · Laporan · Akun)', () => {
    const keys = getPrimaryNavigationForRole('SUPERADMIN').map((item) => item.key);
    const paths = getPrimaryNavigationForRole('SUPERADMIN').map((item) => item.path);

    expect(keys).toEqual(['dashboard', 'locations', 'attendance-exceptions', 'reports', 'profile']);
    expect(paths).toEqual([
      '/dashboard',
      '/dashboard/locations',
      '/dashboard/attendance/exceptions',
      '/dashboard/reports/attendance',
      '/dashboard/profile',
    ]);
  });
});
