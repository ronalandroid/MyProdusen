import { describe, it, expect } from 'vitest';
import { hasPermission, canManageRole, canAccessOwnData, canAccessTeamData } from './permissions';

describe('Permissions', () => {
  describe('hasPermission', () => {
    it('allows SUPERADMIN to access admin permissions', () => {
      expect(hasPermission('SUPERADMIN', 'USER_CREATE')).toBe(true);
      expect(hasPermission('SUPERADMIN', 'EMPLOYEE_DELETE')).toBe(true);
      expect(hasPermission('SUPERADMIN', 'AUDIT_READ')).toBe(true);
    });

    it('restricts EMPLOYEE permissions to self-service', () => {
      expect(hasPermission('EMPLOYEE', 'USER_CREATE')).toBe(false);
      expect(hasPermission('EMPLOYEE', 'ATTENDANCE_CREATE')).toBe(true);
      expect(hasPermission('EMPLOYEE', 'EMPLOYEE_READ_OWN')).toBe(true);
    });

    it('allows LEADER own access and scoped team KPI permissions', () => {
      expect(hasPermission('LEADER', 'ATTENDANCE_CREATE')).toBe(true);
      expect(hasPermission('LEADER', 'EMPLOYEE_READ_OWN')).toBe(true);
      expect(hasPermission('LEADER', 'KPI_TEAM_INPUT')).toBe(true);
      expect(hasPermission('LEADER', 'KPI_READ_TEAM')).toBe(true);
      expect(hasPermission('LEADER', 'USER_UPDATE')).toBe(false);
      expect(hasPermission('LEADER', 'REPORT_EXPORT')).toBe(false);
      expect(hasPermission('LEADER', 'PAYROLL_READ')).toBe(false);
    });

    it('does not grant historical roles any production permission', () => {
      expect(hasPermission('ADMIN_HR', 'EMPLOYEE_READ')).toBe(false);
      expect(hasPermission('SUPERVISOR', 'LEAVE_APPROVE')).toBe(false);
    });
  });

  describe('canManageRole', () => {
    it('allows SUPERADMIN to manage only production roles', () => {
      expect(canManageRole('SUPERADMIN', 'SUPERADMIN')).toBe(true);
      expect(canManageRole('SUPERADMIN', 'LEADER')).toBe(true);
      expect(canManageRole('SUPERADMIN', 'EMPLOYEE')).toBe(true);
    });

    it('prevents non-production roles from role management', () => {
      expect(canManageRole('ADMIN_HR' as any, 'EMPLOYEE')).toBe(false);
      expect(canManageRole('SUPERVISOR' as any, 'EMPLOYEE')).toBe(false);
      expect(canManageRole('EMPLOYEE', 'SUPERADMIN')).toBe(false);
    });
  });

  describe('data access helpers', () => {
    it('allows SUPERADMIN all data and self-service roles own data only', () => {
      expect(canAccessOwnData('SUPERADMIN', 'user1', 'user2')).toBe(true);
      expect(canAccessOwnData('LEADER', 'user1', 'user1')).toBe(true);
      expect(canAccessOwnData('LEADER', 'user1', 'user2')).toBe(false);
      expect(canAccessOwnData('EMPLOYEE', 'user1', 'user1')).toBe(true);
      expect(canAccessOwnData('EMPLOYEE', 'user1', 'user2')).toBe(false);
    });

    it('does not expose historical supervisor team access', () => {
      expect(canAccessTeamData('SUPERVISOR', 'supervisor1', 'employee1', 'supervisor1')).toBe(false);
    });
  });
});
