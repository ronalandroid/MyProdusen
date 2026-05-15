import { db, kpiTemplates, kpiItems, kpiAssignments, kpiResults, employees } from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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
      throw new Error('Template KPI tidak ditemukan');
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
      throw new Error('Template KPI tidak ditemukan');
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
      throw new Error('Item KPI tidak ditemukan');
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
      throw new Error('Karyawan tidak ditemukan');
    }

    // Check if template exists
    const [template] = await db
      .select()
      .from(kpiTemplates)
      .where(eq(kpiTemplates.id, data.templateId))
      .limit(1);

    if (!template) {
      throw new Error('Template KPI tidak ditemukan');
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
      throw new Error('KPI sudah di-assign untuk periode ini');
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
      throw new Error('Item KPI tidak ditemukan');
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
      throw new Error('Hasil KPI tidak ditemukan');
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
      throw new Error('Hasil KPI tidak ditemukan');
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
      throw new Error('Hasil KPI tidak ditemukan');
    }

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

    if (results.length === 0) {
      return {
        employeeId,
        period,
        totalScore: 0,
        weightedScore: 0,
        itemCount: 0,
        approvedCount: 0,
        items: [],
      };
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let approvedCount = 0;

    results.forEach(({ result, item }) => {
      if (item) {
        totalWeightedScore += result.score * item.weight;
        totalWeight += item.weight;
      }
      if (result.isApproved) {
        approvedCount++;
      }
    });

    const weightedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    return {
      employeeId,
      period,
      totalScore: results.reduce((sum, r) => sum + r.result.score, 0) / results.length,
      weightedScore,
      itemCount: results.length,
      approvedCount,
      items: results,
    };
  }
}

export const kpiService = new KpiService();
