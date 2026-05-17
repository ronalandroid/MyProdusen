import { db, attendances, employees, workLocations, shifts } from '@/lib/db';
import { calculateDistance, isWithinGeofence, isGpsAccuracyAcceptable } from '@/lib/geofencing';
import { calculateLateMinutes, calculateEarlyLeaveMinutes, calculateMinutesDifference } from '@/utils/date';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';
import { saveAttendanceSelfie } from '@/lib/upload';
import { validateGpsAttendance } from '@/lib/attendance/gps-validation';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK' | 'PERMISSION';

export class AttendanceService {
  async checkIn(data: {
    employeeId: string;
    workLocationId: string;
    shiftId?: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    selfie: File;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    capturedAt?: Date | string | number | null;
  }) {
    // Get employee data
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, data.employeeId))
      .limit(1);

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    if (employee.status !== 'ACTIVE') {
      throw new Error('Karyawan tidak aktif');
    }

    if (!employee.defaultLocationId) {
      throw new Error('Lokasi kerja default belum ditetapkan untuk karyawan');
    }

    if (employee.defaultLocationId !== data.workLocationId) {
      throw new Error('Lokasi kerja tidak sesuai dengan penugasan karyawan');
    }

    if (!employee.defaultShiftId) {
      throw new Error('Shift default belum ditetapkan untuk karyawan');
    }

    if (data.shiftId && data.shiftId !== employee.defaultShiftId) {
      throw new Error('Shift tidak sesuai dengan penugasan karyawan');
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [existingCheckIn] = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, data.employeeId),
          gte(attendances.checkInTime, today),
          lt(attendances.checkInTime, tomorrow)
        )
      )
      .limit(1);

    if (existingCheckIn) {
      throw new Error('Anda sudah melakukan check-in hari ini');
    }

    // Get work location
    const [workLocation] = await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.id, data.workLocationId))
      .limit(1);

    if (!workLocation) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    if (!workLocation.isActive) {
      throw new Error('Lokasi kerja tidak aktif');
    }

    // Hardened GPS + geo-fence validation. Server is the only source of truth.
    const validation = validateGpsAttendance(
      {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        capturedAt: data.capturedAt,
      },
      {
        id: workLocation.id,
        latitude: workLocation.latitude,
        longitude: workLocation.longitude,
        radius: workLocation.radius,
        isActive: workLocation.isActive,
      },
    );

    if (validation.decision === 'reject') {
      throw new Error(validation.reason);
    }

    const distance = validation.distanceMeters ?? 0;
    const checkInGeoStatus = validation.geoStatus;

    // Get shift
    const shiftId = employee.defaultShiftId;
    let shift = null;
    if (shiftId) {
      const [shiftData] = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, shiftId))
        .limit(1);
      shift = shiftData || null;
    }

    if (!shift) {
      throw new Error('Shift kerja tidak ditemukan');
    }

    if (!shift.isActive) {
      throw new Error('Shift kerja tidak aktif');
    }

    // Calculate late minutes
    const checkInTime = new Date();
    let lateMinutes = 0;
    let status: AttendanceStatus = 'PRESENT';

    if (shift) {
      lateMinutes = calculateLateMinutes(checkInTime, shift.startTime);
      if (lateMinutes > 0) {
        status = 'LATE';
      }
    }

    // Generate attendance ID
    const attendanceId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const selfieUpload = await saveAttendanceSelfie({
      file: data.selfie,
      employeeId: data.employeeId,
      attendanceId,
      type: 'check-in',
    });

    // Create attendance record
    const [attendance] = await db
      .insert(attendances)
      .values({
        id: attendanceId,
        employeeId: data.employeeId,
        workLocationId: data.workLocationId,
        shiftId: shiftId || null,
        checkInTime,
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        checkInAccuracy: data.accuracy,
        checkInDistance: distance,
        checkInGeoStatus,
        geoValidationMetadata: { checkIn: validation.metadata },
        checkInSelfie: selfieUpload.path,
        checkInSelfieUrl: selfieUpload.path,
        checkInSelfiePath: selfieUpload.storageKey,
        checkInSelfieUploadedAt: new Date(),
        checkInSelfieSizeBytes: selfieUpload.size,
        checkInSelfieMimeType: selfieUpload.mimeType,
        checkInDeviceInfo: data.deviceInfo,
        checkInIp: data.ipAddress,
        checkInUserAgent: data.userAgent,
        status,
        lateMinutes,
      })
      .returning();

    // Invalidate attendance caches
    await this.invalidateAttendanceCaches(data.employeeId);

    return {
      ...attendance,
      checkInGeoStatus,
      geoValidation: validation,
      isPendingGeoReview: validation.decision === 'pending',
    };
  }

  async checkOut(data: {
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    selfie: File;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    capturedAt?: Date | string | number | null;
  }) {
    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [attendance] = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, data.employeeId),
          gte(attendances.checkInTime, today),
          lt(attendances.checkInTime, tomorrow)
        )
      )
      .limit(1);

    if (!attendance) {
      throw new Error('Anda belum melakukan check-in hari ini');
    }

    if (attendance.checkOutTime) {
      throw new Error('Anda sudah melakukan check-out hari ini');
    }

    // Get work location
    const [workLocation] = await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.id, attendance.workLocationId))
      .limit(1);

    if (!workLocation) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    // Hardened GPS + geo-fence validation. Server is the only source of truth.
    const validation = validateGpsAttendance(
      {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        capturedAt: data.capturedAt,
      },
      {
        id: workLocation.id,
        latitude: workLocation.latitude,
        longitude: workLocation.longitude,
        radius: workLocation.radius,
        isActive: workLocation.isActive,
      },
    );

    if (validation.decision === 'reject') {
      throw new Error(validation.reason);
    }

    const distance = validation.distanceMeters ?? 0;
    const checkOutGeoStatus = validation.geoStatus;

    const checkOutTime = new Date();

    // Calculate early leave minutes
    let earlyLeaveMinutes = 0;
    if (attendance.shiftId) {
      const [shift] = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, attendance.shiftId))
        .limit(1);

      if (shift) {
        earlyLeaveMinutes = calculateEarlyLeaveMinutes(checkOutTime, shift.endTime);
      }
    }

    // Calculate total work minutes
    const totalWorkMinutes = calculateMinutesDifference(
      attendance.checkInTime,
      checkOutTime
    );
    const selfieUpload = await saveAttendanceSelfie({
      file: data.selfie,
      employeeId: data.employeeId,
      attendanceId: attendance.id,
      type: 'check-out',
    });

    // Update attendance record
    const [updated] = await db
      .update(attendances)
      .set({
        checkOutTime,
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude,
        checkOutAccuracy: data.accuracy,
        checkOutDistance: distance,
        checkOutGeoStatus,
        geoValidationMetadata: {
          ...((attendance as any).geoValidationMetadata ?? {}),
          checkOut: validation.metadata,
        },
        checkOutSelfie: selfieUpload.path,
        checkOutSelfieUrl: selfieUpload.path,
        checkOutSelfiePath: selfieUpload.storageKey,
        checkOutSelfieUploadedAt: new Date(),
        checkOutSelfieSizeBytes: selfieUpload.size,
        checkOutSelfieMimeType: selfieUpload.mimeType,
        checkOutDeviceInfo: data.deviceInfo,
        checkOutIp: data.ipAddress,
        checkOutUserAgent: data.userAgent,
        earlyLeaveMinutes,
        totalWorkMinutes,
        updatedAt: new Date(),
      })
      .where(eq(attendances.id, attendance.id))
      .returning();

    // Invalidate attendance caches
    await this.invalidateAttendanceCaches(data.employeeId);

    return {
      ...updated,
      checkOutGeoStatus,
      geoValidation: validation,
      isPendingGeoReview: validation.decision === 'pending',
    };
  }

  async getTodayAttendance(employeeId: string) {
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

  async adjustAttendance(id: string, data: {
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
      throw new Error('Alasan penyesuaian wajib diisi minimal 5 karakter');
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
      throw new Error('Data absensi tidak ditemukan');
    }

    // Invalidate attendance caches
    await this.invalidateAttendanceCaches(attendance.employeeId);

    return attendance;
  }

  async getAttendances(filters?: {
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
          return await this.fetchAttendances(filters);
        },
        {
          ttl: CacheStrategy.attendanceList,
          tags: [CacheTags.attendance],
        }
      );
    }

    return await this.fetchAttendances(filters);
  }

  private async fetchAttendances(filters?: {
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

  private async invalidateAttendanceCaches(employeeId?: string): Promise<void> {
    await cacheManager.invalidateByTag(CacheTags.attendance);
    
    if (employeeId) {
      await cacheManager.delete(CacheKeys.attendance.today(employeeId));
    }
    
    await cacheManager.delete(CacheKeys.attendance.today());
    await cacheManager.deletePattern('attendance:list:*');
    await cacheManager.deletePattern('attendance:stats:*');
    await cacheManager.invalidateByTag(CacheTags.dashboard);
  }
}

export const attendanceService = new AttendanceService();
