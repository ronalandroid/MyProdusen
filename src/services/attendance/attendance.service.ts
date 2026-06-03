import { db, attendances, employees, workLocations, shifts, attendancePolicies, attendanceDailySummaries, payrollRules, payrollCalculationHistory, workCalendarDays, notifications } from '@/lib/db';
import { calculateDistance, isWithinGeofence, isGpsAccuracyAcceptable } from '@/lib/geofencing';
import { calculateLateMinutes, calculateEarlyLeaveMinutes, calculateMinutesDifference } from '@/utils/date';
import { eq, and, gte, lt, desc, or, isNull } from 'drizzle-orm';
import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';
import { saveAttendanceSelfie } from '@/lib/upload';
import { validateGpsAttendance } from '@/lib/attendance/gps-validation';
import { nanoid } from 'nanoid';
import { calculateAttendancePayrollImpact, DEFAULT_ATTENDANCE_POLICY } from '@/services/attendance/attendance-payroll-impact.service';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK' | 'PERMISSION';

export class AttendanceService {
  private buildShiftStartAt(workDate: Date, startTime: string): Date {
    const [hours = '8', minutes = '0'] = startTime.split(':');
    const shiftStartAt = new Date(workDate);
    shiftStartAt.setHours(Number(hours), Number(minutes), 0, 0);
    return shiftStartAt;
  }

  private formatWorkDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private async getActiveAttendancePolicy(employee: typeof employees.$inferSelect) {
    const [employeePolicy] = await db.select().from(attendancePolicies).where(and(
      eq(attendancePolicies.active, true),
      eq(attendancePolicies.appliesScopeType, 'EMPLOYEE'),
      eq(attendancePolicies.appliesScopeId, employee.id),
    )).limit(1);

    if (employeePolicy) return employeePolicy;

    const [companyPolicy] = await db.select().from(attendancePolicies).where(and(
      eq(attendancePolicies.active, true),
      eq(attendancePolicies.appliesScopeType, 'COMPANY'),
    )).limit(1);

    return companyPolicy ?? null;
  }

  private async getActivePayrollRule(employee: typeof employees.$inferSelect) {
    const now = new Date();
    const [rule] = await db.select().from(payrollRules).where(and(
      eq(payrollRules.active, true),
      or(eq(payrollRules.employeeId, employee.id), eq(payrollRules.divisionId, employee.division ?? ''), isNull(payrollRules.employeeId)),
      or(isNull(payrollRules.effectiveFrom), lt(payrollRules.effectiveFrom, now)),
      or(isNull(payrollRules.effectiveTo), gte(payrollRules.effectiveTo, now)),
    )).limit(1);

    return rule ?? null;
  }

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

    const attendancePolicy = await this.getActiveAttendancePolicy(employee);
    const effectiveRadius = attendancePolicy?.geofenceRadiusMeters ?? Math.max(workLocation.radius, DEFAULT_ATTENDANCE_POLICY.geofenceRadiusMeters);

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
        radius: effectiveRadius,
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

    // Calculate late minutes and payroll impact from configurable policy.
    const checkInTime = new Date();
    const shiftStartAt = this.buildShiftStartAt(checkInTime, shift.startTime);
    const payrollRule = await this.getActivePayrollRule(employee);
    const workDate = this.formatWorkDate(checkInTime);
    const [workCalendarDay] = await db
      .select()
      .from(workCalendarDays)
      .where(eq(workCalendarDays.date, workDate))
      .limit(1);
    const policyImpact = calculateAttendancePayrollImpact({
      employeeId: employee.id,
      shiftStartAt,
      clockInAt: checkInTime,
      attendancePolicy: attendancePolicy ? {
        graceMinutes: attendancePolicy.graceMinutes,
        lateTier1Min: attendancePolicy.lateTier1Min,
        lateTier1Max: attendancePolicy.lateTier1Max,
        lateTier1Deduction: attendancePolicy.lateTier1Deduction,
        lateTier2Min: attendancePolicy.lateTier2Min,
        lateTier2Max: attendancePolicy.lateTier2Max,
        lateTier2Deduction: attendancePolicy.lateTier2Deduction,
        halfDayAfterMinutes: attendancePolicy.halfDayAfterMinutes,
        halfDayPayFactor: attendancePolicy.halfDayPayFactor,
        geofenceRadiusMeters: attendancePolicy.geofenceRadiusMeters,
        payrollSyncEnabled: attendancePolicy.payrollSyncEnabled,
      } : DEFAULT_ATTENDANCE_POLICY,
      timezone: 'Asia/Jakarta',
      workCalendarDay: workCalendarDay ? {
        type: workCalendarDay.type,
        isPaidHoliday: workCalendarDay.isPaidHoliday,
        payMultiplier: workCalendarDay.payMultiplier,
      } : null,
      baseDailyPay: payrollRule ? payrollRule.baseSalary / (payrollRule.periodType === 'WEEKLY' ? 6 : 26) : null,
      payrollRule: payrollRule ? {
        holidayMultiplierEnabled: payrollRule.holidayMultiplierEnabled,
        realtimeCalculationEnabled: payrollRule.realtimeCalculationEnabled,
      } : null,
    });
    let lateMinutes = policyImpact.lateMinutes;
    let status: AttendanceStatus = 'PRESENT';
    if (lateMinutes > 0) {
      status = 'LATE';
    }

