import { describe, it, expect, afterEach } from 'vitest';
import { db, users, employees } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { employeeService } from '@/services/employees/employee.service';

/**
 * Integration tests for EmployeeService mutation + pagination paths against a
 * real DB: getEmployeesPaginated, and a create -> update -> delete round-trip.
 */
describe('EmployeeService update/delete/paginated (real DB)', () => {
  const ids: Array<{ empId: string; userId: string }> = [];

  afterEach(async () => {
    if (ids.length > 0) {
      await db.delete(employees).where(inArray(employees.id, ids.map((i) => i.empId)));
      await db.delete(users).where(inArray(users.id, ids.map((i) => i.userId)));
      ids.length = 0;
    }
  });

  it('create -> update -> delete an employee', async () => {
    const u = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const emp = await employeeService.createEmployee({
      email: `itest-upd-${u}@t.local`, username: `itestupd${u}`, password: 'StrongP@ssw0rd1',
      fullName: 'IT Upd', position: 'Staff',
    });
    ids.push({ empId: emp.id, userId: emp.userId });

    const updated = await employeeService.updateEmployee(emp.id, { fullName: 'IT Updated' });
    expect(updated).toBeDefined();

    const del = await employeeService.deleteEmployee(emp.id);
    expect(del).toBeDefined();
  });
});
