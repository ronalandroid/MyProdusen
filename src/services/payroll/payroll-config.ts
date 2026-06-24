import { db } from '@/lib/db';
import {
  payrollStructures,
  payrollComponents,
  employeePayrolls,
  payrollRuns,
  payrollItems,
  payrollRules,
  employees,
  employeeTeamAssignments,
} from '@/drizzle/schema';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { logAudit } from '@/lib/audit';
import { BusinessError } from '@/lib/core/business-error';

// ============================================
// PAYROLL STRUCTURE MANAGEMENT
// ============================================

export async function createStructure(data: {
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

export async function getStructures(isActive?: boolean) {
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

export async function getStructureById(id: string) {
  const [structure] = await db
    .select()
    .from(payrollStructures)
    .where(eq(payrollStructures.id, id))
    .limit(1);

  if (!structure) {
    throw new BusinessError('Struktur gaji tidak ditemukan');
  }

  // Get components
  const components = await db
    .select()
    .from(payrollComponents)
    .where(eq(payrollComponents.structureId, id));

  return { ...structure, components };
}

export async function updateStructure(
  id: string,
  data: {
    name?: string;
    description?: string;
    baseSalary?: number;
    isActive?: boolean;
  }
) {
  await assertStructureEditable(id);

  const [updated] = await db
    .update(payrollStructures)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(payrollStructures.id, id))
    .returning();

  if (!updated) {
    throw new BusinessError('Struktur gaji tidak ditemukan');
  }

  return updated;
}

export async function deleteStructure(id: string) {
  await assertStructureEditable(id);

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
    throw new BusinessError('Struktur gaji masih digunakan oleh karyawan');
  }

  await db
    .delete(payrollStructures)
    .where(eq(payrollStructures.id, id));

  return { success: true };
}

// ============================================
// PAYROLL COMPONENT MANAGEMENT
// ============================================

export async function addComponent(data: {
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

export async function updateComponent(
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
    throw new BusinessError('Komponen gaji tidak ditemukan');
  }

  return updated;
}

export async function deleteComponent(id: string) {
  await db
    .delete(payrollComponents)
    .where(eq(payrollComponents.id, id));

  return { success: true };
}

// ============================================
// EMPLOYEE PAYROLL ASSIGNMENT
// ============================================

export async function assignPayrollToEmployee(data: {
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
    throw new BusinessError('Assignment payroll tidak dapat diubah setelah ada payroll disetujui/dibayar');
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

export async function getEmployeePayroll(employeeId: string) {
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

export async function updateEmployeePayroll(
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
    throw new BusinessError('Data payroll karyawan tidak ditemukan');
  }

  await assertNoFinalPayrollForEmployee(assignment.employeeId);

  const [updated] = await db
    .update(employeePayrolls)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(employeePayrolls.id, id))
    .returning();

  if (!updated) {
    throw new BusinessError('Data payroll karyawan tidak ditemukan');
  }

  return updated;
}

// ============================================
// EDIT GUARDS (finalized payroll protection)
// ============================================

export async function assertStructureEditable(structureId: string) {
  const [finalized] = await db
    .select({ id: payrollItems.id })
    .from(payrollItems)
    .innerJoin(employeePayrolls, eq(payrollItems.employeeId, employeePayrolls.employeeId))
    .innerJoin(payrollRuns, eq(payrollItems.runId, payrollRuns.id))
    .where(and(eq(employeePayrolls.structureId, structureId), sql`${payrollRuns.status} IN ('APPROVED', 'PAID')`))
    .limit(1);

  if (finalized) {
    throw new BusinessError('Struktur payroll yang sudah masuk payroll approved/paid tidak dapat diedit langsung');
  }
}

export async function assertNoFinalPayrollForEmployee(employeeId: string) {
  const [finalized] = await db
    .select({ id: payrollItems.id })
    .from(payrollItems)
    .innerJoin(payrollRuns, eq(payrollItems.runId, payrollRuns.id))
    .where(and(eq(payrollItems.employeeId, employeeId), sql`${payrollRuns.status} IN ('APPROVED', 'PAID')`))
    .limit(1);

  if (finalized) {
    throw new BusinessError('Payroll karyawan yang sudah approved/paid tidak dapat diedit langsung');
  }
}

// ============================================
// PAYROLL TARGET / BONUS RULE ENGINE
// ============================================

export async function createPayrollRule(actorUserId: string, data: {
  employeeId?: string | null;
  teamId?: string | null;
  divisionId?: string | null;
  periodType: 'WEEKLY' | 'MONTHLY';
  baseSalary: number;
  targetMetricId?: string | null;
  targetQuantity?: number | null;
  bonusType?: 'PER_EXTRA_UNIT' | 'FIXED' | 'PERCENTAGE';
  bonusAmountPerUnit?: number | null;
  attendancePolicyId?: string | null;
  holidayMultiplierEnabled?: boolean;
  realtimeCalculationEnabled?: boolean;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
}) {
  const id = nanoid();
  const [rule] = await db
    .insert(payrollRules)
    .values({
      id,
      employeeId: data.employeeId || null,
      teamId: data.teamId || null,
      divisionId: data.divisionId || null,
      periodType: data.periodType,
      baseSalary: data.baseSalary,
      targetMetricId: data.targetMetricId || null,
      targetQuantity: data.targetQuantity || null,
      bonusType: data.bonusType || 'PER_EXTRA_UNIT',
      bonusAmountPerUnit: data.bonusAmountPerUnit || null,
      attendancePolicyId: data.attendancePolicyId || null,
      holidayMultiplierEnabled: data.holidayMultiplierEnabled ?? true,
      realtimeCalculationEnabled: data.realtimeCalculationEnabled ?? true,
      effectiveFrom: data.effectiveFrom || null,
      effectiveTo: data.effectiveTo || null,
      active: true,
      createdBy: actorUserId,
    })
    .returning();

  await logAudit(actorUserId, 'PAYROLL_RULE_CREATE', 'PayrollRule', id, undefined, rule);
  return rule;
}

export async function getPayrollRules(filters?: { active?: boolean; employeeId?: string; teamId?: string; divisionId?: string }) {
  let query = db.select().from(payrollRules);
  const conditions = [];
  if (filters?.active !== undefined) {
    conditions.push(eq(payrollRules.active, filters.active));
  }
  if (filters?.employeeId) {
    conditions.push(eq(payrollRules.employeeId, filters.employeeId));
  }
  if (filters?.teamId) {
    conditions.push(eq(payrollRules.teamId, filters.teamId));
  }
  if (filters?.divisionId) {
    conditions.push(eq(payrollRules.divisionId, filters.divisionId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  return query.orderBy(desc(payrollRules.createdAt));
}

export async function getPayrollRuleById(id: string) {
  const [rule] = await db.select().from(payrollRules).where(eq(payrollRules.id, id)).limit(1);
  if (!rule) throw new BusinessError('Aturan payroll tidak ditemukan');
  return rule;
}

export async function updatePayrollRule(actorUserId: string, id: string, data: Partial<{
  baseSalary: number;
  divisionId: string | null;
  targetMetricId: string | null;
  targetQuantity: number | null;
  bonusType: 'PER_EXTRA_UNIT' | 'FIXED' | 'PERCENTAGE';
  bonusAmountPerUnit: number | null;
  attendancePolicyId: string | null;
  holidayMultiplierEnabled: boolean;
  realtimeCalculationEnabled: boolean;
  active: boolean;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
}>) {
  const [existing] = await db.select().from(payrollRules).where(eq(payrollRules.id, id)).limit(1);
  if (!existing) throw new BusinessError('Aturan payroll tidak ditemukan');

  const [updated] = await db
    .update(payrollRules)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(payrollRules.id, id))
    .returning();

  await logAudit(actorUserId, 'PAYROLL_RULE_UPDATE', 'PayrollRule', id, JSON.stringify(existing), JSON.stringify(updated));
  return updated;
}

export async function deletePayrollRule(actorUserId: string, id: string) {
  return updatePayrollRule(actorUserId, id, { active: false });
}

export async function resolveActivePayrollRule(employeeId: string, targetDate = new Date()) {
  const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!emp) return null;

  const [teamAssignment] = await db
    .select()
    .from(employeeTeamAssignments)
    .where(and(eq(employeeTeamAssignments.employeeId, employeeId), eq(employeeTeamAssignments.active, true)))
    .limit(1);

  const allRules = await db
    .select()
    .from(payrollRules)
    .where(eq(payrollRules.active, true));

  const activeRules = allRules.filter((r) => {
    if (r.effectiveFrom && r.effectiveFrom > targetDate) return false;
    if (r.effectiveTo && r.effectiveTo < targetDate) return false;
    return true;
  });

  // Match hierarchy:
  // H1: EMPLOYEE
  const empRule = activeRules.find((r) => r.employeeId === employeeId);
  if (empRule) return empRule;

  // H2: TEAM
  if (teamAssignment?.teamId) {
    const teamRule = activeRules.find((r) => r.teamId === teamAssignment.teamId);
    if (teamRule) return teamRule;
  }

  // fallback: null
  return null;
}
