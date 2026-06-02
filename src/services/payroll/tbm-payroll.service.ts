import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { db, divisions, positions, payrollRules, employeePayrolls, employees, payrollItems, payrollRuns } from '@/lib/db';
import { AppError } from '@/lib/core/app-error';

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function amount(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 0) throw new AppError('VALIDATION_ERROR', 'Nominal gaji wajib berupa angka 0 atau lebih', 422);
  return parsed;
}

export class TbmPayrollService {
  async listDivisions() {
    return db.select({ id: divisions.id, name: divisions.name, code: divisions.code, description: divisions.description, isActive: divisions.isActive, employeeCount: sql<number>`count(${employees.id})::int` })
      .from(divisions)
      .leftJoin(employees, eq(employees.divisionId, divisions.id))
      .groupBy(divisions.id)
      .orderBy(asc(divisions.name));
  }

  async upsertDivision(data: { id?: string; name: string; code?: string; description?: string | null; isActive?: boolean }) {
    const code = data.code?.trim() || slug(data.name);
    if (data.id) {
      const [row] = await db.update(divisions).set({ name: data.name.trim(), code, description: data.description ?? null, isActive: data.isActive ?? true, updatedAt: new Date() }).where(eq(divisions.id, data.id)).returning();
      return row;
    }
    const [existing] = await db.select().from(divisions).where(eq(divisions.code, code)).limit(1);
    if (existing) return db.update(divisions).set({ name: data.name.trim(), description: data.description ?? existing.description, isActive: data.isActive ?? existing.isActive, updatedAt: new Date() }).where(eq(divisions.id, existing.id)).returning().then(([row]) => row);
    const [row] = await db.insert(divisions).values({ id: id('division'), name: data.name.trim(), code, description: data.description ?? null, isActive: data.isActive ?? true }).returning();
    return row;
  }

  async listPositions() {
    return db.select({ id: positions.id, name: positions.name, code: positions.code, divisionId: positions.divisionId, divisionName: divisions.name, type: positions.type, isActive: positions.isActive })
      .from(positions)
      .leftJoin(divisions, eq(divisions.id, positions.divisionId))
      .orderBy(asc(positions.name));
  }

  async upsertPosition(data: { id?: string; divisionId?: string | null; name: string; code?: string; type?: string | null; isActive?: boolean }) {
    const code = data.code?.trim() || slug(data.name);
    if (data.id) {
      const [row] = await db.update(positions).set({ divisionId: data.divisionId ?? null, name: data.name.trim(), code, type: data.type ?? null, active: data.isActive ?? true, isActive: data.isActive ?? true, updatedAt: new Date() }).where(eq(positions.id, data.id)).returning();
      return row;
    }
    const [existing] = await db.select().from(positions).where(eq(positions.code, code)).limit(1);
    if (existing) return db.update(positions).set({ divisionId: data.divisionId ?? existing.divisionId, name: data.name.trim(), type: data.type ?? existing.type, active: data.isActive ?? existing.active, isActive: data.isActive ?? existing.isActive, updatedAt: new Date() }).where(eq(positions.id, existing.id)).returning().then(([row]) => row);
    const [row] = await db.insert(positions).values({ id: id('position'), divisionId: data.divisionId ?? null, name: data.name.trim(), code, type: data.type ?? null, active: data.isActive ?? true, isActive: data.isActive ?? true }).returning();
    return row;
  }

  async listPayrollRules() {
    return db.select({ id: payrollRules.id, name: payrollRules.name, divisionId: payrollRules.divisionId, divisionName: divisions.name, positionId: payrollRules.positionId, positionName: positions.name, employeeId: payrollRules.employeeId, salaryType: payrollRules.salaryType, baseAmount: payrollRules.baseAmount, trainingAmount: payrollRules.trainingAmount, fullAmount: payrollRules.fullAmount, trainingDurationDays: payrollRules.trainingDurationDays, effectiveFrom: payrollRules.effectiveFrom, effectiveTo: payrollRules.effectiveTo, isActive: payrollRules.isActive })
      .from(payrollRules)
      .leftJoin(divisions, eq(divisions.id, payrollRules.divisionId))
      .leftJoin(positions, eq(positions.id, payrollRules.positionId))
      .orderBy(asc(payrollRules.name));
  }

