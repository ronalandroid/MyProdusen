import { db } from '@/lib/db';
import {
  overtimeRates,
  overtimeRequests,
  employees,
  employeePayrolls,
} from '@/drizzle/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { calculateOvertimeHourlyRate } from '@/lib/overtime/payroll-integration';
import { payrollPeriodLockService } from '@/features/payroll/payroll-period-lock.service';
import { BusinessError } from '@/lib/core/business-error';

export class OvertimeService {
  // ============================================
  // OVERTIME RATE MANAGEMENT
  // ============================================

  async createRate(data: {
    name: string;
    multiplier: number;
    description?: string;
    isWeekday: boolean;
    isWeekend: boolean;
    isHoliday: boolean;
  }) {
    const [rate] = await db
      .insert(overtimeRates)
      .values({
        id: nanoid(),
        ...data,
        isActive: true,
      })
      .returning();

    return rate;
  }

  async getRates(isActive?: boolean) {
    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(overtimeRates.isActive, isActive));
    }

    return await db
      .select()
      .from(overtimeRates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(overtimeRates.createdAt);
  }

  async getRateById(id: string) {
    const [rate] = await db
      .select()
      .from(overtimeRates)
      .where(eq(overtimeRates.id, id))
      .limit(1);

    if (!rate) {
      throw new BusinessError('Rate lembur tidak ditemukan');
    }

    return rate;
  }

  async updateRate(
    id: string,
    data: {
      name?: string;
      multiplier?: number;
      description?: string;
      isWeekday?: boolean;
      isWeekend?: boolean;
      isHoliday?: boolean;
      isActive?: boolean;
    }
  ) {
    const [updated] = await db
      .update(overtimeRates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(overtimeRates.id, id))
      .returning();

    if (!updated) {
      throw new BusinessError('Rate lembur tidak ditemukan');
    }

    return updated;
  }

  async deleteRate(id: string) {
    // Check if rate is used
    const [usage] = await db
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.rateId, id))
      .limit(1);

    if (usage) {
      throw new BusinessError('Rate lembur masih digunakan');
    }

    await db.delete(overtimeRates).where(eq(overtimeRates.id, id));

    return { success: true };
  }

  // ============================================
  // OVERTIME REQUEST MANAGEMENT
  // ============================================

  async createRequest(data: {
    employeeId: string;
    overtimeDate: Date;
    startTime: string;
    endTime: string;
    durationHours: number;
    rateId: string;
    reason: string;
  }) {
    await payrollPeriodLockService.assertAttendanceDateEditable(data.overtimeDate, data.reason);

    // Get employee payroll to calculate pay
    const [payroll] = await db
      .select()
      .from(employeePayrolls)
      .where(
        and(
          eq(employeePayrolls.employeeId, data.employeeId),
          isNull(employeePayrolls.endDate)
        )
      )
      .limit(1);

    if (!payroll) {
      throw new BusinessError('Karyawan belum memiliki struktur gaji');
    }

    // Get rate
    const rate = await this.getRateById(data.rateId);

    // Calculate overtime pay
    const hourlyRate = calculateOvertimeHourlyRate(payroll.baseSalary);
    const calculatedPay = hourlyRate * data.durationHours * rate.multiplier;

    const [request] = await db
      .insert(overtimeRequests)
      .values({
        id: nanoid(),
        ...data,
        calculatedPay,
        status: 'PENDING',
      })
      .returning();

    return request;
  }

  async getRequests(filters?: {
    employeeId?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    startDate?: Date;
    endDate?: Date;
  }) {
    const conditions = [];

    if (filters?.employeeId) {
      conditions.push(eq(overtimeRequests.employeeId, filters.employeeId));
    }

    if (filters?.status) {
      conditions.push(eq(overtimeRequests.status, filters.status));
    }

    if (filters?.startDate) {
      conditions.push(gte(overtimeRequests.overtimeDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(overtimeRequests.overtimeDate, filters.endDate));
    }

    return await db
      .select({
        request: overtimeRequests,
        employee: employees,
        rate: overtimeRates,
      })
      .from(overtimeRequests)
      .innerJoin(employees, eq(overtimeRequests.employeeId, employees.id))
      .innerJoin(overtimeRates, eq(overtimeRequests.rateId, overtimeRates.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(overtimeRequests.overtimeDate);
  }

  async getRequestById(id: string) {
    const [result] = await db
      .select({
        request: overtimeRequests,
        employee: employees,
        rate: overtimeRates,
      })
      .from(overtimeRequests)
      .innerJoin(employees, eq(overtimeRequests.employeeId, employees.id))
      .innerJoin(overtimeRates, eq(overtimeRequests.rateId, overtimeRates.id))
      .where(eq(overtimeRequests.id, id))
      .limit(1);

    if (!result) {
      throw new BusinessError('Request lembur tidak ditemukan');
    }

    return result;
  }

  async updateRequest(
    id: string,
    data: {
      overtimeDate?: Date;
      startTime?: string;
      endTime?: string;
      durationHours?: number;
      rateId?: string;
      reason?: string;
    }
  ) {
    const existing = await this.getRequestById(id);

    await payrollPeriodLockService.assertAttendanceDateEditable(data.overtimeDate || existing.request.overtimeDate, data.reason);

    if (existing.request.status !== 'PENDING') {
      throw new BusinessError('Hanya request dengan status PENDING yang bisa diubah');
    }

    // Recalculate if duration or rate changed
    let calculatedPay = existing.request.calculatedPay;
    if (data.durationHours || data.rateId) {
      const [payroll] = await db
        .select()
        .from(employeePayrolls)
        .where(
          and(
            eq(employeePayrolls.employeeId, existing.request.employeeId),
            isNull(employeePayrolls.endDate)
          )
        )
        .limit(1);

      const rate = await this.getRateById(
        data.rateId || existing.request.rateId
      );
      const hourlyRate = payroll!.baseSalary / 173;
      calculatedPay =
        hourlyRate *
        (data.durationHours || existing.request.durationHours) *
        rate.multiplier;
    }

    const [updated] = await db
      .update(overtimeRequests)
      .set({
        ...data,
        calculatedPay,
        updatedAt: new Date(),
      })
      .where(eq(overtimeRequests.id, id))
      .returning();

    return updated;
  }

  async approveRequest(id: string, approvedBy: string) {
    const existing = await this.getRequestById(id);

    await payrollPeriodLockService.assertAttendanceDateEditable(existing.request.overtimeDate, 'Approval lembur oleh reviewer');

    if (existing.request.status !== 'PENDING') {
      throw new BusinessError('Request sudah diproses');
    }

    const [updated] = await db
      .update(overtimeRequests)
      .set({
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(overtimeRequests.id, id))
      .returning();

    return updated;
  }

  async rejectRequest(id: string, approvedBy: string, rejectedReason: string) {
    const existing = await this.getRequestById(id);

    await payrollPeriodLockService.assertAttendanceDateEditable(existing.request.overtimeDate, rejectedReason);

    if (existing.request.status !== 'PENDING') {
      throw new BusinessError('Request sudah diproses');
    }

    const [updated] = await db
      .update(overtimeRequests)
      .set({
        status: 'REJECTED',
        approvedBy,
        rejectedReason,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(overtimeRequests.id, id))
      .returning();

    return updated;
  }

  async cancelRequest(id: string, employeeId: string) {
    const existing = await this.getRequestById(id);

    if (existing.request.employeeId !== employeeId) {
      throw new BusinessError('Tidak memiliki akses');
    }

    if (existing.request.status !== 'PENDING') {
      throw new BusinessError('Hanya request PENDING yang bisa dibatalkan');
    }

    const [updated] = await db
      .update(overtimeRequests)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(overtimeRequests.id, id))
      .returning();

    return updated;
  }

  async deleteRequest(id: string) {
    const existing = await this.getRequestById(id);

    if (existing.request.status === 'APPROVED' && existing.request.isPaid) {
      throw new BusinessError('Request yang sudah dibayar tidak bisa dihapus');
    }

    await db.delete(overtimeRequests).where(eq(overtimeRequests.id, id));

    return { success: true };
  }
}

export const overtimeService = new OvertimeService();
