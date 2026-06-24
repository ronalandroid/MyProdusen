import { db, attendances, employees, attendanceDailySummaries } from '@/lib/db';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';
import { BusinessError } from '@/lib/core/business-error';
import {
  AttendanceStatus,
  SelfieReviewItem,
  SELFIE_REVIEW_MAX_ROWS,
  invalidateAttendanceCaches,
} from '@/services/attendance/attendance-helpers';

export async function getTodayAttendance(employeeId: string) {
  const cacheKey = CacheKeys.attendance.today(employeeId);

  return await cacheManager.wrap(
    cacheKey,
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [attendance] = await db
        .select()
        .from(attendances)
        .where(
          and(
            eq(attendances.employeeId, employeeId),
            gte(attendances.checkInTime, today),
            lt(attendances.checkInTime, tomorrow)
          )
        )
        .limit(1);

      return attendance || null;
    },
    {
      ttl: CacheStrategy.attendanceToday,
      tags: [CacheTags.attendance],
    }
  );
}

export async function adjustAttendance(id: string, data: {
  checkInTime?: Date;
  checkOutTime?: Date;
  status?: AttendanceStatus;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  totalWorkMinutes?: number;
  reason: string;
  adjustedBy: string;
}) {
  if (!data.reason || data.reason.trim().length < 5) {
    throw new BusinessError('Alasan penyesuaian wajib diisi minimal 5 karakter');
  }

  const [attendance] = await db
    .update(attendances)
    .set({
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      status: data.status,
      lateMinutes: data.lateMinutes,
      earlyLeaveMinutes: data.earlyLeaveMinutes,
      totalWorkMinutes: data.totalWorkMinutes,
      isManualAdjustment: true,
      adjustmentReason: data.reason,
      adjustedBy: data.adjustedBy,
      updatedAt: new Date(),
    })
    .where(eq(attendances.id, id))
    .returning();

  if (!attendance) {
    throw new BusinessError('Data absensi tidak ditemukan');
  }

  // Invalidate attendance caches
  await invalidateAttendanceCaches(attendance.employeeId);

  return attendance;
}

export async function getAttendances(filters?: {
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus;
}) {
  const dateStr = filters?.startDate?.toISOString().split('T')[0];
  const cacheKey = CacheKeys.attendance.list(dateStr, filters?.employeeId);

  // Only cache simple queries
  if (filters?.employeeId && filters?.startDate && !filters?.endDate && !filters?.status) {
    return await cacheManager.wrap(
      cacheKey,
      async () => {
        return await fetchAttendances(filters);
      },
      {
        ttl: CacheStrategy.attendanceList,
        tags: [CacheTags.attendance],
      }
    );
  }

  return await fetchAttendances(filters);
}

async function fetchAttendances(filters?: {
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus;
}) {
  const conditions = [];

  if (filters?.employeeId) {
    conditions.push(eq(attendances.employeeId, filters.employeeId));
  }

  if (filters?.startDate) {
    conditions.push(gte(attendances.checkInTime, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lt(attendances.checkInTime, filters.endDate));
  }

  if (filters?.status) {
    conditions.push(eq(attendances.status, filters.status));
  }

  let query = db
    .select()
    .from(attendances)
    .orderBy(desc(attendances.checkInTime));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query;
}

/**
 * Admin selfie-review list: joins the daily summary (liveness verdict) with
 * the attendance row (selfie + geo) and the employee (name). Used by the
 * admin review grid to surface low-confidence / flagged check-ins.
 */
export async function getSelfieReviewList(filters?: {
  startDate?: Date;
  endDate?: Date;
  needsReviewOnly?: boolean;
  employeeId?: string;
}): Promise<SelfieReviewItem[]> {
  const conditions = [];

  if (filters?.needsReviewOnly) {
    conditions.push(eq(attendanceDailySummaries.selfieNeedsReview, true));
  }
  if (filters?.employeeId) {
    conditions.push(eq(attendanceDailySummaries.employeeId, filters.employeeId));
  }
  if (filters?.startDate) {
    conditions.push(gte(attendances.checkInTime, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lt(attendances.checkInTime, filters.endDate));
  }

  return await db
    .select({
      attendanceId: attendances.id,
      employeeId: employees.id,
      employeeName: employees.fullName,
      checkInTime: attendances.checkInTime,
      selfieUrl: attendances.checkInSelfieUrl,
      geoStatus: attendances.checkInGeoStatus,
      distanceMeters: attendances.checkInDistance,
      livenessScore: attendanceDailySummaries.selfieLivenessScore,
      selfieVerified: attendanceDailySummaries.selfieVerified,
      needsReview: attendanceDailySummaries.selfieNeedsReview,
      workDate: attendanceDailySummaries.workDate,
    })
    .from(attendanceDailySummaries)
    .innerJoin(attendances, eq(attendanceDailySummaries.attendanceId, attendances.id))
    .innerJoin(employees, eq(attendanceDailySummaries.employeeId, employees.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(attendances.checkInTime))
    .limit(SELFIE_REVIEW_MAX_ROWS);
}
