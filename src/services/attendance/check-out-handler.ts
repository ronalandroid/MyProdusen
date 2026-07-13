import { db, attendances, workLocations, shifts, attendanceDailySummaries, employees, users } from '@/lib/db';
import { calculateEarlyLeaveMinutes, calculateMinutesDifference } from '@/utils/date';
import { eq, and, gte, lt, isNull, desc } from 'drizzle-orm';
import {
  LATE_CHECKOUT_REASON_REQUIRED,
  OPEN_ATTENDANCE_LOOKBACK_HOURS,
  isLateCheckOut,
  lateMinutes,
  resolveShiftEndFor,
} from '@/lib/attendance/late-checkout-policy';
import { attendanceExceptionService } from '@/services/attendance/attendance-exception.service';
import { notifyUser } from '@/lib/notifications/dispatch';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { saveAttendanceSelfie } from '@/lib/upload';
import { payrollPeriodLockService } from '@/features/payroll/payroll-period-lock.service';
import { validateGpsAttendance } from '@/lib/attendance/gps-validation';
import { resolveOutsideGeofencePolicy, OUTSIDE_GEOFENCE_REASON_REQUIRED } from '@/lib/attendance/manual-reason-policy';
import { DEFAULT_ATTENDANCE_POLICY } from '@/services/attendance/attendance-payroll-impact.service';
import { BusinessError } from '@/lib/core/business-error';
import { invalidateAttendanceCaches } from '@/services/attendance/attendance-helpers';

