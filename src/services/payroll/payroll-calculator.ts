import { db } from '@/lib/db';
import {
  calculateAttendanceDeduction,
  calculateBPJSKesehatan,
  calculateBPJSKetenagakerjaan,
  calculateTax,
} from '@/lib/payroll/calculations';
import {
  payrollComponents,
  employeePayrolls,
  payrollRuns,
  payrollItems,
  payrollStructures,
  employees,
  attendances,
  overtimeRequests,
  kpiMetrics,
  kpiProductionEntries,
} from '@/drizzle/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { BusinessError } from '@/lib/core/business-error';
import { resolveActivePayrollRule } from './payroll-config';

async function getAttendanceData(
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  const records = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.employeeId, employeeId),
        gte(attendances.checkInTime, startDate),
        lte(attendances.checkInTime, endDate)
      )
    );

  const workDays = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentDays = records.filter((r) => r.status === 'ABSENT').length;
  const lateDays = records.filter((r) => r.status === 'LATE').length;

  return { workDays, absentDays, lateDays };
}

async function getOvertimeData(
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  const records = await db
    .select()
    .from(overtimeRequests)
    .where(
      and(
        eq(overtimeRequests.employeeId, employeeId),
        eq(overtimeRequests.status, 'APPROVED'),
        eq(overtimeRequests.isPaid, false),
        gte(overtimeRequests.overtimeDate, startDate),
        lte(overtimeRequests.overtimeDate, endDate)
      )
    );

  const totalHours = records.reduce((sum, r) => sum + r.durationHours, 0);
  const totalPay = records.reduce((sum, r) => sum + r.calculatedPay, 0);

  return { totalHours, totalPay };
}