  async upsertPayrollRule(actorUserId: string, data: any) {
    const salaryType = String(data.salaryType || data.periodType || 'monthly').toLowerCase();
    if (!['monthly', 'daily', 'weekly'].includes(salaryType)) throw new AppError('VALIDATION_ERROR', 'Tipe gaji tidak valid', 422);
    const baseAmount = amount(data.baseAmount ?? data.baseSalary ?? data.fullAmount ?? data.trainingAmount ?? 0);
    const values = { name: String(data.name || 'Aturan Gaji').trim(), divisionId: data.divisionId || null, positionId: data.positionId || null, employeeId: data.employeeId || null, periodType: salaryType.toUpperCase(), salaryType, baseSalary: baseAmount, baseAmount, trainingAmount: data.trainingAmount == null ? null : amount(data.trainingAmount), fullAmount: data.fullAmount == null ? null : amount(data.fullAmount), trainingDurationDays: data.trainingDurationDays == null ? null : Number(data.trainingDurationDays), effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(), effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null, active: data.isActive ?? true, isActive: data.isActive ?? true, createdBy: actorUserId, updatedAt: new Date() };
    if (data.id) return db.update(payrollRules).set(values).where(eq(payrollRules.id, data.id)).returning().then(([row]) => row);
    return db.insert(payrollRules).values({ id: id('payroll_rule'), ...values }).returning().then(([row]) => row);
  }

  async assignEmployeePayroll(data: { employeeId: string; divisionId?: string | null; positionId?: string | null; payrollRuleId?: string | null; trainingStatus?: string; trainingEndDate?: string | null; customAmount?: number | null; effectiveFrom?: string }) {
    const [employee] = await db.select().from(employees).where(eq(employees.id, data.employeeId)).limit(1);
    if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'Karyawan tidak ditemukan', 404);
    const [rule] = data.payrollRuleId ? await db.select().from(payrollRules).where(eq(payrollRules.id, data.payrollRuleId)).limit(1) : [null];
    const resolvedAmount = data.customAmount != null ? amount(data.customAmount) : amount(rule?.baseAmount ?? rule?.baseSalary ?? 0);
    await db.update(employees).set({ divisionId: data.divisionId ?? employee.divisionId, positionId: data.positionId ?? employee.positionId, division: data.divisionId ?? employee.division, position: data.positionId ?? employee.position, trainingStatus: data.trainingStatus || employee.trainingStatus || 'FULL_TIME', trainingEndDate: data.trainingEndDate ? new Date(data.trainingEndDate) : employee.trainingEndDate, updatedAt: new Date() }).where(eq(employees.id, data.employeeId));
    await db.update(employeePayrolls).set({ endDate: new Date(), active: false, updatedAt: new Date() }).where(and(eq(employeePayrolls.employeeId, data.employeeId), isNull(employeePayrolls.endDate)));
    const [assignment] = await db.insert(employeePayrolls).values({ id: id('employee_payroll'), employeeId: data.employeeId, structureId: 'tbm-configurable', payrollRuleId: data.payrollRuleId ?? null, baseSalary: resolvedAmount, trainingStatus: data.trainingStatus || 'FULL_TIME', trainingEndDate: data.trainingEndDate ? new Date(data.trainingEndDate) : null, customAmount: data.customAmount ?? null, active: true, effectiveDate: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date() }).returning();
    return assignment;
  }

  async getEmployeeOwnSalary(userId: string) {
    const [employee] = await db.select({ id: employees.id, divisionId: employees.divisionId, positionId: employees.positionId, trainingStatus: employees.trainingStatus }).from(employees).where(eq(employees.userId, userId)).limit(1);
    if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'Data karyawan tidak ditemukan', 404);
    const [assignment] = await db.select().from(employeePayrolls).where(and(eq(employeePayrolls.employeeId, employee.id), isNull(employeePayrolls.endDate))).limit(1);
    const [runItem] = await db.select({ period: payrollRuns.period, netPay: payrollItems.netPay, status: payrollRuns.status }).from(payrollItems).innerJoin(payrollRuns, eq(payrollRuns.id, payrollItems.runId)).where(eq(payrollItems.employeeId, employee.id)).orderBy(sql`${payrollRuns.period} desc`).limit(1);
    return { employeeId: employee.id, divisionId: employee.divisionId, positionId: employee.positionId, trainingStatus: employee.trainingStatus, salaryType: assignment?.payrollRuleId ? 'configurable' : 'structure', currentSalary: assignment?.customAmount ?? assignment?.baseSalary ?? null, payrollPeriod: runItem?.period ?? null, payslip: runItem ?? null };
  }
}

export const tbmPayrollService = new TbmPayrollService();
