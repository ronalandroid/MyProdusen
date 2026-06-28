import { describe, it, expect, afterEach } from 'vitest';
import { db, employees, employeePayrolls, payrollStructures, thrPayments } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { createTestUser, createTestEmployee, cleanupTestData } from '../helpers/test-utils';
import { generateThr, getThrForEmployee } from '@/src/services/payroll/thr.service';

/**
 * Far-future year isolates cleanup: generateThr processes all active employees
 * with a payroll assignment, so we wipe every THR row for that unique year.
 */
describe('THR service — generateThr (real DB)', () => {
  const YEAR = 9000 + Math.floor(Math.random() * 900);
  const HOLIDAY = new Date(`${YEAR}-04-10`);
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const structureIds: string[] = [];

  afterEach(async () => {
    await db.delete(thrPayments).where(eq(thrPayments.year, YEAR));
    if (employeeIds.length) await db.delete(employeePayrolls).where(inArray(employeePayrolls.employeeId, employeeIds));
    for (const s of structureIds) await db.delete(payrollStructures).where(eq(payrollStructures.id, s));
    await cleanupTestData({ employeeIds, userIds });
    userIds.length = 0;
    employeeIds.length = 0;
    structureIds.length = 0;
  });

  it('pays a full month for >=12 months service and is idempotent on re-run', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const empId = await createTestEmployee(user.id);
    employeeIds.push(empId);
    await db.update(employees).set({ joinDate: new Date('2020-01-01') }).where(eq(employees.id, empId));

    const structureId = `thr_struct_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    structureIds.push(structureId);
    await db.insert(payrollStructures).values({ id: structureId, name: structureId, baseSalary: 5_000_000, isActive: true });
    await db.insert(employeePayrolls).values({
      id: `${empId}_ep`, employeeId: empId, structureId, baseSalary: 5_000_000, effectiveDate: new Date('2020-01-01'),
    });

    const results = await generateThr({ year: YEAR, religiousHoliday: 'Idul Fitri Test', holidayDate: HOLIDAY, actorUserId: user.id });

    const mine = results.find((r) => r.employeeId === empId);
    expect(mine, 'THR row created for the seeded employee').toBeTruthy();
    expect(mine!.amount).toBe(5_000_000);
    expect(mine!.monthsOfService).toBeGreaterThanOrEqual(12);
    expect(mine!.status).toBe('CALCULATED');

    const persisted = await getThrForEmployee(empId, YEAR);
    expect(persisted!.amount).toBe(5_000_000);

    // Re-run must upsert, not duplicate (unique employeeId+year).
    await generateThr({ year: YEAR, religiousHoliday: 'Idul Fitri Test', holidayDate: HOLIDAY, actorUserId: user.id });
    const rows = await db.select().from(thrPayments).where(eq(thrPayments.employeeId, empId));
    expect(rows.filter((r) => r.year === YEAR).length).toBe(1);
  });
});
