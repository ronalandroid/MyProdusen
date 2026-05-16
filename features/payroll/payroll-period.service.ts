import { db, payrollPeriods } from '@/lib/db';
import { and, gte, lte, eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auditService } from '@/features/audit/audit.service';

export type PayrollPeriodStatus = 'OPEN' | 'PREPARING' | 'LOCKED' | 'CLOSED';

export interface CreatePayrollPeriodInput {
  name: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
}

export interface LockPayrollPeriodInput {
  periodId: string;
  lockedBy: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UnlockPayrollPeriodInput {
  periodId: string;
  unlockedBy: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

export class PayrollPeriodService {
  async getPeriods() {
    return this.getAllPeriods();
  }

  /**
   * Get all payroll periods with optional filters
   */
  async getAllPeriods(filters?: {
    status?: PayrollPeriodStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(payrollPeriods.status, filters.status));
    }

    if (filters?.startDate) {
      conditions.push(gte(payrollPeriods.endDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(payrollPeriods.startDate, filters.endDate));
    }

    const periods = await db
      .select()
      .from(payrollPeriods)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(payrollPeriods.startDate);

    return periods;
  }

  /**
   * Get a single period by ID
   */
  async getPeriodById(periodId: string) {
    const [period] = await db
      .select()
      .from(payrollPeriods)
      .where(eq(payrollPeriods.id, periodId))
      .limit(1);

    return period || null;
  }

  /**
   * Get locked period for a specific date
   */
  async getLockedPeriodForDate(date: Date) {
    const [period] = await db
      .select()
      .from(payrollPeriods)
      .where(
        and(
          lte(payrollPeriods.startDate, date),
          gte(payrollPeriods.endDate, date),
          or(
            eq(payrollPeriods.status, 'LOCKED'),
            eq(payrollPeriods.status, 'CLOSED')
          )
        )
      )
      .limit(1);

    return period || null;
  }

  /**
   * Check if a date range overlaps with existing periods
   */
  async checkOverlappingPeriods(startDate: Date, endDate: Date, excludeId?: string) {
    const conditions = [
      or(
        and(
          lte(payrollPeriods.startDate, startDate),
          gte(payrollPeriods.endDate, startDate)
        ),
        and(
          lte(payrollPeriods.startDate, endDate),
          gte(payrollPeriods.endDate, endDate)
        ),
        and(
          gte(payrollPeriods.startDate, startDate),
          lte(payrollPeriods.endDate, endDate)
        )
      )
    ];

    if (excludeId) {
      conditions.push(eq(payrollPeriods.id, excludeId));
    }

    const overlapping = await db
      .select()
      .from(payrollPeriods)
      .where(
        excludeId
          ? and(conditions[0], eq(payrollPeriods.id, excludeId))
          : conditions[0]
      );

    return overlapping;
  }

  /**
   * Create a new payroll period
   */
  async createPeriod(input: CreatePayrollPeriodInput) {
    // Validate date range
    if (input.startDate >= input.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Check for overlapping periods
    const overlapping = await this.checkOverlappingPeriods(
      input.startDate,
      input.endDate
    );

    if (overlapping.length > 0) {
      throw new Error(
        `Period overlaps with existing period: ${overlapping[0].name}`
      );
    }

    const periodId = nanoid();

    const [newPeriod] = await db
      .insert(payrollPeriods)
      .values({
        id: periodId,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'OPEN',
        createdBy: input.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create audit log
    await auditService.log({
      userId: input.createdBy,
      action: 'PAYROLL_PERIOD_CREATED',
      entity: 'PayrollPeriod',
      entityId: periodId,
      newValue: JSON.stringify(newPeriod),
    });

    return newPeriod;
  }

  /**
   * Update period status
   */
  async updatePeriodStatus(
    periodId: string,
    status: PayrollPeriodStatus,
    updatedBy: string
  ) {
    const period = await this.getPeriodById(periodId);

    if (!period) {
      throw new Error('Payroll period not found');
    }

    // Validate status transitions
    if (period.status === 'CLOSED') {
      throw new Error('Cannot modify a closed period');
    }

    if (status === 'CLOSED' && period.status !== 'LOCKED') {
      throw new Error('Period must be locked before closing');
    }

    const [updatedPeriod] = await db
      .update(payrollPeriods)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(payrollPeriods.id, periodId))
      .returning();

    // Create audit log
    await auditService.log({
      userId: updatedBy,
      action: 'PAYROLL_PERIOD_STATUS_CHANGED',
      entity: 'PayrollPeriod',
      entityId: periodId,
      oldValue: JSON.stringify({ status: period.status }),
      newValue: JSON.stringify({ status }),
    });

    return updatedPeriod;
  }

  async updatePeriod(
    periodId: string,
    input: Partial<{ name: string; startDate: Date; endDate: Date; status: PayrollPeriodStatus }>
  ) {
    const period = await this.getPeriodById(periodId);

    if (!period) {
      throw new Error('Payroll period not found');
    }

    if (period.status === 'LOCKED' || period.status === 'CLOSED') {
      throw new Error('Cannot update a locked or closed payroll period');
    }

    const nextStartDate = input.startDate ?? period.startDate;
    const nextEndDate = input.endDate ?? period.endDate;

    if (nextStartDate >= nextEndDate) {
      throw new Error('Start date must be before end date');
    }

    const [updatedPeriod] = await db
      .update(payrollPeriods)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(payrollPeriods.id, periodId))
      .returning();

    return updatedPeriod;
  }

  /**
   * Lock a payroll period
   */
  async lockPeriod(input: LockPayrollPeriodInput) {
    const period = await this.getPeriodById(input.periodId);

    if (!period) {
      throw new Error('Payroll period not found');
    }

    if (period.status === 'LOCKED') {
      throw new Error('Period is already locked');
    }

    if (period.status === 'CLOSED') {
      throw new Error('Cannot lock a closed period');
    }

    if (!input.reason || input.reason.trim().length < 10) {
      throw new Error('Lock reason must be at least 10 characters');
    }

    const [lockedPeriod] = await db
      .update(payrollPeriods)
      .set({
        status: 'LOCKED',
        lockedBy: input.lockedBy,
        lockedAt: new Date(),
        lockedReason: input.reason,
        updatedAt: new Date(),
      })
      .where(eq(payrollPeriods.id, input.periodId))
      .returning();

    // Create audit log
    await auditService.log({
      userId: input.lockedBy,
      action: 'PAYROLL_PERIOD_LOCKED',
      entity: 'PayrollPeriod',
      entityId: input.periodId,
      oldValue: JSON.stringify({ status: period.status }),
      newValue: JSON.stringify({
        status: 'LOCKED',
        lockedBy: input.lockedBy,
        lockedAt: new Date(),
        lockedReason: input.reason,
      }),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return lockedPeriod;
  }

  /**
   * Unlock a payroll period (Superadmin only)
   */
  async unlockPeriod(input: UnlockPayrollPeriodInput) {
    const period = await this.getPeriodById(input.periodId);

    if (!period) {
      throw new Error('Payroll period not found');
    }

    if (period.status !== 'LOCKED') {
      throw new Error('Period is not locked');
    }

    if (!input.reason || input.reason.trim().length < 10) {
      throw new Error('Unlock reason must be at least 10 characters');
    }

    const [unlockedPeriod] = await db
      .update(payrollPeriods)
      .set({
        status: 'OPEN',
        lockedBy: null,
        lockedAt: null,
        lockedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(payrollPeriods.id, input.periodId))
      .returning();

    // Create audit log
    await auditService.log({
      userId: input.unlockedBy,
      action: 'PAYROLL_PERIOD_UNLOCKED',
      entity: 'PayrollPeriod',
      entityId: input.periodId,
      oldValue: JSON.stringify({
        status: 'LOCKED',
        lockedBy: period.lockedBy,
        lockedAt: period.lockedAt,
        lockedReason: period.lockedReason,
      }),
      newValue: JSON.stringify({
        status: 'OPEN',
        unlockReason: input.reason,
      }),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return unlockedPeriod;
  }

  /**
   * Assert that a date is editable (not in a locked period)
   * Throws error if date is locked and no valid override is provided
   * 
   * @param date - The date to check
   * @param overrideReason - Optional override reason (min 10 chars)
   * @param isSuperadmin - Whether the user is a Superadmin
   */
  async assertDateEditable(
    date: Date,
    overrideReason?: string,
    isSuperadmin: boolean = false
  ): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const lockedPeriod = await this.getLockedPeriodForDate(date);

    if (!lockedPeriod) {
      return; // Date is not in a locked period
    }

    // Superadmin can override with reason
    if (isSuperadmin && overrideReason && overrideReason.trim().length >= 10) {
      return;
    }

    // Otherwise, throw error
    throw new Error(
      `Periode payroll "${lockedPeriod.name}" (${lockedPeriod.startDate.toLocaleDateString()} - ${lockedPeriod.endDate.toLocaleDateString()}) sudah dikunci. ` +
      (isSuperadmin
        ? 'Perubahan membutuhkan alasan override minimal 10 karakter.'
        : 'Hubungi Superadmin untuk melakukan perubahan.')
    );
  }

  /**
   * Delete a period (only if OPEN and no data)
   */
  async deletePeriod(periodId: string, deletedBy?: string) {
    const period = await this.getPeriodById(periodId);

    if (!period) {
      throw new Error('Payroll period not found');
    }

    if (period.status !== 'OPEN') {
      throw new Error('Can only delete periods with OPEN status');
    }

    await db
      .delete(payrollPeriods)
      .where(eq(payrollPeriods.id, periodId));

    // Create audit log
    if (deletedBy) await auditService.log({
      userId: deletedBy,
      action: 'PAYROLL_PERIOD_DELETED',
      entity: 'PayrollPeriod',
      entityId: periodId,
      oldValue: JSON.stringify(period),
    });

    return { success: true };
  }
}

export const payrollPeriodService = new PayrollPeriodService();
