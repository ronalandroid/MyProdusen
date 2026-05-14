import { db, leaveRequests, employees } from '@/lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

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

    return leave;
  }

  async getLeaveRequests(filters?: {
    employeeId?: string;
    status?: LeaveStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const conditions = [];

    if (filters?.employeeId) {
      conditions.push(eq(leaveRequests.employeeId, filters.employeeId));
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

    return { message: 'Pengajuan izin berhasil dihapus' };
  }
}

export const leaveService = new LeaveService();
