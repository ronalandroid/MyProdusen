import { describe, expect, it } from 'vitest';
import { toProductionUserRole } from '@/services/auth/auth.service';

describe('toProductionUserRole', () => {
  it('keeps Superadmin role visible in production UI', () => {
    expect(toProductionUserRole('SUPERADMIN')).toBe('SUPERADMIN');
  });

  it('maps historical roles to Employee for production UI safety', () => {
    expect(toProductionUserRole('EMPLOYEE')).toBe('EMPLOYEE');
    expect(toProductionUserRole('ADMIN_HR')).toBe('EMPLOYEE');
    expect(toProductionUserRole('SUPERVISOR')).toBe('EMPLOYEE');
  });
});
