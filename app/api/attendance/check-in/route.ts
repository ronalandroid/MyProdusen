import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { attendanceExceptionService } from '@/features/attendance/attendance-exception.service';
import { classifyAttendanceExceptionError } from '@/lib/attendance/exception-policy';
import { parseCheckInRealtimeForm } from '@/lib/attendance/realtime-selfie-form';

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
      selfie,
      deviceInfo: data.deviceInfo,
      ipAddress,
      userAgent,
    });

    return successResponse(attendance, 'Check-in berhasil');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
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
    return errorResponse(error.message || 'Check-in gagal', error.status || 400);
  }
}
