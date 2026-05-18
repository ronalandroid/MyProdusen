import { db } from '@/lib/db';
import {
  payrollStructures,
  payrollComponents,
  employeePayrolls,
  payrollRuns,
  payrollItems,
  payslips,
  employees,
  attendances,
  overtimeRequests,
} from '@/drizzle/schema';
import { eq, and, gte, lte, isNull, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export class PayrollService {
  // ============================================
  // PAYROLL STRUCTURE MANAGEMENT
  // ============================================

  async createStructure(data: {
    name: string;
    description?: string;
    baseSalary: number;
  }) {
    const [structure] = await db
      .insert(payrollStructures)
      .values({
        id: nanoid(),
        name: data.name,
        description: data.description,
        baseSalary: data.baseSalary,
        isActive: true,
      })
      .returning();

    return structure;
  }

  async getStructures(isActive?: boolean) {
    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(payrollStructures.isActive, isActive));
    }

    return await db
      .select()
      .from(payrollStructures)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(payrollStructures.createdAt);
  }

  async getStructureById(id: string) {
    const [structure] = await db
      .select()
      .from(payrollStructures)
      .where(eq(payrollStructures.id, id))
      .limit(1);

    if (!structure) {
      throw new Error('Struktur gaji tidak ditemukan');
    }

    // Get components
    const components = await db
      .select()
      .from(payrollComponents)
      .where(eq(payrollComponents.structureId, id));

    return { ...structure, components };
  }

  async updateStructure(
    id: string,
    data: {
      name?: string;
      description?: string;
      baseSalary?: number;
      isActive?: boolean;
    }
  ) {
    await this.assertStructureEditable(id);

    const [updated] = await db
      .update(payrollStructures)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(payrollStructures.id, id))
      .returning();

    if (!updated) {
      throw new Error('Struktur gaji tidak ditemukan');
    }

    return updated;
  }

  async deleteStructure(id: string) {
    await this.assertStructureEditable(id);

    // Check if structure is used by any employee
    const [usage] = await db
      .select()
      .from(employeePayrolls)
      .where(
        and(
          eq(employeePayrolls.structureId, id),
          isNull(employeePayrolls.endDate)
        )
      )
      .limit(1);

    if (usage) {
      throw new Error('Struktur gaji masih digunakan oleh karyawan');
    }

    await db
      .delete(payrollStructures)
      .where(eq(payrollStructures.id, id));

    return { success: true };
  }

  // ============================================
  // PAYROLL COMPONENT MANAGEMENT
  // ============================================

  async addComponent(data: {
    structureId: string;
    name: string;
    type: 'ALLOWANCE' | 'DEDUCTION' | 'BENEFIT';
    amount: number;
    isPercentage: boolean;
    isTaxable: boolean;
    description?: string;
  }) {
    const [component] = await db
      .insert(payrollComponents)
      .values({
        id: nanoid(),
        ...data,
      })
      .returning();

    return component;
  }

  async updateComponent(
    id: string,
    data: {
      name?: string;
      type?: 'ALLOWANCE' | 'DEDUCTION' | 'BENEFIT';
      amount?: number;
      isPercentage?: boolean;
      isTaxable?: boolean;
      description?: string;
    }
  ) {
    const [updated] = await db
      .update(payrollComponents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(payrollComponents.id, id))
      .returning();

    if (!updated) {
      throw new Error('Komponen gaji tidak ditemukan');
    }

    return updated;
  }

  async deleteComponent(id: string) {
    await db
      .delete(payrollComponents)
      .where(eq(payrollComponents.id, id));

    return { success: true };
  }

  // ============================================
  // EMPLOYEE PAYROLL ASSIGNMENT
  // ============================================

  async assignPayrollToEmployee(data: {
    employeeId: string;
    structureId: string;
    baseSalary: number;
    effectiveDate: Date;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
    taxId?: string;
    bpjsKesehatanNumber?: string;
    bpjsKetenagakerjaanNumber?: string;
  }) {
    const [activeRun] = await db
      .select({ id: payrollRuns.id })
      .from(payrollRuns)
      .where(sql`${payrollRuns.status} IN ('APPROVED', 'PAID')`)
      .limit(1);

    if (activeRun) {
      throw new Error('Assignment payroll tidak dapat diubah setelah ada payroll disetujui/dibayar');
    }

    // End previous payroll assignment
    await db
      .update(employeePayrolls)
      .set({
        endDate: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(employeePayrolls.employeeId, data.employeeId),
          isNull(employeePayrolls.endDate)
        )
      );

    // Create new assignment
    const [assignment] = await db
      .insert(employeePayrolls)
      .values({
        id: nanoid(),
        ...data,
      })
      .returning();

    return assignment;
  }

  async getEmployeePayroll(employeeId: string) {
    const [payroll] = await db
      .select()
      .from(employeePayrolls)
      .where(
        and(
          eq(employeePayrolls.employeeId, employeeId),
          isNull(employeePayrolls.endDate)
        )
      )
      .limit(1);

    return payroll;
  }

  async updateEmployeePayroll(
    id: string,
    data: {
      baseSalary?: number;
      bankName?: string;
      bankAccountNumber?: string;
      bankAccountName?: string;
      taxId?: string;
      bpjsKesehatanNumber?: string;
      bpjsKetenagakerjaanNumber?: string;
    }
  ) {
    const [assignment] = await db
      .select()
      .from(employeePayrolls)
      .where(eq(employeePayrolls.id, id))
      .limit(1);

    if (!assignment) {
      throw new Error('Data payroll karyawan tidak ditemukan');
    }

    await this.assertNoFinalPayrollForEmployee(assignment.employeeId);

    const [updated] = await db
      .update(employeePayrolls)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(employeePayrolls.id, id))
      .returning();

    if (!updated) {
      throw new Error('Data payroll karyawan tidak ditemukan');
    }

    return updated;
  }

  // ============================================
  // PAYROLL RUN & CALCULATION
  // ============================================

  async createPayrollRun(data: {
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
      throw new Error('Payroll untuk periode ini sudah ada');
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

  async calculatePayroll(runId: string) {
    const [run] = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, runId))
      .limit(1);

    if (!run) {
      throw new Error('Payroll run tidak ditemukan');
    }

    if (run.status !== 'DRAFT') {
      throw new Error('Payroll sudah dikalkulasi');
    }

    await db.delete(payrollItems).where(eq(payrollItems.runId, runId));

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

    for (const { employee, payroll, structure } of activeEmployees) {
      // Get attendance data for the period
      const attendanceData = await this.getAttendanceData(
        employee.id,
        run.periodStart,
        run.periodEnd
      );

      // Get overtime data for the period
      const overtimeData = await this.getOvertimeData(
        employee.id,
        run.periodStart,
        run.periodEnd
      );

      // Get payroll components
      const components = await db
        .select()
        .from(payrollComponents)
        .where(eq(payrollComponents.structureId, structure.id));

      // Calculate salary components
      const baseSalary = payroll.baseSalary;
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
      const attendanceDeduction = this.calculateAttendanceDeduction(
        baseSalary,
        attendanceData
      );

      // Calculate overtime pay
      const overtimePay = overtimeData.totalPay;

      // Calculate BPJS
      const bpjsKesehatan = this.calculateBPJSKesehatan(baseSalary);
      const bpjsKetenagakerjaan = this.calculateBPJSKetenagakerjaan(baseSalary);

      // Calculate tax (PPh 21) - simplified
      const grossIncome = baseSalary + totalAllowances + overtimePay;
      const taxAmount = this.calculateTax(grossIncome);

      const grossPay = baseSalary + totalAllowances + overtimePay;
      const totalDeductionsItem =
        totalDeductionsEmp +
        attendanceDeduction +
        taxAmount +
        bpjsKesehatan.employee +
        bpjsKetenagakerjaan.employee;
      const netPay = grossPay - totalDeductionsItem;

      // Create payroll item
      await db.insert(payrollItems).values({
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
        workDays: attendanceData.workDays,
        absentDays: attendanceData.absentDays,
        lateDays: attendanceData.lateDays,
        overtimeHours: overtimeData.totalHours,
      });

      totalGrossPay += grossPay;
      totalDeductions += totalDeductionsItem;
      totalNetPay += netPay;
    }

    // Update payroll run
    const [updated] = await db
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

    return updated;
  }

  private async getAttendanceData(
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

  private async getOvertimeData(
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

  private calculateAttendanceDeduction(
    baseSalary: number,
    attendanceData: { workDays: number; absentDays: number; lateDays: number }
  ) {
    // Deduct 1 day salary per absent day
    const dailySalary = baseSalary / 22; // Assuming 22 working days per month
    return attendanceData.absentDays * dailySalary;
  }

  private calculateBPJSKesehatan(baseSalary: number) {
    // BPJS Kesehatan: 5% (4% company, 1% employee)
    const total = baseSalary * 0.05;
    return {
      employee: baseSalary * 0.01,
      company: baseSalary * 0.04,
    };
  }

  private calculateBPJSKetenagakerjaan(baseSalary: number) {
    // BPJS Ketenagakerjaan: 5.7% (3.7% company, 2% employee)
    return {
      employee: baseSalary * 0.02,
      company: baseSalary * 0.037,
    };
  }

  private calculateTax(grossIncome: number) {
    // Simplified PPh 21 calculation
    // PTKP (Tax-free income): Rp 54,000,000 per year = Rp 4,500,000 per month
    const ptkp = 4500000;
    const taxableIncome = Math.max(0, grossIncome - ptkp);

    // Progressive tax rates
    let tax = 0;
    if (taxableIncome <= 5000000) {
      tax = taxableIncome * 0.05;
    } else if (taxableIncome <= 25000000) {
      tax = 5000000 * 0.05 + (taxableIncome - 5000000) * 0.15;
    } else if (taxableIncome <= 50000000) {
      tax = 5000000 * 0.05 + 20000000 * 0.15 + (taxableIncome - 25000000) * 0.25;
    } else {
      tax =
        5000000 * 0.05 +
        20000000 * 0.15 +
        25000000 * 0.25 +
        (taxableIncome - 50000000) * 0.3;
    }

    return tax;
  }

  async approvePayrollRun(runId: string, approvedBy: string) {
    const [run] = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, runId))
      .limit(1);

    if (!run) {
      throw new Error('Payroll run tidak ditemukan');
    }

    if (run.status !== 'CALCULATED') {
      throw new Error('Payroll belum dikalkulasi');
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

  async markPayrollRunPaid(runId: string) {
    const [run] = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, runId))
      .limit(1);

    if (!run) {
      throw new Error('Payroll run tidak ditemukan');
    }

    if (run.status !== 'APPROVED') {
      throw new Error('Hanya payroll approved yang dapat ditandai paid');
    }

    const [updated] = await db
      .update(payrollRuns)
      .set({ status: 'PAID', paidAt: new Date(), updatedAt: new Date() })
      .where(eq(payrollRuns.id, runId))
      .returning();

    return updated;
  }

  async getPayrollRuns() {
    return await db
      .select()
      .from(payrollRuns)
      .orderBy(sql`${payrollRuns.period} DESC`);
  }

  async getPayrollSummary() {
    const runs = await this.getPayrollRuns();
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

  async getPayrollRunById(id: string) {
    const [run] = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, id))
      .limit(1);

    if (!run) {
      throw new Error('Payroll run tidak ditemukan');
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

  async getEmployeePayrollItems(employeeId: string) {
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

  async getPayrollItemById(itemId: string) {
    const [row] = await db
      .select({ item: payrollItems, run: payrollRuns, employee: employees })
      .from(payrollItems)
      .innerJoin(payrollRuns, eq(payrollItems.runId, payrollRuns.id))
      .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
      .where(eq(payrollItems.id, itemId))
      .limit(1);

    if (!row) {
      throw new Error('Payslip tidak ditemukan');
    }

    return row;
  }

  async getOrCreatePayslip(itemId: string) {
    const row = await this.getPayrollItemById(itemId);
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

  async markPayslipDownloaded(itemId: string) {
    await db
      .update(payslips)
      .set({ isDownloaded: true, downloadedAt: new Date() })
      .where(eq(payslips.itemId, itemId));
  }

  private async assertStructureEditable(structureId: string) {
    const [finalized] = await db
      .select({ id: payrollItems.id })
      .from(payrollItems)
      .innerJoin(employeePayrolls, eq(payrollItems.employeeId, employeePayrolls.employeeId))
      .innerJoin(payrollRuns, eq(payrollItems.runId, payrollRuns.id))
      .where(and(eq(employeePayrolls.structureId, structureId), sql`${payrollRuns.status} IN ('APPROVED', 'PAID')`))
      .limit(1);

    if (finalized) {
      throw new Error('Struktur payroll yang sudah masuk payroll approved/paid tidak dapat diedit langsung');
    }
  }

  private async assertNoFinalPayrollForEmployee(employeeId: string) {
    const [finalized] = await db
      .select({ id: payrollItems.id })
      .from(payrollItems)
      .innerJoin(payrollRuns, eq(payrollItems.runId, payrollRuns.id))
      .where(and(eq(payrollItems.employeeId, employeeId), sql`${payrollRuns.status} IN ('APPROVED', 'PAID')`))
      .limit(1);

    if (finalized) {
      throw new Error('Payroll karyawan yang sudah approved/paid tidak dapat diedit langsung');
    }
  }
}

export const payrollService = new PayrollService();