export async function checkOut(data: {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  selfie: File;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  capturedAt?: Date | string | number | null;
  note?: string;
  /** Required to clock out from OUTSIDE the geo-fence; queues admin review. */
  manualReason?: string;
  /** Required when clocking out past the grace window; queues admin review. */
  lateReason?: string;
}) {
  // Latest OPEN attendance within the lookback window — covers today, an
  // overnight shift started yesterday, and a forgotten clock-out from
  // yesterday (owner policy #4: lupa clock-out tetap bisa clock-out).
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const lookbackStart = new Date(now.getTime() - OPEN_ATTENDANCE_LOOKBACK_HOURS * 60 * 60 * 1000);

  const [attendance] = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.employeeId, data.employeeId),
        gte(attendances.checkInTime, lookbackStart),
        isNull(attendances.checkOutTime)
      )
    )
    .orderBy(desc(attendances.checkInTime))
    .limit(1);

  if (!attendance) {
    const [todayAttendance] = await db
      .select({ checkOutTime: attendances.checkOutTime })
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, data.employeeId),
          gte(attendances.checkInTime, today),
          lt(attendances.checkInTime, tomorrow)
        )
      )
      .limit(1);

    if (todayAttendance?.checkOutTime) {
      throw new BusinessError('Anda sudah melakukan check-out hari ini');
    }
    throw new BusinessError('Anda belum melakukan check-in hari ini');
  }

  // Guard against mutating a locked payroll period (uses the work-date the
  // attendance belongs to, matching overtime/exception semantics).
  await payrollPeriodLockService.assertAttendanceDateEditable(attendance.checkInTime);

  // Get work location
  const [workLocation] = await db
    .select()
    .from(workLocations)
    .where(eq(workLocations.id, attendance.workLocationId))
    .limit(1);

  if (!workLocation) {
    throw new BusinessError('Lokasi kerja tidak ditemukan');
  }

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
      radius: Math.max(workLocation.radius, DEFAULT_ATTENDANCE_POLICY.geofenceRadiusMeters),
      isActive: workLocation.isActive,
    },
    { rejectOutsideGeofence },
  );

  if (validation.decision === 'reject') {
    if (validation.geoStatus === 'OUTSIDE_RADIUS') {
      throw new BusinessError(OUTSIDE_GEOFENCE_REASON_REQUIRED);
    }
    throw new BusinessError(validation.reason);
  }

  const distance = validation.distanceMeters ?? 0;
  const checkOutGeoStatus = validation.geoStatus;

  const checkOutTime = new Date();

  const [shift] = attendance.shiftId
    ? await db.select().from(shifts).where(eq(shifts.id, attendance.shiftId)).limit(1)
    : [undefined];

  // Late clock-out: past the grace window after shift end (or, without a
  // shift, an attendance left open since a previous day). Allowed only with a
  // written reason; then queued for Superadmin review.
  const shiftEnd = shift ? resolveShiftEndFor(attendance.checkInTime, shift.startTime, shift.endTime) : null;
  const isFromPreviousDay = attendance.checkInTime < today;
  // A shift end only counts when it falls AFTER the check-in — someone who
  // checked in past their shift's end (or has no shift) is judged by whether
  // the attendance was left open since a previous day.
  const shiftEndApplies = shiftEnd !== null && shiftEnd.getTime() > attendance.checkInTime.getTime();
  const isLate = shiftEndApplies ? isLateCheckOut(checkOutTime, shiftEnd!) : isFromPreviousDay;
  const trimmedLateReason = data.lateReason?.trim();

  if (isLate && !trimmedLateReason) {
    throw new BusinessError(LATE_CHECKOUT_REASON_REQUIRED);
  }

  // Calculate early leave minutes
  let earlyLeaveMinutes = 0;
  if (shift) {
    earlyLeaveMinutes = calculateEarlyLeaveMinutes(checkOutTime, shift.endTime);
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
  const checkOutNote = data.note?.trim();
  const lateCheckOutMinutes = isLate && shiftEndApplies ? lateMinutes(checkOutTime, shiftEnd!) : 0;
  const lateNote = isLate && trimmedLateReason
    ? `Clock-out terlambat${lateCheckOutMinutes ? ` (+${lateCheckOutMinutes} menit)` : ''}: ${trimmedLateReason}`
    : undefined;
  const mergedNote = [attendance.adjustmentReason, lateNote, checkOutNote ? `Clock-out: ${checkOutNote}` : undefined]
    .filter(Boolean)
    .join('\n') || attendance.adjustmentReason;

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
        adjustmentReason: mergedNote,
        earlyLeaveMinutes,
        totalWorkMinutes,
        updatedAt: new Date(),
      })
      .where(and(eq(attendances.id, attendance.id), isNull(attendances.checkOutTime)))
      .returning();

    if (!row) {
      // Lost the race — another request already checked out.
      throw new BusinessError('Anda sudah melakukan check-out hari ini');
    }

    await tx.update(attendanceDailySummaries).set({
      clockOutAt: checkOutTime,
      updatedAt: new Date(),
    }).where(eq(attendanceDailySummaries.attendanceId, attendance.id));

    return row;
  });

  if (isLate && trimmedLateReason) {
    await queueLateCheckOutReview({
      attendanceId: attendance.id,
      employeeId: data.employeeId,
      reason: lateNote || trimmedLateReason,
    });
  }

  // Invalidate attendance caches
  await invalidateAttendanceCaches(data.employeeId);

  return {
    ...updated,
    checkOutGeoStatus,
    geoValidation: validation,
    isPendingGeoReview: validation.decision === 'pending',
    isLateCheckOut: isLate,
    lateCheckOutMinutes,
  };
}

/**
 * Queue a LATE_CORRECTION exception and wake the Superadmin console. Failures
 * here must never undo an already-recorded clock-out, so they are logged via
 * the caller's Sentry wiring rather than thrown.
 */
async function queueLateCheckOutReview(data: { attendanceId: string; employeeId: string; reason: string }) {
  const [employee] = await db
    .select({ userId: employees.userId, fullName: employees.fullName })
    .from(employees)
    .where(eq(employees.id, data.employeeId))
    .limit(1);

  await attendanceExceptionService.createException({
    attendanceId: data.attendanceId,
    employeeId: data.employeeId,
    type: 'LATE_CORRECTION',
    reason: data.reason,
    requestedBy: employee?.userId || data.employeeId,
  });

  const superadmins = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, 'SUPERADMIN'), eq(users.isActive, true)));

  await Promise.all(
    superadmins.map((admin) =>
      notifyUser({
        userId: admin.id,
        title: 'Clock-out terlambat menunggu review',
        message: `${employee?.fullName || 'Karyawan'} — ${data.reason}`,
        type: 'ATTENDANCE_EXCEPTION',
      }).catch(() => undefined),
    ),
  );

  await publishRealtimeEvent(createRealtimeEvent({
    type: 'dashboard.updated',
    scope: 'role',
    target: 'SUPERADMIN',
    payload: { source: 'attendance.late-checkout', attendanceId: data.attendanceId },
  })).catch(() => undefined);
}
