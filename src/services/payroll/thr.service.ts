import { db } from '@/lib/db';
import { employees, employeePayrolls, thrPayments } from '@/drizzle/schema';
import { and, eq, isNull, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { resolveActivePayrollRule } from './payroll-config';
import { monthsOfService, calculateThr, isThrEligible } from '@/lib/payroll/thr';

export interface GenerateThrInput {
  year: number;
  religiousHoliday: string;
  holidayDate: Date;
  actorUserId: string;
}

/**
 * Compute and persist THR for every active employee with a payroll assignment.
 * Base salary is resolved the same way payroll does (active payroll rule, else
 * the employee's active employeePayroll). Idempotent per employee+year via
 * upsert, so an admin can re-run after fixing salaries. Employees below the
 * 1-month eligibility floor are skipped (no row).
 */
export async function generateThr(input: GenerateThrInput): Promise<Array<typeof thrPayments.$inferSelect>> {
  const activeEmployees = await db
    .select({ employee: employees, payroll: employeePayrolls })
    .from(employees)
    .innerJoin(
      employeePayrolls,
      and(eq(employees.id, employeePayrolls.employeeId), isNull(employeePayrolls.endDate)),
    )
    .where(eq(employees.status, 'ACTIVE'));

  const results: Array<typeof thrPayments.$inferSelect> = [];

  for (const { employee, payroll } of activeEmployees) {
    const months = monthsOfService(employee.joinDate, input.holidayDate);
    if (!isThrEligible(months)) continue;

    const activeRule = await resolveActivePayrollRule(employee.id, input.holidayDate);
    const baseSalary = activeRule ? activeRule.baseSalary : payroll.baseSalary;
    const amount = calculateThr(baseSalary, months);

    const [row] = await db
      .insert(thrPayments)
      .values({
        id: nanoid(),
        employeeId: employee.id,
        year: input.year,
        religiousHoliday: input.religiousHoliday,
        baseSalary,
        monthsOfService: months,
        amount,
        status: 'CALCULATED',
        calculatedBy: input.actorUserId,
      })
      .onConflictDoUpdate({
        target: [thrPayments.employeeId, thrPayments.year],
        set: {
          religiousHoliday: input.religiousHoliday,
          baseSalary,
          monthsOfService: months,
          amount,
          status: 'CALCULATED',
          calculatedBy: input.actorUserId,
          updatedAt: new Date(),
        },
      })
      .returning();
    results.push(row);
  }

  return results;
}

export async function listThr(year: number): Promise<Array<typeof thrPayments.$inferSelect>> {
  return db.select().from(thrPayments).where(eq(thrPayments.year, year)).orderBy(desc(thrPayments.amount));
}

export async function getThrForEmployee(
  employeeId: string,
  year: number,
): Promise<typeof thrPayments.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(thrPayments)
    .where(and(eq(thrPayments.employeeId, employeeId), eq(thrPayments.year, year)))
    .limit(1);
  return row ?? null;
}

export async function markThrPaid(id: string): Promise<typeof thrPayments.$inferSelect | null> {
  const [row] = await db
    .update(thrPayments)
    .set({ status: 'PAID', paidAt: new Date(), updatedAt: new Date() })
    .where(eq(thrPayments.id, id))
    .returning();
  return row ?? null;
}
