import { UserRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { canAccessOwnData, canAccessTeamData, canManageRole, hasPermission } from './permissions';

describe('permission utilities', () => {
  it('checks role permission matrix', () => {
    expect(hasPermission(UserRole.SUPERADMIN, 'EMPLOYEE_CREATE')).toBe(true);
    expect(hasPermission(UserRole.EMPLOYEE, 'EMPLOYEE_CREATE')).toBe(false);
  });

  it('allows own data access', () => {
    expect(canAccessOwnData(UserRole.EMPLOYEE, 'u1', 'u1')).toBe(true);
    expect(canAccessOwnData(UserRole.EMPLOYEE, 'u1', 'u2')).toBe(false);
  });

  it('allows supervisor team access only for direct team', () => {
    expect(canAccessTeamData(UserRole.SUPERVISOR, 'u1', 'u2', 'u1')).toBe(true);
    expect(canAccessTeamData(UserRole.SUPERVISOR, 'u1', 'u2', 'u3')).toBe(false);
  });

  it('prevents peer or higher role management except superadmin', () => {
    expect(canManageRole(UserRole.SUPERADMIN, UserRole.SUPERADMIN)).toBe(true);
    expect(canManageRole(UserRole.ADMIN_HR, UserRole.SUPERVISOR)).toBe(true);
    expect(canManageRole(UserRole.ADMIN_HR, UserRole.ADMIN_HR)).toBe(false);
    expect(canManageRole(UserRole.ADMIN_HR, UserRole.SUPERADMIN)).toBe(false);
  });
});
