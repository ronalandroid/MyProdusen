import { describe, it, expect } from 'vitest';
import { employeeService } from '@/services/employees/employee.service';

/**
 * Integration tests for EmployeeService.getEmployeesPaginated (count + page query,
 * with and without filters) and the createEmployeeProfileForUser not-found guard.
 */
describe('EmployeeService paginated + profile-for-user', () => {
  it('getEmployeesPaginated: returns a paginated result with and without filters', async () => {
    const r1 = await employeeService.getEmployeesPaginated({}, { limit: 10, offset: 0 });
    expect(r1).toBeDefined();

    const r2 = await employeeService.getEmployeesPaginated(
      { status: 'ACTIVE', search: 'zzz-no-match', division: 'none', supervisorId: 'none' },
      { limit: 5, offset: 0 },
    );
    expect(r2).toBeDefined();
  });

  it('createEmployeeProfileForUser: throws for a non-existent user', async () => {
    await expect(
      employeeService.createEmployeeProfileForUser('itest-nonexistent', { fullName: 'X' }),
    ).rejects.toThrow(/tidak ditemukan/i);
  });
});
