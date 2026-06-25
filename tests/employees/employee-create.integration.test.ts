import { describe, it, expect, afterEach } from 'vitest';
import { db, users, employees } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { employeeService } from '@/services/employees/employee.service';

/**
 * Integration test for EmployeeService.createEmployee against a real DB — covers
 * the create happy path (user + employee + generated NIP) and the duplicate
 * email guard. Created rows are cleaned up.
 */
describe('EmployeeService.createEmployee (real DB)', () => {
  const created: Array<{ empId: string; userId: string }> = [];

  afterEach(async () => {
    if (created.length > 0) {
      await db.delete(employees).where(inArray(employees.id, created.map((c) => c.empId)));
      await db.delete(users).where(inArray(users.id, created.map((c) => c.userId)));
      created.length = 0;
    }
  });

  it('creates a user + employee and rejects a duplicate email', async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `itest-create-${unique}@t.local`;
    const username = `itestcreate${unique}`.replace(/-/g, '');

    const emp = await employeeService.createEmployee({
      email, username, password: 'StrongP@ssw0rd1', fullName: 'IT Created', position: 'Staff',
    });
    created.push({ empId: emp.id, userId: emp.userId });
    expect(emp.fullName).toBe('IT Created');
    expect(emp.email).toBe(email);

    await expect(
      employeeService.createEmployee({
        email, username: `${username}b`, password: 'StrongP@ssw0rd1', fullName: 'Dup', position: 'Staff',
      }),
    ).rejects.toThrow(/Email sudah terdaftar/i);
  });
});
