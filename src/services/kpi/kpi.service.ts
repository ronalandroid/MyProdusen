import { db, kpiTemplates, kpiItems, kpiAssignments, kpiResults, employees, kpiMetrics, kpiTargets, employeeTeamAssignments, positions } from '@/lib/db';
import { eq, and, desc, sql, ne } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { notifyUser } from '@/lib/notifications/dispatch';
import { logAudit } from '@/lib/audit';
import { summarizeKpiResults } from '@/utils/kpi';
import { BusinessError } from '@/lib/core/business-error';

export type KpiScoringType = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'BOOLEAN';

function calculateKpiScore(
  actualValue: number,
  targetValue: number,
  minValue: number,
  maxValue: number,
  scoringType: KpiScoringType
): number {
  if (scoringType === 'BOOLEAN') {
    return actualValue >= targetValue ? 100 : 0;
  }

  if (scoringType === 'HIGHER_IS_BETTER') {
    if (actualValue >= targetValue) {
      return 100;
    }
    if (actualValue <= minValue) {
      return 0;
    }
    return ((actualValue - minValue) / (targetValue - minValue)) * 100;
  }

  if (scoringType === 'LOWER_IS_BETTER') {
    if (actualValue <= targetValue) {
      return 100;
    }
    if (actualValue >= maxValue) {
      return 0;
    }
    return ((maxValue - actualValue) / (maxValue - targetValue)) * 100;
  }

  return 0;
}

export class KpiService {
  // Template Management
  async createTemplate(data: {
    name: string;
    description?: string;
    createdBy: string;
  }) {
    const id = uuidv4();
    const [template] = await db
      .insert(kpiTemplates)
      .values({
        id,
        name: data.name,
        description: data.description,
        isActive: true,
      })
      .returning();

    return template;
  }

  async getTemplates(filters?: { isActive?: boolean }) {
    let query = db.select().from(kpiTemplates);

    if (filters?.isActive !== undefined) {
      query = query.where(eq(kpiTemplates.isActive, filters.isActive)) as any;
    }

    return query.orderBy(desc(kpiTemplates.createdAt));
  }

  async getTemplateById(id: string) {
    const [template] = await db
      .select()
      .from(kpiTemplates)
      .where(eq(kpiTemplates.id, id))
      .limit(1);

    if (!template) {
      throw new BusinessError('Template KPI tidak ditemukan');
    }

    // Get items
    const items = await db
      .select()
      .from(kpiItems)
      .where(eq(kpiItems.templateId, id))
      .orderBy(kpiItems.createdAt);

    return { ...template, items };
  }

