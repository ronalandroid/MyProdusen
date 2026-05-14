import { describe, it, expect } from 'vitest';
import { hasPermission, canManageRole, canAccessOwnData, canAccessTeamData } from './permissions';
import type { UserRole } from './permissions';

describe('Permissions', () => {
  describe('hasPermission', () => {
    it('should allow SUPERADMIN to access all permissions', () => {
      expect(hasPermission('SUPERADMIN', 'USER_CREATE')).toBe(true);
      expect(hasPermission('SUPERADMIN', 'EMPLOYEE_DELETE')).toBe(true);
      expect(hasPermission('SUPERADMIN', 'AUDIT_READ')).toBe(true);
    });

    it('should restrict EMPLOYEE permissions', () => {
      expect(hasPermission('EMPLOYEE', 'USER_CREATE')).toBe(false);
      expect(hasPermission('EMPLOYEE', 'ATTENDANCE_CREATE')).toBe(true);
      expect(hasPermission('EMPLOYEE', 'EMPLOYEE_READ_OWN')).toBe(true);
    });
  });

  describe('canManageRole', () => {
    it('should allow SUPERADMIN to manage all roles', () => {
      expect(canManageRole('SUPERADMIN', 'ADMIN_HR')).toBe(true);
      expect(canManageRole('SUPERADMIN', 'SUPERVISOR')).toBe(true);
      expect(canManageRole('SUPERADMIN', 'EMPLOYEE')).toBe(true);
    });

    it('should prevent lower roles from managing higher roles', () => {
      expect(canManageRole('ADMIN_HR', 'SUPERADMIN')).toBe(false);
      expect(canManageRole('SUPERVISOR', 'ADMIN_HR')).toBe(false);
      expect(canManageRole('EMPLOYEE', 'SUPERVISOR')).toBe(false);
    });
  });

  describe('canAccessOwnData', () => {
    it('should allow SUPERADMIN and ADMIN_HR to access all data', () => {
      expect(canAccessOwnData('SUPERADMIN', 'user1', 'user2')).toBe(true);
      expect(canAccessOwnData('ADMIN_HR', 'user1', 'user2')).toBe(true);
    });

    it('should allow users to access their own data', () => {
      expect(canAccessOwnData('EMPLOYEE', 'user1', 'user1')).toBe(true);
      expect(canAccessOwnData('SUPERVISOR', 'user1', 'user1')).toBe(true);
    });

    it('should prevent users from accessing other users data', () => {
      expect(canAccessOwnData('EMPLOYEE', 'user1', 'user2')).toBe(false);
      expect(canAccessOwnData('SUPERVISOR', 'user1', 'user2')).toBe(false);
    });
  });

  describe('canAccessTeamData', () => {
    it('should allow supervisor to access team member data', () => {
      expect(canAccessTeamData('SUPERVISOR', 'supervisor1', 'employee1', 'supervisor1')).toBe(true);
    });

    it('should prevent supervisor from accessing non-team member data', () => {
      expect(canAccessTeamData('SUPERVISOR', 'supervisor1', 'employee1', 'supervisor2')).toBe(false);
    });
  });
});
