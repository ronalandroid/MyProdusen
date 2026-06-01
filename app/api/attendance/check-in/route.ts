import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { attendanceExceptionService } from '@/features/attendance/attendance-exception.service';
import { classifyAttendanceExceptionError } from '@/lib/attendance/exception-policy';
import { parseCheckInRealtimeForm } from '@/lib/attendance/realtime-selfie-form';
import { logAudit } from '@/lib/audit';
import { UploadError } from '@/lib/upload';
import { recordGeoOutcome } from '@/lib/attendance/geo-review-flow';
import { acquireIdempotencyLock } from '@/lib/core/idempotency';

function getFailureAuditAction(error: unknown, type: 'CHECK_IN' | 'CHECK_OUT') {
  const message = error instanceof Error ? error.message : String(error || '');
  if (error instanceof UploadError || /selfie/i.test(message)) return `${type}_REJECTED_SELFIE`;
  if (/akurasi|accuracy/i.test(message)) return `${type}_REJECTED_GPS_ACCURACY`;
  if (/luar radius|outside radius|radius lokasi/i.test(message)) return `${type}_REJECTED_OUTSIDE_RADIUS`;
  if (/lokasi kerja/i.test(message)) return `${type}_REJECTED_WORK_LOCATION`;
  return `${type}_FAILED`;
}

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>> | null = null;
  let employee: Awaited<ReturnType<typeof employeeService.getEmployeeByUserId>> | null = null;
  try {
    const isNewRequest = await acquireIdempotencyLock(request);
    if (!isNewRequest) {
      return errorResponse('Permintaan sedang diproses', 409);
    }

    user = await requireAuth(request);
    if (user.role !== 'EMPLOYEE' && user.role !== 'LEADER') {
      return forbiddenResponse('Absensi mandiri hanya untuk Karyawan dan Leader');
    }
    employee = await employeeService.getEmployeeByUserId(user.userId);
    const { data, selfie } = await parseCheckInRealtimeForm(request);
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    const attendance = await attendanceService.checkIn({
      employeeId: employee.id,
      workLocationId: data.workLocationId,
      shiftId: data.shiftId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      capturedAt: data.gpsTimestamp,
      selfie,
      deviceInfo: data.deviceInfo,
      ipAddress,
      userAgent,
    });

    await logAudit(
      user.userId,
      'CHECK_IN',
      'Attendance',
      attendance.id,
      undefined,
      {
        employeeId: employee.id,
        workLocationId: attendance.workLocationId,
        status: attendance.status,
        geoStatus: attendance.checkInGeoStatus,
        isPendingGeoReview: attendance.isPendingGeoReview,
        latitude: attendance.checkInLatitude,
        longitude: attendance.checkInLongitude,
        accuracy: attendance.checkInAccuracy,
        distanceMeters: attendance.checkInDistance,
        radiusMeters: attendance.geoValidation?.metadata?.workLocationRadius,
        decision: attendance.geoValidation?.decision || 'accept',
        selfiePath: attendance.checkInSelfieUrl || attendance.checkInSelfie,
        selfieSizeBytes: attendance.checkInSelfieSizeBytes,
        selfieMimeType: attendance.checkInSelfieMimeType,
      },
      request,
    );

    if (attendance.geoValidation) {
      await recordGeoOutcome({
        request,
        user,
        employeeId: employee.id,
        attendanceId: attendance.id,
        type: 'check-in',
        validation: attendance.geoValidation,
      });
    }

    return successResponse(
      attendance,
      attendance.isPendingGeoReview
        ? 'Check-in tersimpan dan menunggu review admin (di luar radius)'
        : 'Check-in berhasil',
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (user) {
      const auditAction = getFailureAuditAction(error, 'CHECK_IN');
      await logAudit(
        user.userId,
        auditAction,
        'Attendance',
        employee?.id,
        undefined,
        {
          employeeId: employee?.id,
          reason: error?.message || 'Check-in gagal',
          decision: 'reject',
        },
        request,
      );
    }
    const trigger = classifyAttendanceExceptionError(error.message || 'Check-in gagal');
    if (trigger && user && employee) {
      await attendanceExceptionService.createException({
        employeeId: employee.id,
        type: trigger.type,
        reason: trigger.reason,
        requestedBy: user.userId,
      });
    }
    const status = error instanceof UploadError ? 400 : error.status || 400;
    return errorResponse(error.message || 'Check-in gagal', status);
  }
}
