import { db, leaveRequests, employees } from '@/lib/db';
import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm';
import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';
import { leaveBalanceService } from './leave-balance.service';
import { notifyUser } from '@/lib/notifications/dispatch';

export type LeaveType = 'LEAVE' | 'SICK' | 'PERMISSION';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class LeaveService {
  async createLeaveRequest(data: {
    employeeId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
  }) {
    // Validate dates
    if (data.startDate > data.endDate) {
      throw new Error('Tanggal mulai tidak boleh lebih besar dari tanggal selesai');
    }

    // Check if employee exists
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, data.employeeId))
      .limit(1);

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    if (data.type === 'LEAVE') {
      const requestedDays = Math.ceil(Math.abs(data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const balance = await leaveBalanceService.getBalance(data.employeeId, data.startDate.getFullYear());

      if (balance.available < requestedDays) {
        const error = new Error(`Saldo cuti tidak cukup. Tersedia ${balance.available} hari, diajukan ${requestedDays} hari.`);
        (error as any).code = 'LEAVE_BALANCE_INSUFFICIENT';
        throw error;
      }
    }

    const leaveId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [leave] = await db
      .insert(leaveRequests)
      .values({
        id: leaveId,
        employeeId: data.employeeId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'PENDING',
      })
      .returning();

    if (data.type === 'LEAVE') {
      await leaveBalanceService.holdForRequest({
        employeeId: data.employeeId,
        leaveRequestId: leave.id,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: data.employeeId,
      });
    }

    // Invalidate leave caches
    await this.invalidateLeaveCaches(data.employeeId);

    return leave;
  }

  async getLeaveRequests(filters?: {
    employeeId?: string;
    supervisorId?: string;
    status?: LeaveStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const cacheKey = CacheKeys.leave.list(filters?.employeeId, filters?.status);

    // Only cache simple queries
    if ((filters?.employeeId || filters?.status) && !filters?.supervisorId && !filters?.startDate && !filters?.endDate) {
      return await cacheManager.wrap(
        cacheKey,
        async () => {
          return await this.fetchLeaveRequests(filters);
        },
        {
          ttl: CacheStrategy.leaveList,
          tags: [CacheTags.leave],
        }
      );
    }

    return await this.fetchLeaveRequests(filters);
  }

  private async fetchLeaveRequests(filters?: {
    employeeId?: string;
    supervisorId?: string;
    status?: LeaveStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const conditions = [];

    if (filters?.employeeId) {
      conditions.push(eq(leaveRequests.employeeId, filters.employeeId));
    } else if (filters?.supervisorId) {
      const teamEmployees = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.supervisorId, filters.supervisorId));

      if (teamEmployees.length === 0) {
        return [];
      }

      conditions.push(inArray(leaveRequests.employeeId, teamEmployees.map(employee => employee.id)));
    }

    if (filters?.status) {
      conditions.push(eq(leaveRequests.status, filters.status));
    }

    if (filters?.startDate) {
      conditions.push(gte(leaveRequests.startDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(leaveRequests.endDate, filters.endDate));
    }

    let query = db
      .select()
      .from(leaveRequests)
      .orderBy(desc(leaveRequests.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getLeaveRequestById(id: string) {
    const cacheKey = CacheKeys.leave.detail(id);

    return await cacheManager.wrap(
      cacheKey,
      async () => {
        const [leave] = await db
          .select()
          .from(leaveRequests)
          .where(eq(leaveRequests.id, id))
          .limit(1);

        if (!leave) {
          throw new Error('Pengajuan izin tidak ditemukan');
        }

        // Get employee data
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, leave.employeeId))
          .limit(1);

        return {
          ...leave,
          employee: employee || null,
        };
      },
      {
        ttl: CacheStrategy.leaveDetail,
        tags: [CacheTags.leave],
      }
    );
  }

  async approveLeaveRequest(id: string, approvedBy: string) {
    const [leave] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!leave) {
      throw new Error('Pengajuan izin tidak ditemukan');
    }

    if (leave.status !== 'PENDING') {
      throw new Error('Pengajuan izin sudah diproses');
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    if (leave.type === 'LEAVE') {
      await leaveBalanceService.approveRequest(id, approvedBy);
    }

    // Invalidate leave caches
    await this.invalidateLeaveCaches(leave.employeeId, id);

    await notifyUser({
      employeeId: leave.employeeId,
      title: 'Pengajuan izin disetujui',
      message: `Pengajuan ${leave.type.toLowerCase()} ${leave.startDate.toISOString().split('T')[0]} – ${leave.endDate.toISOString().split('T')[0]} telah disetujui.`,
      type: 'LEAVE_APPROVED',
    });

    return updated;
  }

  async rejectLeaveRequest(id: string, rejectedBy: string, rejectionReason: string) {
    const [leave] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!leave) {
      throw new Error('Pengajuan izin tidak ditemukan');
    }

    if (leave.status !== 'PENDING') {
      throw new Error('Pengajuan izin sudah diproses');
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    if (leave.type === 'LEAVE') {
      await leaveBalanceService.releaseRejectedRequest(id, rejectedBy);
    }

    // Invalidate leave caches
    await this.invalidateLeaveCaches(leave.employeeId, id);

    await notifyUser({
      employeeId: leave.employeeId,
      title: 'Pengajuan izin ditolak',
      message: rejectionReason || 'Pengajuan izin Anda ditolak. Silakan hubungi HR untuk detail.',
      type: 'LEAVE_REJECTED',
    });

    return updated;
  }

  async deleteLeaveRequest(id: string) {
    const [leave] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!leave) {
      throw new Error('Pengajuan izin tidak ditemukan');
    }

    if (leave.status !== 'PENDING') {
      throw new Error('Hanya pengajuan dengan status PENDING yang dapat dihapus');
    }

    await db
      .delete(leaveRequests)
      .where(eq(leaveRequests.id, id));

    // Invalidate leave caches
    await this.invalidateLeaveCaches(leave.employeeId, id);

    return { message: 'Pengajuan izin berhasil dihapus' };
  }

  private async invalidateLeaveCaches(employeeId?: string, leaveId?: string): Promise<void> {
    await cacheManager.invalidateByTag(CacheTags.leave);
    
    if (leaveId) {
      await cacheManager.delete(CacheKeys.leave.detail(leaveId));
    }
    
    await cacheManager.deletePattern('leave:list:*');
    await cacheManager.deletePattern('leave:pending:*');
  }
}

export const leaveService = new LeaveService();