    // Generate attendance ID
    const attendanceId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const selfieUpload = await saveAttendanceSelfie({
      file: data.selfie,
      employeeId: data.employeeId,
      attendanceId,
      type: 'check-in',
    });

    // Persist attendance + downstream rows atomically. A single transaction
    // guarantees we never leave an attendance row without its daily-summary /
    // payroll-impact / notification side effects (no partial/corrupt state).
    let attendance;
    try {
      attendance = await db.transaction(async (tx) => {
        const [created] = await tx
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

        await tx.insert(attendanceDailySummaries).values({
          id: nanoid(),
          employeeId: data.employeeId,
          attendanceId,
          workDate,
          shiftStartAt,
          clockInAt: checkInTime,
          lateMinutes: policyImpact.lateMinutes,
          lateDeduction: policyImpact.lateDeduction,
          isHalfDay: policyImpact.isHalfDay,
          geofenceDistanceMeters: distance,
          gpsAccuracyMeters: data.accuracy,
          selfieRequired: true,
          selfieVerified: true,
          payrollImpactStatus: policyImpact.payrollImpactStatus,
        }).onConflictDoUpdate({
          target: [attendanceDailySummaries.employeeId, attendanceDailySummaries.workDate],
          set: {
            attendanceId,
            shiftStartAt,
            clockInAt: checkInTime,
            lateMinutes: policyImpact.lateMinutes,
            lateDeduction: policyImpact.lateDeduction,
            isHalfDay: policyImpact.isHalfDay,
            geofenceDistanceMeters: distance,
            gpsAccuracyMeters: data.accuracy,
            selfieVerified: true,
            payrollImpactStatus: policyImpact.payrollImpactStatus,
            updatedAt: new Date(),
          },
        });

        if (policyImpact.shouldCreatePayrollHistory) {
          await tx.insert(payrollCalculationHistory).values({
            id: nanoid(),
            employeeId: data.employeeId,
            workDate,
            sourceType: policyImpact.holidayMultiplier > 1 ? 'HOLIDAY' : 'ATTENDANCE',
            sourceId: attendanceId,
            description: policyImpact.holidayMultiplier > 1
              ? 'Multiplier payroll hari libur'
              : policyImpact.isHalfDay
                ? 'Dampak payroll setengah hari karena terlambat'
                : 'Potongan keterlambatan absensi',
            amount: policyImpact.estimatedPayrollAmount,
            calculationSnapshot: policyImpact.calculationSnapshot,
          });
        }

        if (policyImpact.lateDeduction > 0 || policyImpact.isHalfDay || policyImpact.holidayMultiplier > 1) {
          await tx.insert(notifications).values({
            id: nanoid(),
            userId: employee.userId,
            title: policyImpact.holidayMultiplier > 1
              ? 'Multiplier hari libur tercatat'
              : policyImpact.isHalfDay
                ? 'Absensi dihitung setengah hari'
                : 'Potongan keterlambatan tercatat',
            message: policyImpact.holidayMultiplier > 1
              ? `Kerja hari libur tercatat dengan multiplier ${policyImpact.holidayMultiplier}x sesuai kebijakan.`
              : policyImpact.isHalfDay
                ? 'Keterlambatan melewati batas kebijakan. Estimasi payroll akan mengikuti kebijakan perusahaan.'
                : `Keterlambatan ${policyImpact.lateMinutes} menit tercatat dengan estimasi potongan Rp${policyImpact.lateDeduction.toLocaleString('id-ID')}.`,
            type: policyImpact.holidayMultiplier > 1
              ? 'payroll.holiday_multiplier'
              : policyImpact.isHalfDay
                ? 'attendance.half_day'
                : 'attendance.late_deduction',
          });
        }

        return created;
      });
    } catch (txError) {
      // Race: a concurrent request already created today's attendance (unique
      // index on employee + work-date fires). Surface a clean, idempotent
      // business error instead of a raw 500.
      const message = txError instanceof Error ? txError.message : String(txError || '');
      if (/duplicate key|unique constraint|attendance_employee_date/i.test(message)) {
        throw new Error('Anda sudah melakukan check-in hari ini');
      }
      throw txError;
    }

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
        radius: Math.max(workLocation.radius, DEFAULT_ATTENDANCE_POLICY.geofenceRadiusMeters),
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

    // Update attendance + daily-summary atomically. The WHERE additionally
    // guards on checkOutTime IS NULL so a concurrent double-submit can only
    // win once (compare-and-set) — the loser updates 0 rows.
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
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
        .where(and(eq(attendances.id, attendance.id), isNull(attendances.checkOutTime)))
        .returning();

      if (!row) {
        // Lost the race — another request already checked out.
        throw new Error('Anda sudah melakukan check-out hari ini');
      }

      await tx.update(attendanceDailySummaries).set({
        clockOutAt: checkOutTime,
        updatedAt: new Date(),
      }).where(eq(attendanceDailySummaries.attendanceId, attendance.id));

      return row;
    });

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
