import { describe, it, expect } from 'vitest';
import { getNavigationForRole, canAccessNavigationPath } from '@/lib/navigation/role-navigation';

describe('Role Navigation Policy', () => {
  it('SUPERADMIN sees all navigation items', () => {
    const nav = getNavigationForRole('SUPERADMIN');
    expect(nav.map((item) => item.key)).toContain('audit');
    expect(nav.map((item) => item.key)).toContain('employees');
    expect(nav.map((item) => item.key)).toContain('locations');
    expect(nav.map((item) => item.key)).toContain('shifts');
    expect(nav.length).toBeGreaterThan(10);
  });

  it('ADMIN_HR sees HR-focused navigation without audit', () => {
    const nav = getNavigationForRole('ADMIN_HR');
    expect(nav.map((item) => item.key)).toContain('employees');
    expect(nav.map((item) => item.key)).toContain('locations');
    expect(nav.map((item) => item.key)).toContain('shifts');
    expect(nav.map((item) => item.key)).toContain('attendance-exceptions');
    expect(nav.map((item) => item.key)).not.toContain('audit');
    expect(nav.map((item) => item.key)).not.toContain('self-service');
  });

  it('SUPERVISOR sees team-focused navigation', () => {
    const nav = getNavigationForRole('SUPERVISOR');
    expect(nav.map((item) => item.key)).toContain('self-service');
    expect(nav.map((item) => item.key)).toContain('employees');
    expect(nav.map((item) => item.key)).toContain('attendance-exceptions');
    expect(nav.map((item) => item.key)).toContain('kpi');
    expect(nav.map((item) => item.key)).not.toContain('locations');
    expect(nav.map((item) => item.key)).not.toContain('shifts');
    expect(nav.map((item) => item.key)).not.toContain('audit');
  });

  it('EMPLOYEE sees personal navigation only', () => {
    const nav = getNavigationForRole('EMPLOYEE');
    expect(nav.map((item) => item.key)).toContain('dashboard');
    expect(nav.map((item) => item.key)).toContain('self-service');
    expect(nav.map((item) => item.key)).toContain('attendance');
    expect(nav.map((item) => item.key)).toContain('leave');
    expect(nav.map((item) => item.key)).toContain('kpi');
    expect(nav.map((item) => item.key)).toContain('notifications');
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
    expect(canAccessNavigationPath('SUPERVISOR', '/dashboard/employees')).toBe(true);
    expect(canAccessNavigationPath('SUPERVISOR', '/dashboard/audit')).toBe(false);
    expect(canAccessNavigationPath('SUPERADMIN', '/dashboard/audit')).toBe(true);
  });
});
