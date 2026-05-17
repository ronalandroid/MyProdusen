import { db, attendanceExceptions, attendances, employees, notifications } from '@/lib/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { AttendanceExceptionType } from '@/lib/attendance/exception-policy';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';

export type AttendanceExceptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export class AttendanceExceptionService {
  async createException(data: {
    attendanceId?: string | null;
    employeeId: string;
    type: AttendanceExceptionType;
    reason: string;
    requestedBy: string;
  }) {
    const [created] = await db
      .insert(attendanceExceptions)
      .values({
        id: uuidv4(),
        attendanceId: data.attendanceId || null,
        employeeId: data.employeeId,
        type: data.type,
        reason: data.reason,
        requestedBy: data.requestedBy,
      })
      .returning();

    return created;
  }

  async listExceptions(filters: {
    status?: AttendanceExceptionStatus;
    viewerRole: string;
    viewerUserId: string;
    viewerEmployeeId?: string;
  }) {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(attendanceExceptions.status, filters.status));
    }

    if (filters.viewerRole === 'EMPLOYEE' && filters.viewerEmployeeId) {
      conditions.push(eq(attendanceExceptions.employeeId, filters.viewerEmployeeId));
    }

    if (filters.viewerRole === 'SUPERVISOR' && filters.viewerEmployeeId) {
      const team = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.supervisorId, filters.viewerEmployeeId));
      conditions.push(inArray(attendanceExceptions.employeeId, [filters.viewerEmployeeId, ...team.map((member) => member.id)]));
    }

    let query = db
      .select({ exception: attendanceExceptions, employee: employees })
      .from(attendanceExceptions)
      .leftJoin(employees, eq(attendanceExceptions.employeeId, employees.id))
      .orderBy(desc(attendanceExceptions.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query;
  }

  async reviewException(data: {
    id: string;
    reviewerUserId: string;
    status: 'APPROVED' | 'REJECTED';
    reviewNote: string;
  }) {
    if (data.status === 'REJECTED' && data.reviewNote.trim().length < 5) {
      throw new Error('Alasan penolakan minimal 5 karakter');
    }

    const [existing] = await db
      .select()
      .from(attendanceExceptions)
      .where(eq(attendanceExceptions.id, data.id))
      .limit(1);

    if (!existing) {
      throw new Error('Exception absensi tidak ditemukan');
    }

    if (existing.status !== 'PENDING') {
      throw new Error('Exception absensi sudah diproses');
    }

    const [updated] = await db
      .update(attendanceExceptions)
      .set({
        status: data.status,
        reviewedBy: data.reviewerUserId,
        reviewNote: data.reviewNote,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(attendanceExceptions.id, data.id))
      .returning();

    if (data.status === 'APPROVED' && existing.attendanceId) {
      await db
        .update(attendances)
        .set({
          isManualAdjustment: true,
          adjustmentReason: data.reviewNote || existing.reason,
          adjustedBy: data.reviewerUserId,
          checkInGeoStatus:
            existing.type === 'OUTSIDE_GEOFENCE' ? 'APPROVED_MANUAL' : undefined,
          updatedAt: new Date(),
        } as any)
        .where(eq(attendances.id, existing.attendanceId));
    }

    if (data.status === 'REJECTED' && existing.attendanceId && existing.type === 'OUTSIDE_GEOFENCE') {
      await db
        .update(attendances)
        .set({
          checkInGeoStatus: 'REJECTED',
          updatedAt: new Date(),
        } as any)
        .where(eq(attendances.id, existing.attendanceId));
    }

    const [employee] = await db
      .select({ userId: employees.userId })
      .from(employees)
      .where(eq(employees.id, existing.employeeId))
      .limit(1);

    if (employee?.userId) {
      const notificationId = uuidv4();
      const title = data.status === 'APPROVED' ? 'Exception absensi disetujui' : 'Exception absensi ditolak';

      await db.insert(notifications).values({
        id: notificationId,
        userId: employee.userId,
        title,
        message: data.reviewNote || existing.reason,
        type: 'ATTENDANCE_EXCEPTION',
      });

      await publishRealtimeEvent(createRealtimeEvent({
        type: 'notification.created',
        scope: 'user',
        target: employee.userId,
        payload: { id: notificationId, title },
      }));
    }

    return updated;
  }
}

export const attendanceExceptionService = new AttendanceExceptionService();
