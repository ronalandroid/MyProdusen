import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { attendanceExceptionService } from '@/features/attendance/attendance-exception.service';
import { classifyAttendanceExceptionError } from '@/lib/attendance/exception-policy';
import { parseCheckInRealtimeForm } from '@/lib/attendance/realtime-selfie-form';
import { logAudit } from '@/lib/audit';
import { UploadError } from '@/lib/upload';
import { recordGeoOutcome } from '@/lib/attendance/geo-review-flow';

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>> | null = null;
  let employee: Awaited<ReturnType<typeof employeeService.getEmployeeByUserId>> | null = null;
  try {
    user = await requireAuth(request);
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
      const auditAction = error instanceof UploadError ? 'CHECK_IN_REJECTED_SELFIE' : 'CHECK_IN_FAILED';
      await logAudit(
        user.userId,
        auditAction,
        'Attendance',
        employee?.id,
        undefined,
        { reason: error?.message || 'Check-in gagal' },
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
