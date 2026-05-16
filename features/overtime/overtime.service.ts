import { db, overtimeRequests } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type OvertimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export class OvertimeService {
  async createRequest(data: {
    employeeId: string;
    overtimeDate: Date;
    startTime: string;
    endTime: string;
    durationHours: number;
    reason: string;
    rateId?: string;
  }) {
    const [request] = await db.insert(overtimeRequests).values({
      id: uuidv4(),
      employeeId: data.employeeId,
      overtimeDate: data.overtimeDate,
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      rateId: data.rateId || 'default',
      reason: data.reason,
      status: 'PENDING',
    }).returning();

    return request;
  }

  async getRequests(filters?: {
    employeeId?: string;
    status?: OvertimeStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    let query = db.select().from(overtimeRequests);

    if (filters?.employeeId) {
      query = query.where(eq(overtimeRequests.employeeId, filters.employeeId)) as any;
    }

    if (filters?.status) {
      query = query.where(eq(overtimeRequests.status, filters.status)) as any;
    }

    const results = await query.orderBy(desc(overtimeRequests.createdAt));
    return results;
  }

  async getRequestById(id: string) {
    const [request] = await db
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.id, id))
      .limit(1);

    if (!request) {
      throw new Error('Overtime request not found');
    }

    return request;
  }

  async approveRequest(id: string, approvedBy: string) {
    const request = await this.getRequestById(id);

    if (request.status !== 'PENDING') {
      throw new Error('Only pending requests can be approved');
    }

    const [approved] = await db
      .update(overtimeRequests)
      .set({
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(overtimeRequests.id, id))
      .returning();

    return approved;
  }

  async rejectRequest(id: string, rejectedBy: string, rejectionReason: string) {
    const request = await this.getRequestById(id);

    if (request.status !== 'PENDING') {
      throw new Error('Only pending requests can be rejected');
    }

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new Error('Rejection reason is required (minimum 5 characters)');
    }

    const [rejected] = await db
      .update(overtimeRequests)
      .set({
        status: 'REJECTED',
        rejectedReason: rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(overtimeRequests.id, id))
      .returning();

    return rejected;
  }

  async cancelRequest(id: string, employeeId: string) {
    const request = await this.getRequestById(id);

    if (request.employeeId !== employeeId) {
      throw new Error('You can only cancel your own requests');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Only pending requests can be cancelled');
    }

    const [cancelled] = await db
      .update(overtimeRequests)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(overtimeRequests.id, id))
      .returning();

    return cancelled;
  }

  async getEmployeeOvertimeStats(employeeId: string, year: number, month?: number) {
    const requests = await this.getRequests({
      employeeId,
      status: 'APPROVED',
    });

    const filtered = requests.filter(r => {
      const date = new Date(r.overtimeDate);
      if (date.getFullYear() !== year) return false;
      if (month !== undefined && date.getMonth() + 1 !== month) return false;
      return true;
    });

    const totalHours = filtered.reduce((sum, r) => sum + r.durationHours, 0);

    return {
      totalRequests: filtered.length,
      totalHours,
      requests: filtered,
    };
  }
}

export const overtimeService = new OvertimeService();
