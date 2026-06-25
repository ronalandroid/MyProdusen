import { describe, it, expect } from 'vitest';
import { employeeService } from '@/services/employees/employee.service';

/**
 * Integration tests for EmployeeService against a real DB — the read/guard
 * paths via non-existent ids (no seeding, no writes).
 */
describe('EmployeeService integration (real DB, read/guard paths)', () => {
  it('getEmployees: returns an array', async () => {
    const employees = await employeeService.getEmployees();
    expect(Array.isArray(employees)).toBe(true);
  });

  it('getEmployeeById: throws not-found for a missing employee', async () => {
    await expect(employeeService.getEmployeeById('itest-nonexistent')).rejects.toThrow(/tidak ditemukan/i);
  });

  it('getEmployeeByUserId: returns null for a user with no employee record', async () => {
    const employee = await employeeService.getEmployeeByUserId('itest-nonexistent');
    expect(employee ?? null).toBeNull();
  });
});
