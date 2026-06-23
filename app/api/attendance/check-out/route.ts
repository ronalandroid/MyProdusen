import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { attendanceExceptionService } from '@/services/attendance/attendance-exception.service';
import { classifyAttendanceExceptionError } from '@/lib/attendance/exception-policy';
import { parseCheckOutRealtimeForm } from '@/lib/attendance/realtime-selfie-form';
import { logAudit } from '@/lib/audit';
import { UploadError } from '@/lib/upload';
import { recordGeoOutcome } from '@/lib/attendance/geo-review-flow';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/core/route-handler';

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
    user = await requireAuth(request);
    // Per-employee key (see check-in): avoids 429-ing the whole shift when the
    // workforce clocks out from one shared office IP.
    const rl = await rateLimit(request, RATE_LIMITS.ATTENDANCE, `attendance:check-out:${user.userId}`);
    if (rl.limited) {
      return errorResponse('Terlalu banyak permintaan absensi. Coba lagi sebentar.', 429);
    }
    if (user.role !== 'EMPLOYEE' && user.role !== 'LEADER') {
      return forbiddenResponse('Absensi mandiri hanya untuk Karyawan dan Leader');
    }
    employee = await employeeService.getEmployeeByUserId(user.userId);
    if (!employee) {
      return errorResponse('Profil karyawan tidak ditemukan', 404);
    }
    const { data, selfie } = await parseCheckOutRealtimeForm(request);
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    const attendance = await attendanceService.checkOut({
      employeeId: employee.id,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      capturedAt: data.gpsTimestamp,
      selfie,
      deviceInfo: data.deviceInfo,
      ipAddress,
      userAgent,
      note: data.note,
    });

    await logAudit(
      user.userId,
      'CHECK_OUT',
      'Attendance',
      attendance?.id,
      undefined,
      {
        employeeId: employee.id,
        status: attendance?.status,
        geoStatus: attendance?.checkOutGeoStatus,
        isPendingGeoReview: attendance?.isPendingGeoReview,
        workLocationId: attendance?.workLocationId,
        latitude: attendance?.checkOutLatitude,
        longitude: attendance?.checkOutLongitude,
        accuracy: attendance?.checkOutAccuracy,
        distanceMeters: attendance?.checkOutDistance,
        radiusMeters: attendance?.geoValidation?.metadata?.workLocationRadius,
        decision: attendance?.geoValidation?.decision || 'accept',
        selfiePath: attendance?.checkOutSelfieUrl || attendance?.checkOutSelfie,
        selfieSizeBytes: attendance?.checkOutSelfieSizeBytes,
        selfieMimeType: attendance?.checkOutSelfieMimeType,
        totalWorkMinutes: attendance?.totalWorkMinutes,
      },
      request,
    );

    if (attendance?.geoValidation && attendance.id) {
      await recordGeoOutcome({
        request,
        user,
        employeeId: employee.id,
        attendanceId: attendance.id,
        type: 'check-out',
        validation: attendance.geoValidation,
      });
    }

    await publishRealtimeEvent(createRealtimeEvent({
      type: 'attendance.updated',
      scope: 'user',
      target: user.userId,
      payload: {
        attendanceId: attendance?.id,
        employeeId: employee.id,
        action: 'check-out',
        status: attendance?.status,
        geoStatus: attendance?.checkOutGeoStatus,
        isPendingGeoReview: attendance?.isPendingGeoReview,
      },
    }));
    await publishRealtimeEvent(createRealtimeEvent({
      type: 'dashboard.updated',
      scope: 'user',
      target: user.userId,
      payload: { employeeId: employee.id, source: 'attendance.check-out' },
    }));

    return successResponse(
      attendance,
      attendance?.isPendingGeoReview
        ? 'Check-out tersimpan dan menunggu review admin (di luar radius)'
        : 'Check-out berhasil',
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (user) {
      const auditAction = getFailureAuditAction(error, 'CHECK_OUT');
      await logAudit(
        user.userId,
        auditAction,
        'Attendance',
        employee?.id,
        undefined,
        {
          employeeId: employee?.id,
          reason: error?.message || 'Check-out gagal',
          decision: 'reject',
        },
        request,
      );
    }
    const trigger = classifyAttendanceExceptionError(error.message || 'Check-out gagal');
    if (trigger && user && employee) {
      await attendanceExceptionService.createException({
        employeeId: employee.id,
        type: trigger.type,
        reason: trigger.reason,
        requestedBy: user.userId,
      });
    }
    const status = error instanceof UploadError ? 400 : error.status || 400;
    return handleApiError(error);
  }
}
