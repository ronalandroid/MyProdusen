import { db } from '@/lib/db';
import {
  payrollRuns,
  payrollItems,
  payslips,
  employees,
  overtimeRequests,
} from '@/drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { BusinessError } from '@/lib/core/business-error';

export async function createPayrollRun(data: {
  period: string; // YYYY-MM
  periodStart: Date;
  periodEnd: Date;
  calculatedBy: string;
}) {
  // Check if payroll run already exists for this period
  const [existing] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.period, data.period))
    .limit(1);

  if (existing) {
    throw new BusinessError('Payroll untuk periode ini sudah ada');
  }

  const [run] = await db
    .insert(payrollRuns)
    .values({
      id: nanoid(),
      period: data.period,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: 'DRAFT',
      calculatedBy: data.calculatedBy,
    })
    .returning();

  return run;
}

export async function approvePayrollRun(runId: string, approvedBy: string) {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.id, runId))
    .limit(1);

  if (!run) {
    throw new BusinessError('Payroll run tidak ditemukan');
  }

  if (run.status !== 'CALCULATED') {
    throw new BusinessError('Payroll belum dikalkulasi');
  }

  const [updated] = await db
    .update(payrollRuns)
    .set({
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payrollRuns.id, runId))
    .returning();

  await db
    .update(overtimeRequests)
    .set({
      isPaid: true,
      paidInPayrollRunId: runId,
      updatedAt: new Date(),
    })
    .where(and(
      eq(overtimeRequests.status, 'APPROVED'),
      eq(overtimeRequests.isPaid, false),
      gte(overtimeRequests.overtimeDate, run.periodStart),
      lte(overtimeRequests.overtimeDate, run.periodEnd)
    ));

  return updated;
}

export async function markPayrollRunPaid(runId: string) {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.id, runId))
    .limit(1);

  if (!run) {
    throw new BusinessError('Payroll run tidak ditemukan');
  }

  if (run.status !== 'APPROVED') {
    throw new BusinessError('Hanya payroll approved yang dapat ditandai paid');
  }

  const [updated] = await db
    .update(payrollRuns)
    .set({ status: 'PAID', paidAt: new Date(), updatedAt: new Date() })
    .where(eq(payrollRuns.id, runId))
    .returning();

  return updated;
}

export async function markPayrollRunUnpaid(runId: string) {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.id, runId))
    .limit(1);

  if (!run) {
    throw new BusinessError('Payroll run tidak ditemukan');
  }

  if (run.status !== 'PAID') {
    throw new BusinessError('Hanya payroll paid yang dapat ditandai unpaid');
  }

  const [updated] = await db
    .update(payrollRuns)
    .set({ status: 'APPROVED', paidAt: null, updatedAt: new Date() })
    .where(eq(payrollRuns.id, runId))
    .returning();

  return updated;
}

export async function getPayrollRuns() {
  return await db
    .select()
    .from(payrollRuns)
    .orderBy(sql`${payrollRuns.period} DESC`);
}

export async function getPayrollSummary() {
  const runs = await getPayrollRuns();
  const latest = runs[0] ?? null;
  return {
    totalRuns: runs.length,
    draftRuns: runs.filter((run) => run.status === 'DRAFT').length,
    calculatedRuns: runs.filter((run) => run.status === 'CALCULATED').length,
    approvedRuns: runs.filter((run) => run.status === 'APPROVED').length,
    paidRuns: runs.filter((run) => run.status === 'PAID').length,
    totalNetPay: runs.reduce((sum, run) => sum + run.totalNetPay, 0),
    latest,
  };
}

export async function getPayrollRunById(id: string) {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.id, id))
    .limit(1);

  if (!run) {
    throw new BusinessError('Payroll run tidak ditemukan');
  }

  // Get items
  const items = await db
    .select({
      item: payrollItems,
      employee: employees,
    })
    .from(payrollItems)
    .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
    .where(eq(payrollItems.runId, id));

  return { ...run, items };
}

export async function getEmployeePayrollItems(employeeId: string) {
  return await db
    .select({
      item: payrollItems,
      run: payrollRuns,
    })
    .from(payrollItems)
    .innerJoin(payrollRuns, eq(payrollItems.runId, payrollRuns.id))
    .where(eq(payrollItems.employeeId, employeeId))
    .orderBy(sql`${payrollRuns.period} DESC`);
}

export async function getPayrollItemById(itemId: string) {
  const [row] = await db
    .select({ item: payrollItems, run: payrollRuns, employee: employees })
    .from(payrollItems)
    .innerJoin(payrollRuns, eq(payrollItems.runId, payrollRuns.id))
    .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
    .where(eq(payrollItems.id, itemId))
    .limit(1);

  if (!row) {
    throw new BusinessError('Payslip tidak ditemukan');
  }

  return row;
}

export async function getOrCreatePayslip(itemId: string) {
  const row = await getPayrollItemById(itemId);
  const [existing] = await db
    .select()
    .from(payslips)
    .where(eq(payslips.itemId, itemId))
    .limit(1);

  if (existing) return { ...row, payslip: existing };

  const [payslip] = await db
    .insert(payslips)
    .values({ id: nanoid(), itemId, employeeId: row.item.employeeId, period: row.run.period })
    .returning();

  return { ...row, payslip };
}

export async function markPayslipDownloaded(itemId: string) {
  await db
    .update(payslips)
    .set({ isDownloaded: true, downloadedAt: new Date() })
    .where(eq(payslips.itemId, itemId));
}