export async function calculatePayroll(runId: string) {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.id, runId))
    .limit(1);

  if (!run) {
    throw new BusinessError('Payroll run tidak ditemukan');
  }

  if (run.status !== 'DRAFT') {
    throw new BusinessError('Payroll sudah dikalkulasi');
  }

  // Get all active employees with payroll assignment
  const activeEmployees = await db
    .select({
      employee: employees,
      payroll: employeePayrolls,
      structure: payrollStructures,
    })
    .from(employees)
    .innerJoin(
      employeePayrolls,
      and(
        eq(employees.id, employeePayrolls.employeeId),
        isNull(employeePayrolls.endDate)
      )
    )
    .innerJoin(
      payrollStructures,
      eq(employeePayrolls.structureId, payrollStructures.id)
    )
    .where(eq(employees.status, 'ACTIVE'));

  let totalGrossPay = 0;
  let totalDeductions = 0;
  let totalNetPay = 0;
  // Compute every line item first (pure), then persist atomically below so a
  // mid-calculation failure can never leave a half-written payroll run.
  const itemsToInsert: (typeof payrollItems.$inferInsert)[] = [];

  for (const { employee, payroll, structure } of activeEmployees) {
    // Load independent payroll inputs in parallel to avoid per-employee waterfalls.
    const [attendanceData, overtimeData, components, activeRule] = await Promise.all([
      getAttendanceData(employee.id, run.periodStart, run.periodEnd),
      getOvertimeData(employee.id, run.periodStart, run.periodEnd),
      db
        .select()
        .from(payrollComponents)
        .where(eq(payrollComponents.structureId, structure.id)),
      resolveActivePayrollRule(employee.id, run.periodEnd),
    ]);

    // Calculate salary components
    const baseSalary = activeRule ? activeRule.baseSalary : payroll.baseSalary;
    let totalAllowances = 0;
    let totalDeductionsEmp = 0;

    for (const component of components) {
      const amount = component.isPercentage
        ? (baseSalary * component.amount) / 100
        : component.amount;

      if (component.type === 'ALLOWANCE') {
        totalAllowances += amount;
      } else if (component.type === 'DEDUCTION') {
        totalDeductionsEmp += amount;
      }
    }

    // Calculate attendance deduction (late days)
    const attendanceDeduction = calculateAttendanceDeduction(
      baseSalary,
      attendanceData
    );

    // Calculate overtime pay
    const overtimePay = overtimeData.totalPay;

    // Calculate bonus pay from payroll rule KPI targets
    let bonusPay = 0;
    if (
      activeRule &&
      activeRule.targetMetricId &&
      activeRule.targetQuantity !== null &&
      activeRule.bonusAmountPerUnit !== null
    ) {
      const [metric] = await db
        .select()
        .from(kpiMetrics)
        .where(eq(kpiMetrics.id, activeRule.targetMetricId))
        .limit(1);

      if (metric) {
        // M1: push the period date-range filter into SQL (was filtered in
        // memory). The composite index KpiProductionEntry_employeeId_metricType_
        // status_date (migration 0035) serves this directly. Dates are stored as
        // YYYY-MM-DD strings, so the SQL range compare is identical to the prior
        // in-memory string comparison — same rows, far less data pulled.
        const periodStartStr = run.periodStart.toISOString().split('T')[0];
        const periodEndStr = run.periodEnd.toISOString().split('T')[0];

        const entries = await db
          .select()
          .from(kpiProductionEntries)
          .where(
            and(
              eq(kpiProductionEntries.employeeId, employee.id),
              eq(kpiProductionEntries.metricType, metric.name),
              eq(kpiProductionEntries.status, 'SUBMITTED'),
              gte(kpiProductionEntries.date, periodStartStr),
              lte(kpiProductionEntries.date, periodEndStr)
            )
          );

        const totalQty = entries.reduce(
          (sum, e) => sum + Number(e.quantity),
          0
        );

        const targetQty = activeRule.targetQuantity;
        const amountPerUnit = activeRule.bonusAmountPerUnit;

        if (activeRule.bonusType === 'PER_EXTRA_UNIT') {
          if (totalQty > targetQty) {
            bonusPay = (totalQty - targetQty) * amountPerUnit;
          }
        } else if (activeRule.bonusType === 'FIXED') {
          if (totalQty >= targetQty) {
            bonusPay = amountPerUnit;
          }
        } else if (activeRule.bonusType === 'PERCENTAGE') {
          if (totalQty >= targetQty) {
            bonusPay = (amountPerUnit * baseSalary) / 100;
          }
        }
      }
    }

    // Calculate BPJS
    const bpjsKesehatan = calculateBPJSKesehatan(baseSalary);
    const bpjsKetenagakerjaan = calculateBPJSKetenagakerjaan(baseSalary);

    // Calculate tax (PPh 21) - simplified
    const grossIncome = baseSalary + totalAllowances + overtimePay + bonusPay;
    const taxAmount = calculateTax(grossIncome);

    const grossPay = baseSalary + totalAllowances + overtimePay + bonusPay;
    const totalDeductionsItem =
      totalDeductionsEmp +
      attendanceDeduction +
      taxAmount +
      bpjsKesehatan.employee +
      bpjsKetenagakerjaan.employee;
    const netPay = grossPay - totalDeductionsItem;

    // Collect the line item; persisted in the atomic block after the loop.
    itemsToInsert.push({
      id: nanoid(),
      runId: run.id,
      employeeId: employee.id,
      baseSalary,
      totalAllowances,
      totalDeductions: totalDeductionsItem,
      overtimePay,
      attendanceDeduction,
      taxAmount,
      bpjsKesehatanEmployee: bpjsKesehatan.employee,
      bpjsKesehatanCompany: bpjsKesehatan.company,
      bpjsKetenagakerjaanEmployee: bpjsKetenagakerjaan.employee,
      bpjsKetenagakerjaanCompany: bpjsKetenagakerjaan.company,
      grossPay,
      netPay,
      bonusPay,
      workDays: attendanceData.workDays,
      absentDays: attendanceData.absentDays,
      lateDays: attendanceData.lateDays,
      overtimeHours: overtimeData.totalHours,
    });

    totalGrossPay += grossPay;
    totalDeductions += totalDeductionsItem;
    totalNetPay += netPay;
  }

  // Persist atomically: clear any prior items, insert all freshly computed
  // ones, and finalize the run — all or nothing.
  const updated = await db.transaction(async (tx) => {
    await tx.delete(payrollItems).where(eq(payrollItems.runId, runId));
    if (itemsToInsert.length > 0) {
      await tx.insert(payrollItems).values(itemsToInsert);
    }
    const [row] = await tx
      .update(payrollRuns)
      .set({
        status: 'CALCULATED',
        totalEmployees: activeEmployees.length,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, runId))
      .returning();
    return row;
  });

  return updated;
}
