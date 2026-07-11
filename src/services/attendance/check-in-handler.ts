import { db, attendances, employees, workLocations, shifts, attendanceDailySummaries, payrollCalculationHistory, workCalendarDays, notifications } from '@/lib/db';
import { eq, and, gte, lt } from 'drizzle-orm';
import { saveAttendanceSelfie } from '@/lib/upload';
import { payrollPeriodLockService } from '@/features/payroll/payroll-period-lock.service';
import { validateGpsAttendance } from '@/lib/attendance/gps-validation';
import { resolveOutsideGeofencePolicy, hasValidManualReason, OUTSIDE_GEOFENCE_REASON_REQUIRED } from '@/lib/attendance/manual-reason-policy';
import { evaluateLiveness } from '@/lib/attendance/liveness';
import { nanoid } from 'nanoid';
import { calculateAttendancePayrollImpact, DEFAULT_ATTENDANCE_POLICY } from '@/services/attendance/attendance-payroll-impact.service';
import { BusinessError } from '@/lib/core/business-error';
import {
  AttendanceStatus,
  buildShiftStartAt,
  formatWorkDate,
  getActiveAttendancePolicy,
  getActivePayrollRule,
  invalidateAttendanceCaches,
} from '@/services/attendance/attendance-helpers';

export async function checkIn(data: {
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
  note?: string;
  /** Required to clock in from OUTSIDE the geo-fence; queues admin review. */
  manualReason?: string;
  livenessScore?: number;
  livenessPassed?: boolean;
  faceDetected?: boolean;
  livenessUnsupported?: boolean;
}) {
  // Real selfie verdict (replaces the previous hardcoded selfieVerified:true).
  // faceDetected falls back to livenessPassed so current clients (which don't
  // yet send it) keep working until the MediaPipe client ships.
  const selfieVerdict = evaluateLiveness({
    score: data.livenessScore ?? 0,
    passed: data.livenessPassed ?? false,
    faceDetected: data.faceDetected ?? data.livenessPassed ?? false,
    unsupported: data.livenessUnsupported ?? false,
  });

  // Get employee data
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, data.employeeId))
    .limit(1);

  if (!employee) {
    throw new BusinessError('Karyawan tidak ditemukan');
  }

  if (employee.status !== 'ACTIVE') {
    throw new BusinessError('Karyawan tidak aktif');
  }

  if (!employee.defaultLocationId) {
    throw new BusinessError('Lokasi kerja default belum ditetapkan untuk karyawan');
  }

  if (employee.defaultLocationId !== data.workLocationId) {
    throw new BusinessError('Lokasi kerja tidak sesuai dengan penugasan karyawan');
  }

  if (!employee.defaultShiftId) {
    throw new BusinessError('Shift default belum ditetapkan untuk karyawan');
  }

  if (data.shiftId && data.shiftId !== employee.defaultShiftId) {
    throw new BusinessError('Shift tidak sesuai dengan penugasan karyawan');
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
    throw new BusinessError('Anda sudah melakukan check-in hari ini');
  }

  // Block clock-in when the payroll period covering today is already locked —
  // attendance must not mutate a finalised payroll window.
  await payrollPeriodLockService.assertAttendanceDateEditable(new Date());

  // Get work location
  const [workLocation] = await db
    .select()
    .from(workLocations)
    .where(eq(workLocations.id, data.workLocationId))
    .limit(1);

  if (!workLocation) {
    throw new BusinessError('Lokasi kerja tidak ditemukan');
  }

  if (!workLocation.isActive) {
    throw new BusinessError('Lokasi kerja tidak aktif');
  }

  const attendancePolicy = await getActiveAttendancePolicy(employee);
  const effectiveRadius = attendancePolicy?.geofenceRadiusMeters ?? Math.max(workLocation.radius, DEFAULT_ATTENDANCE_POLICY.geofenceRadiusMeters);

  // Inside radius auto-approves; outside radius is allowed ONLY with a written
  // reason (then queued for admin review), otherwise blocked with a clear ask.
  const { rejectOutsideGeofence } = resolveOutsideGeofencePolicy(data.manualReason);

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
    { rejectOutsideGeofence },
  );

  if (validation.decision === 'reject') {
    // Outside radius with no reason → tell the employee to add one.
    if (validation.geoStatus === 'OUTSIDE_RADIUS') {
      throw new BusinessError(OUTSIDE_GEOFENCE_REASON_REQUIRED);
    }
    throw new BusinessError(validation.reason);
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
    throw new BusinessError('Shift kerja tidak ditemukan');
  }

  if (!shift.isActive) {
    throw new BusinessError('Shift kerja tidak aktif');
  }

  // Calculate late minutes and payroll impact from configurable policy.
  const checkInTime = new Date();
  const shiftStartAt = buildShiftStartAt(checkInTime, shift.startTime);
  const payrollRule = await getActivePayrollRule(employee);
  const workDate = formatWorkDate(checkInTime);
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
          adjustmentReason: data.note?.trim() || null,
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
        selfieVerified: selfieVerdict.verified,
        selfieLivenessScore: data.livenessScore ?? null,
        selfieNeedsReview: selfieVerdict.needsReview,
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
          selfieVerified: selfieVerdict.verified,
          selfieLivenessScore: data.livenessScore ?? null,
          selfieNeedsReview: selfieVerdict.needsReview,
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
      throw new BusinessError('Anda sudah melakukan check-in hari ini');
    }
    throw txError;
  }

  // Invalidate attendance caches
  await invalidateAttendanceCaches(data.employeeId);

  return {
    ...attendance,
    checkInGeoStatus,
    geoValidation: validation,
    isPendingGeoReview: validation.decision === 'pending',
  };
}
