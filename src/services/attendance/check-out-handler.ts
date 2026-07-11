import { db, attendances, workLocations, shifts, attendanceDailySummaries } from '@/lib/db';
import { calculateEarlyLeaveMinutes, calculateMinutesDifference } from '@/utils/date';
import { eq, and, gte, lt, isNull } from 'drizzle-orm';
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
    throw new BusinessError('Anda belum melakukan check-in hari ini');
  }

  if (attendance.checkOutTime) {
    throw new BusinessError('Anda sudah melakukan check-out hari ini');
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
  const checkOutNote = data.note?.trim();
  const mergedNote = checkOutNote
    ? [attendance.adjustmentReason, `Clock-out: ${checkOutNote}`].filter(Boolean).join('\n')
    : attendance.adjustmentReason;

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

  // Invalidate attendance caches
  await invalidateAttendanceCaches(data.employeeId);

  return {
    ...updated,
    checkOutGeoStatus,
    geoValidation: validation,
    isPendingGeoReview: validation.decision === 'pending',
  };
}