  async updateTemplate(id: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }) {
    const [template] = await db
      .update(kpiTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(kpiTemplates.id, id))
      .returning();

    if (!template) {
      throw new BusinessError('Template KPI tidak ditemukan');
    }

    return template;
  }

  async deleteTemplate(id: string) {
    // Soft delete by setting isActive to false
    return this.updateTemplate(id, { isActive: false });
  }

  // KPI Item Management
  async createItem(data: {
    templateId: string;
    name: string;
    description?: string;
    weight?: number;
    scoringType?: KpiScoringType;
    targetValue?: number;
    minValue?: number;
    maxValue?: number;
    unit?: string;
  }) {
    const id = uuidv4();
    const [item] = await db
      .insert(kpiItems)
      .values({
        id,
        templateId: data.templateId,
        name: data.name,
        description: data.description,
        weight: data.weight ?? 1.0,
        scoringType: data.scoringType ?? 'HIGHER_IS_BETTER',
        targetValue: data.targetValue,
        minValue: data.minValue,
        maxValue: data.maxValue,
        unit: data.unit,
      })
      .returning();

    return item;
  }

  async updateItem(id: string, data: Partial<{
    name: string;
    description: string;
    weight: number;
    scoringType: KpiScoringType;
    targetValue: number;
    minValue: number;
    maxValue: number;
    unit: string;
  }>) {
    const [item] = await db
      .update(kpiItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(kpiItems.id, id))
      .returning();

    if (!item) {
      throw new BusinessError('Item KPI tidak ditemukan');
    }

    return item;
  }

  async deleteItem(id: string) {
    await db.delete(kpiItems).where(eq(kpiItems.id, id));
  }

  // KPI Assignment Management
  async assignKpi(data: {
    employeeId: string;
    templateId: string;
    period: string;
    assignedBy: string;
  }) {
    // Check if employee exists
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, data.employeeId))
      .limit(1);

    if (!employee) {
      throw new BusinessError('Karyawan tidak ditemukan');
    }

    // Check if template exists
    const [template] = await db
      .select()
      .from(kpiTemplates)
      .where(eq(kpiTemplates.id, data.templateId))
      .limit(1);

    if (!template) {
      throw new BusinessError('Template KPI tidak ditemukan');
    }

    // Check if already assigned
    const [existing] = await db
      .select()
      .from(kpiAssignments)
      .where(
        and(
          eq(kpiAssignments.employeeId, data.employeeId),
          eq(kpiAssignments.templateId, data.templateId),
          eq(kpiAssignments.period, data.period)
        )
      )
      .limit(1);

    if (existing) {
      throw new BusinessError('KPI sudah di-assign untuk periode ini');
    }

    const id = uuidv4();
    const [assignment] = await db
      .insert(kpiAssignments)
      .values({
        id,
        employeeId: data.employeeId,
        templateId: data.templateId,
        period: data.period,
        assignedBy: data.assignedBy,
      })
      .returning();

    return assignment;
  }

  async getAssignments(filters?: {
    employeeId?: string;
    period?: string;
  }) {
    let query = db
      .select({
        assignment: kpiAssignments,
        employee: employees,
        template: kpiTemplates,
      })
      .from(kpiAssignments)
      .leftJoin(employees, eq(kpiAssignments.employeeId, employees.id))
      .leftJoin(kpiTemplates, eq(kpiAssignments.templateId, kpiTemplates.id));

    const conditions = [];
    if (filters?.employeeId) {
      conditions.push(eq(kpiAssignments.employeeId, filters.employeeId));
    }
    if (filters?.period) {
      conditions.push(eq(kpiAssignments.period, filters.period));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(kpiAssignments.createdAt));
  }

  // KPI Result Management
  async submitResult(data: {
    employeeId: string;
    itemId: string;
    period: string;
    actualValue: number;
    notes?: string;
  }) {
    // Get item details for scoring
    const [item] = await db
      .select()
      .from(kpiItems)
      .where(eq(kpiItems.id, data.itemId))
      .limit(1);

    if (!item) {
      throw new BusinessError('Item KPI tidak ditemukan');
    }

    // Calculate score
    const score = calculateKpiScore(
      data.actualValue,
      item.targetValue ?? 0,
      item.minValue ?? 0,
      item.maxValue ?? 100,
      item.scoringType as KpiScoringType
    );

    // Check if result already exists
    const [existing] = await db
      .select()
      .from(kpiResults)
      .where(
        and(
          eq(kpiResults.employeeId, data.employeeId),
          eq(kpiResults.itemId, data.itemId),
          eq(kpiResults.period, data.period)
        )
      )
      .limit(1);

    if (existing) {
      if (existing.isApproved) {
        throw new BusinessError('Hasil KPI sudah disetujui dan tidak dapat diubah tanpa alasan otorisasi');
      }

      // Update existing
      const [result] = await db
        .update(kpiResults)
        .set({
          actualValue: data.actualValue,
          score,
          notes: data.notes,
          updatedAt: new Date(),
        })
        .where(eq(kpiResults.id, existing.id))
        .returning();

      return result;
    }

    // Create new
    const id = uuidv4();
    const [result] = await db
      .insert(kpiResults)
      .values({
        id,
        employeeId: data.employeeId,
        itemId: data.itemId,
        period: data.period,
        actualValue: data.actualValue,
        score,
        notes: data.notes,
        isApproved: false,
      })
      .returning();

    return result;
  }

  async getResults(filters?: {
    employeeId?: string;
    period?: string;
    isApproved?: boolean;
  }) {
    let query = db
      .select({
        result: kpiResults,
        employee: employees,
        item: kpiItems,
      })
      .from(kpiResults)
      .leftJoin(employees, eq(kpiResults.employeeId, employees.id))
      .leftJoin(kpiItems, eq(kpiResults.itemId, kpiItems.id));

    const conditions = [];
    if (filters?.employeeId) {
      conditions.push(eq(kpiResults.employeeId, filters.employeeId));
    }
    if (filters?.period) {
      conditions.push(eq(kpiResults.period, filters.period));
    }
    if (filters?.isApproved !== undefined) {
      conditions.push(eq(kpiResults.isApproved, filters.isApproved));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(kpiResults.createdAt));
  }

  async getResultById(id: string) {
    const [result] = await db
      .select({
        result: kpiResults,
        employee: employees,
        item: kpiItems,
      })
      .from(kpiResults)
      .leftJoin(employees, eq(kpiResults.employeeId, employees.id))
      .leftJoin(kpiItems, eq(kpiResults.itemId, kpiItems.id))
      .where(eq(kpiResults.id, id))
      .limit(1);

    if (!result) {
      throw new BusinessError('Hasil KPI tidak ditemukan');
    }

    return result;
  }

  async updateResult(id: string, data: {
    actualValue?: number;
    notes?: string;
  }) {
    const [existing] = await db
      .select()
      .from(kpiResults)
      .where(eq(kpiResults.id, id))
      .limit(1);

    if (!existing) {
      throw new BusinessError('Hasil KPI tidak ditemukan');
    }

    if (existing.isApproved) {
      throw new BusinessError('Hasil KPI sudah disetujui dan tidak dapat diubah tanpa alasan otorisasi');
    }

    let score = existing.score;

    // Recalculate score if actualValue changed
    if (data.actualValue !== undefined) {
      const [item] = await db
        .select()
        .from(kpiItems)
        .where(eq(kpiItems.id, existing.itemId))
        .limit(1);

      if (item) {
        score = calculateKpiScore(
          data.actualValue,
          item.targetValue ?? 0,
          item.minValue ?? 0,
          item.maxValue ?? 100,
          item.scoringType as KpiScoringType
        );
      }
    }

    const [result] = await db
      .update(kpiResults)
      .set({
        actualValue: data.actualValue ?? existing.actualValue,
        score,
        notes: data.notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(kpiResults.id, id))
      .returning();

    return result;
  }

  async approveResult(id: string, approvedBy: string) {
    const [existing] = await db
      .select()
      .from(kpiResults)
      .where(eq(kpiResults.id, id))
      .limit(1);

    if (!existing) {
      throw new BusinessError('Hasil KPI tidak ditemukan');
    }

    if (existing.isApproved) {
      throw new BusinessError('Hasil KPI sudah disetujui');
    }

    const [result] = await db
      .update(kpiResults)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(kpiResults.id, id))
      .returning();

    if (!result) {
      throw new BusinessError('Hasil KPI tidak ditemukan');
    }

    await notifyUser({
      employeeId: result.employeeId,
      title: 'Hasil KPI disetujui',
      message: `Hasil KPI periode ${result.period} telah disetujui.`,
      type: 'KPI_APPROVED',
    });

    return result;
  }

  async getEmployeeKpiSummary(employeeId: string, period: string) {
    // Get all results for employee in period
    const results = await db
      .select({
        result: kpiResults,
        item: kpiItems,
      })
      .from(kpiResults)
      .leftJoin(kpiItems, eq(kpiResults.itemId, kpiItems.id))
      .where(
        and(
          eq(kpiResults.employeeId, employeeId),
          eq(kpiResults.period, period)
        )
      );

    return {
      employeeId,
      period,
      ...summarizeKpiResults(results),
      items: results,
    };
  }

  // ============================================
  // KPI METRICS AND TARGET RULES
  // ============================================

  async createMetric(actorUserId: string, data: { name: string; unit: string; active?: boolean }) {
    if (!data.name?.trim()) throw new BusinessError('Nama metrik KPI wajib diisi');
    const id = uuidv4();
    const [metric] = await db
      .insert(kpiMetrics)
      .values({
        id,
        name: data.name.trim(),
        unit: data.unit || 'pcs',
        active: data.active ?? true,
      })
      .returning();

    await logAudit(actorUserId, 'KPI_METRIC_CREATE', 'KpiMetric', id, undefined, metric);
    return metric;
  }

  async getMetrics(filters?: { active?: boolean }) {
    let query = db.select().from(kpiMetrics);
    const conditions = [];
    if (filters?.active !== undefined) {
      conditions.push(eq(kpiMetrics.active, filters.active));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return query.orderBy(desc(kpiMetrics.createdAt));
  }

  async getMetricById(id: string) {
    const [metric] = await db.select().from(kpiMetrics).where(eq(kpiMetrics.id, id)).limit(1);
    if (!metric) throw new BusinessError('Metrik KPI tidak ditemukan');
    return metric;
  }

  async updateMetric(actorUserId: string, id: string, data: Partial<{ name: string; unit: string; active: boolean }>) {
    const [existing] = await db.select().from(kpiMetrics).where(eq(kpiMetrics.id, id)).limit(1);
    if (!existing) throw new BusinessError('Metrik KPI tidak ditemukan');

    const [updated] = await db
      .update(kpiMetrics)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(kpiMetrics.id, id))
      .returning();

    await logAudit(actorUserId, 'KPI_METRIC_UPDATE', 'KpiMetric', id, JSON.stringify(existing), JSON.stringify(updated));
    return updated;
  }

  async deleteMetric(actorUserId: string, id: string) {
    return this.updateMetric(actorUserId, id, { active: false });
  }

  async createTarget(actorUserId: string, data: {
    metricId: string;
    scopeType: string;
    scopeId?: string | null;
    periodType: string;
    targetQuantity: number;
    active?: boolean;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }) {
    if (!data.metricId) throw new BusinessError('Metrik KPI wajib diisi');
    if (!data.scopeType) throw new BusinessError('Tipe scope target wajib diisi');
    if (data.targetQuantity < 0) throw new BusinessError('Target kuantitas tidak boleh negatif');

    const id = uuidv4();
    const [target] = await db
      .insert(kpiTargets)
      .values({
        id,
        metricId: data.metricId,
        scopeType: data.scopeType,
        scopeId: data.scopeId || null,
        periodType: data.periodType || 'DAILY',
        targetQuantity: data.targetQuantity,
        active: data.active ?? true,
        effectiveFrom: data.effectiveFrom || null,
        effectiveTo: data.effectiveTo || null,
        createdBy: actorUserId,
      })
      .returning();

    await logAudit(actorUserId, 'KPI_TARGET_CREATE', 'KpiTarget', id, undefined, target);
    return target;
  }

  async getTargets(filters?: { active?: boolean; scopeType?: string; scopeId?: string }) {
    let query = db
      .select({
        target: kpiTargets,
        metric: kpiMetrics,
      })
      .from(kpiTargets)
      .innerJoin(kpiMetrics, eq(kpiTargets.metricId, kpiMetrics.id));

    const conditions = [];
    if (filters?.active !== undefined) {
      conditions.push(eq(kpiTargets.active, filters.active));
    }
    if (filters?.scopeType) {
      conditions.push(eq(kpiTargets.scopeType, filters.scopeType));
    }
    if (filters?.scopeId) {
      conditions.push(eq(kpiTargets.scopeId, filters.scopeId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return query.orderBy(desc(kpiTargets.createdAt));
  }

  async getTargetById(id: string) {
    const [target] = await db.select().from(kpiTargets).where(eq(kpiTargets.id, id)).limit(1);
    if (!target) throw new BusinessError('Target KPI tidak ditemukan');
    return target;
  }

  async updateTarget(actorUserId: string, id: string, data: Partial<{
    targetQuantity: number;
    active: boolean;
    effectiveFrom: Date;
    effectiveTo: Date;
  }>) {
    const [existing] = await db.select().from(kpiTargets).where(eq(kpiTargets.id, id)).limit(1);
    if (!existing) throw new BusinessError('Target KPI tidak ditemukan');

    const [updated] = await db
      .update(kpiTargets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(kpiTargets.id, id))
      .returning();

    await logAudit(actorUserId, 'KPI_TARGET_UPDATE', 'KpiTarget', id, JSON.stringify(existing), JSON.stringify(updated));
    return updated;
  }

  async deleteTarget(actorUserId: string, id: string) {
    return this.updateTarget(actorUserId, id, { active: false });
  }

  async resolveActiveTarget(employeeId: string, metricId: string, targetDate = new Date()) {
    const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    if (!emp) return null;

    const [teamAssignment] = await db
      .select()
      .from(employeeTeamAssignments)
      .where(and(eq(employeeTeamAssignments.employeeId, employeeId), eq(employeeTeamAssignments.active, true)))
      .limit(1);

    const allTargets = await db
      .select()
      .from(kpiTargets)
      .where(and(eq(kpiTargets.metricId, metricId), eq(kpiTargets.active, true)));

    const activeTargets = allTargets.filter((t) => {
      if (t.effectiveFrom && t.effectiveFrom > targetDate) return false;
      if (t.effectiveTo && t.effectiveTo < targetDate) return false;
      return true;
    });

    // Resolve by hierarchy:
    // H1: EMPLOYEE
    const empTarget = activeTargets.find((t) => t.scopeType === 'EMPLOYEE' && t.scopeId === employeeId);
    if (empTarget) return empTarget;

    // H2: POSITION
    if (emp.position) {
      const posTarget = activeTargets.find((t) => t.scopeType === 'POSITION' && t.scopeId === emp.position);
      if (posTarget) return posTarget;
    }

    // H3: TEAM
    if (teamAssignment?.teamId) {
      const teamTarget = activeTargets.find((t) => t.scopeType === 'TEAM' && t.scopeId === teamAssignment.teamId);
      if (teamTarget) return teamTarget;
    }

    // H4: COMPANY
    const companyTarget = activeTargets.find((t) => t.scopeType === 'COMPANY');
    if (companyTarget) return companyTarget;

    return null;
  }
}

export const kpiService = new KpiService();

