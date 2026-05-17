import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { attendanceExceptionService } from '@/features/attendance/attendance-exception.service';
import { classifyAttendanceExceptionError } from '@/lib/attendance/exception-policy';
import { parseCheckOutRealtimeForm } from '@/lib/attendance/realtime-selfie-form';
import { logAudit } from '@/lib/audit';
import { UploadError } from '@/lib/upload';
import { recordGeoOutcome } from '@/lib/attendance/geo-review-flow';

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>> | null = null;
  let employee: Awaited<ReturnType<typeof employeeService.getEmployeeByUserId>> | null = null;
  try {
    user = await requireAuth(request);
    employee = await employeeService.getEmployeeByUserId(user.userId);
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
      const auditAction = error instanceof UploadError ? 'CHECK_OUT_REJECTED_SELFIE' : 'CHECK_OUT_FAILED';
      await logAudit(
        user.userId,
        auditAction,
        'Attendance',
        employee?.id,
        undefined,
        { reason: error?.message || 'Check-out gagal' },
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
    return errorResponse(error.message || 'Check-out gagal', status);
  }
}
